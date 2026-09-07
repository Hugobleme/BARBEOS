# Database Performance Migration Design (Etapa 12B)

## 1. Audit Source and Date

- **Source:** Etapa 12A Read-Only Database and Repository Audit
- **Audit Date:** 2026-09-07
- **Database Environment:** Supabase Project `arsxcltldvyuomhvmtvj` (`BARBEOS`)
- **Git Commit Baseline:** `feat(observability): add privacy-safe error diagnostics`
- **Etapa 12A Recommendation:** `GO — proceed to Etapa 12B migration design`
- **Current Task Mode:** Strict migration design and validation planning (**NO DDL or data changes applied**)

---

## 2. Current Database Assumptions & Preconditions

1. **Schema & RLS:** Exactly 31 user tables exist in schema `public`, all with Row Level Security active (`relrowsecurity = true`).
2. **Appointment Atomicity Invariant:**
   - Active exclusion constraint: `appointments_no_overlapping_active_slots`
     ```sql
     EXCLUDE USING gist (
         professional_id WITH =,
         tstzrange(scheduled_start, scheduled_end, '[)'::text) WITH &&
     ) WHERE ((status = ANY (ARRAY['scheduled'::appointment_status, 'in_progress'::appointment_status])))
     ```
   - Active interval check constraint: `appointments_scheduled_interval_valid`
     ```sql
     CHECK (scheduled_end > scheduled_start)
     ```
3. **Atomic Booking RPC:**
   - Function `public.create_public_booking(...)` is active, owned by `postgres`, configured as `SECURITY DEFINER`, and executable by roles `anon`, `authenticated`, and `service_role`.
4. **Current Operational Integrity:**
   - Overlapping active appointment slots: `0`
   - Deadlocks in `pg_stat_database`: `0`
   - Active lock conflicts: `0`
   - Production rows: Not modified by this design.

---

## 3. Group A — Safe Index Additions (Foreign Keys)

### Audit Classification: `ADD INDEX`
These 9 foreign keys currently lack dedicated btree indexes on the referencing child columns. Adding them accelerates foreign-key constraint checks (`ON DELETE RESTRICT` / `SET NULL` / `CASCADE`), joins, and domain queries.

| # | Child Table & FK Column | Referenced Table | On Delete | Audit Classification | Application Flow Benefited |
|---|---|---|---|---|---|
| 1 | `appointment_services.service_id` | `services(id)` | `RESTRICT` | `ADD INDEX` | Joins in appointment details; prevents sequential scans on service deletions. |
| 2 | `cash_transactions.customer_id` | `customers(id)` | `SET NULL` | `ADD INDEX` | PDV transaction queries filtered by customer; avoids relation locks during customer removal. |
| 3 | `cash_transactions.professional_id` | `professionals(id)` | `SET NULL` | `ADD INDEX` | Commission reporting and professional sales history. |
| 4 | `commissions.appointment_id` | `appointments(id)` | `SET NULL` | `ADD INDEX` | Commission status reconciliation upon appointment cancellation/completion. |
| 5 | `commissions.transaction_id` | `cash_transactions(id)` | `SET NULL` | `ADD INDEX` | Cash register reconciliation with staff commission ledgers. |
| 6 | `profiles.default_barbershop_id` | `barbershops(id)` | `SET NULL` | `ADD INDEX` | Sign-in default shop context resolution. |
| 7 | `satisfaction_surveys.professional_id` | `professionals(id)` | `SET NULL` | `ADD INDEX` | Staff rating aggregation and feedback reporting. |
| 8 | `service_professionals.professional_id` | `professionals(id)` | `CASCADE` | `ADD INDEX` | Professional availability lookup (current PK `(service_id, professional_id)` cannot use leading column for professional-first filters). |
| 9 | `voice_sessions.appointment_id` | `appointments(id)` | `SET NULL` | `ADD INDEX` | Aurora voice assistant appointment linkage. |

---

## 4. Group B — Safe Duplicate-Index Removals

### Audit Classification: `SAFE CANDIDATE FOR REMOVAL`
Exactly 7 duplicate index pairs were identified where two identical non-unique btree indexes exist on the same table and column without partial predicates. In all 7 cases, the `idx_*` variant is actively utilized by PostgreSQL query planner, while the `*_idx` variant has 0 scans.

### Verification Checklist (All 7 Candidates)
1. **Not a Primary Key:** Confirmed (PKs use separate indexes named `<table_name>_pkey`).
2. **Not a Unique Constraint:** Confirmed (`indisunique = false`).
3. **Not an Exclusion Constraint:** Confirmed (exclusion constraint uses GiST on `appointments`).
4. **Truly Identical Definition:** Confirmed (same column list, same btree access method, no `WHERE` predicate).
5. **Retained Index Valid and Ready:** Confirmed (`indisvalid = true` and `indisready = true` on all retained `idx_*` indexes).
6. **Retained Index Name Stable:** Confirmed (`idx_appointments_customer_id`, `idx_customers_barbershop_id`, `idx_customers_profile_id`, `idx_professionals_barbershop_id`, `idx_services_barbershop_id`, `idx_time_off_professional_id`, `idx_working_hours_professional_id`).
7. **No Constraint Removed:** Confirmed (dropping `*_idx` does not affect any foreign key or check constraint).
8. **Query Plans Indifferent to Dropped Index:** Confirmed via `EXPLAIN` tests; PostgreSQL already targets the retained `idx_*` index.

| Table | Index to Drop (Redundant) | Retained Index (Active) | Columns | Scans (Retained vs Dropped) | Classification |
|---|---|---|---|---|---|
| `appointments` | `appointments_customer_id_idx` | `idx_appointments_customer_id` | `(customer_id)` | 1 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `customers` | `customers_barbershop_id_idx` | `idx_customers_barbershop_id` | `(barbershop_id)` | 105 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `customers` | `customers_profile_id_idx` | `idx_customers_profile_id` | `(profile_id)` | 14 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `professionals` | `professionals_barbershop_id_idx` | `idx_professionals_barbershop_id` | `(barbershop_id)` | 167 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `services` | `services_barbershop_id_idx` | `idx_services_barbershop_id` | `(barbershop_id)` | 151 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `time_off` | `time_off_professional_id_idx` | `idx_time_off_professional_id` | `(professional_id)` | 19 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |
| `working_hours` | `working_hours_professional_id_idx` | `idx_working_hours_professional_id` | `(professional_id)` | 73 vs 0 | `SAFE CANDIDATE FOR REMOVAL` |

---

## 5. Group C — RLS Performance-Only Changes

### Audit Classification: `SAFE OPTIMIZATION CANDIDATE`
In PostgreSQL RLS, calling volatile functions such as `auth.uid()` directly causes per-row evaluation during query execution. Wrapping them in a scalar subquery `(SELECT auth.uid())` allows the PostgreSQL optimizer to evaluate the identity once as an `InitPlan` for the entire statement.

Furthermore, exact duplicate permissive policies (where two policies have identical roles, commands, and expressions) cause redundant evaluations and can be safely consolidated.

### 1. Appointments Table
- **Consolidation:** Drop duplicate policy `appt_staff_read`.
  - *Reason:* Identical in roles (`authenticated`), command (`SELECT`), and qualifier to `appointments_select_policy`.
- **Optimization:** Rewrite `appointments_select_policy`:
  - *Original Expression:*
    ```sql
    (is_barbershop_staff(auth.uid(), barbershop_id) OR (EXISTS (
        SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
    )))
    ```
  - *Proposed Optimized Expression:*
    ```sql
    (is_barbershop_staff((SELECT auth.uid()), barbershop_id) OR (EXISTS (
        SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = (SELECT auth.uid())
    )))
    ```
  - *Equivalence & Impact:* Identical boolean logic. Prevents per-row function execution across appointment calendar queries.
- **Optimization:** Rewrite `appt_customer_insert`:
  - *Original Expression:* `WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()))`
  - *Proposed Expression:* `WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = (SELECT auth.uid())))`
- **Optimization:** Rewrite `appt_customer_cancel`:
  - *Original Expression:* `USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()))`
  - *Proposed Expression:* `USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = appointments.customer_id AND c.profile_id = (SELECT auth.uid())))`

### 2. Customers Table
- **Optimization:** Rewrite `customers_staff_read`:
  - *Original Expression:* `USING (is_barbershop_staff(auth.uid(), barbershop_id))`
  - *Proposed Expression:* `USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))`
- **Optimization:** Rewrite `customers_select_policy`:
  - *Original Expression:* `USING (((profile_id IS NOT NULL) AND (profile_id = auth.uid())) OR (EXISTS (...)))`
  - *Proposed Expression:* `USING (((profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid()))) OR (EXISTS (...)))`
- **Optimization:** Rewrite `customers_self_update`:
  - *Original Expression:* `USING ((profile_id IS NOT NULL) AND (profile_id = auth.uid()))`
  - *Proposed Expression:* `USING ((profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid())))`

### 3. Working Hours Table
- **Consolidation:** Drop duplicate policy `working_hours_public_select`.
  - *Reason:* Identical in roles (`public`), command (`SELECT`), and qualifier (`true`) to `wh_public_read`.
- **Optimization:** Rewrite `working_hours_staff_manage`:
  - *Original Expression:* `is_barbershop_staff(auth.uid(), p.barbershop_id)`
  - *Proposed Expression:* `is_barbershop_staff((SELECT auth.uid()), p.barbershop_id)`

### 4. Barbershop Members Table
- **Optimization:** Rewrite `members_select_own_or_staff`:
  - *Original Expression:* `USING ((profile_id = auth.uid()) OR is_barbershop_staff(auth.uid(), barbershop_id))`
  - *Proposed Expression:* `USING ((profile_id = (SELECT auth.uid())) OR is_barbershop_staff((SELECT auth.uid()), barbershop_id))`

### 5. Cash Sessions & Transactions
- **Optimization:** Rewrite `cash_sessions_staff`:
  - *Original Expression:* `USING (is_barbershop_staff(auth.uid(), barbershop_id))`
  - *Proposed Expression:* `USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))`
- **Optimization:** Rewrite `cash_tx_staff`:
  - *Original Expression:* `USING (is_barbershop_staff(auth.uid(), barbershop_id))`
  - *Proposed Expression:* `USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))`

---

## 6. Deferred Items (Separate Review Required)

The following items from the Etapa 12A audit involve behavioral or semantic authorization modifications and are **excluded** from this performance migration:

1. **`appointment_services.appt_services_insert` Policy:**
   - *Current State:* Allows `public` (including `anon`) to insert into `appointment_services` if `(appointment_id IS NOT NULL AND service_id IS NOT NULL)`.
   - *Classification:* `DEFERRED — separate security review required`.
   - *Reason:* Dropping this policy is a security hardening change, not a performance optimization. It requires verification that guest bookings rely solely on RPC `create_public_booking` or `appsv_guest_insert`.
2. **`wallet_transactions` & `loyalty_transactions` Customer Mutation Policies:**
   - *Current State:* `wallet_tx_policy` and `loyalty_tx_policy` are `cmd: ALL` for customers belonging to the transaction.
   - *Classification:* `DEFERRED — separate security review required`.
   - *Reason:* Restricting ledger writes to triggers/staff alters the policy surface and requires dedicated financial transaction testing.
3. **`barbershops` Multiple Insert Policies:**
   - *Current State:* 3 concurrent INSERT policies (`barbershops_admin_insert`, `barbershops_authenticated_insert`, `barbershops_insert_auth`).
   - *Classification:* `DEFERRED — separate security review required`.

---

## 7. Migration Framework & Concurrency Strategy

### Supabase CLI & Transaction Limitation
In PostgreSQL, `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` **cannot execute inside an active transaction block** (`ERROR: 25001: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`).

When Supabase applies migrations via `supabase db push` or `supabase migration up`, each migration file is executed inside an implicit transaction block (`BEGIN ... COMMIT`).

### Deployment Strategy
1. **Low-Volume Nature of BARBEOS Staging/Production:**
   - Current table sizes are modest (e.g., `appointments`: 1 row, `customers`: 1 row, `working_hours`: 15 rows).
   - Standard `CREATE INDEX IF NOT EXISTS` takes < 5 milliseconds per index and takes a `SHARE` lock on the relation, which blocks concurrent writes only for a few milliseconds.
2. **Dual Execution Options:**
   - **Strategy Option 1 (Zero Lock / Production High Concurrency):** Run Group A and Group B statements via non-transactional execution (e.g., via Supabase Dashboard SQL Editor or direct client with `autocommit = on`). Statements use `CONCURRENTLY`.
   - **Strategy Option 2 (Supabase CLI Automated Migration File):** Omit `CONCURRENTLY` inside the `.sql` migration file so it executes seamlessly within Supabase's transactional migration runner without throwing `ERROR 25001`.

Below, both DDL drafts are provided for complete clarity.

---

## 8. SQL Drafts for Migration

### Draft A: Group A — Safe Index Additions (Foreign Keys)

#### Non-Transactional Production Runner (Concurrent)
```sql
-- ============================================================================
-- GROUP A: FOREIGN KEY COVERING INDEXES (CONCURRENT)
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_services_service_id 
    ON public.appointment_services(service_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_transactions_customer_id 
    ON public.cash_transactions(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_transactions_professional_id 
    ON public.cash_transactions(professional_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commissions_appointment_id 
    ON public.commissions(appointment_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commissions_transaction_id 
    ON public.commissions(transaction_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_default_barbershop_id 
    ON public.profiles(default_barbershop_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_satisfaction_surveys_professional_id 
    ON public.satisfaction_surveys(professional_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_professionals_professional_id 
    ON public.service_professionals(professional_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_sessions_appointment_id 
    ON public.voice_sessions(appointment_id);
```

#### Transactional Migration File (Standard Supabase CLI)
```sql
-- ============================================================================
-- GROUP A: FOREIGN KEY COVERING INDEXES (TRANSACTIONAL)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id 
    ON public.appointment_services(service_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_customer_id 
    ON public.cash_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_professional_id 
    ON public.cash_transactions(professional_id);

CREATE INDEX IF NOT EXISTS idx_commissions_appointment_id 
    ON public.commissions(appointment_id);

CREATE INDEX IF NOT EXISTS idx_commissions_transaction_id 
    ON public.commissions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_profiles_default_barbershop_id 
    ON public.profiles(default_barbershop_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_professional_id 
    ON public.satisfaction_surveys(professional_id);

CREATE INDEX IF NOT EXISTS idx_service_professionals_professional_id 
    ON public.service_professionals(professional_id);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_appointment_id 
    ON public.voice_sessions(appointment_id);
```

---

### Draft B: Group B — Safe Duplicate-Index Removals

#### Non-Transactional Production Runner (Concurrent)
```sql
-- ============================================================================
-- GROUP B: DUPLICATE INDEX REMOVALS (CONCURRENT)
-- ============================================================================

DROP INDEX CONCURRENTLY IF EXISTS public.appointments_customer_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.customers_barbershop_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.customers_profile_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.professionals_barbershop_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.services_barbershop_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.time_off_professional_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.working_hours_professional_id_idx;
```

#### Transactional Migration File (Standard Supabase CLI)
```sql
-- ============================================================================
-- GROUP B: DUPLICATE INDEX REMOVALS (TRANSACTIONAL)
-- ============================================================================

DROP INDEX IF EXISTS public.appointments_customer_id_idx;
DROP INDEX IF EXISTS public.customers_barbershop_id_idx;
DROP INDEX IF EXISTS public.customers_profile_id_idx;
DROP INDEX IF EXISTS public.professionals_barbershop_id_idx;
DROP INDEX IF EXISTS public.services_barbershop_id_idx;
DROP INDEX IF EXISTS public.time_off_professional_id_idx;
DROP INDEX IF EXISTS public.working_hours_professional_id_idx;
```

---

### Draft C: Group C — RLS Performance-Only Optimizations

```sql
-- ============================================================================
-- GROUP C: RLS PERFORMANCE OPTIMIZATIONS (SCALAR INITPLAN WRAPPING)
-- ============================================================================

-- 1. APPOINTMENTS
-- Consolidate duplicate SELECT policy
DROP POLICY IF EXISTS "appt_staff_read" ON public.appointments;

-- Optimize primary SELECT policy
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        is_barbershop_staff((SELECT auth.uid()), barbershop_id)
        OR (EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        ))
    );

-- Optimize customer INSERT policy
DROP POLICY IF EXISTS "appt_customer_insert" ON public.appointments;
CREATE POLICY "appt_customer_insert" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        )
    );

-- Optimize customer CANCEL policy
DROP POLICY IF EXISTS "appt_customer_cancel" ON public.appointments;
CREATE POLICY "appt_customer_cancel" ON public.appointments
    FOR UPDATE TO public
    USING (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        )
    );

-- 2. CUSTOMERS
-- Optimize staff read policy
DROP POLICY IF EXISTS "customers_staff_read" ON public.customers;
CREATE POLICY "customers_staff_read" ON public.customers
    FOR SELECT TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id));

-- Optimize self/staff read policy
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT TO public
    USING (
        ((profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid())))
        OR (EXISTS (
            SELECT 1 FROM barbershop_members bm 
            WHERE bm.barbershop_id = customers.barbershop_id 
              AND bm.profile_id = (SELECT auth.uid())
              AND bm.active = true
        ))
    );

-- Optimize self update policy
DROP POLICY IF EXISTS "customers_self_update" ON public.customers;
CREATE POLICY "customers_self_update" ON public.customers
    FOR UPDATE TO public
    USING (
        (profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid()))
    );

-- 3. WORKING HOURS
-- Consolidate duplicate public read policy
DROP POLICY IF EXISTS "working_hours_public_select" ON public.working_hours;

-- Optimize staff manage policy
DROP POLICY IF EXISTS "working_hours_staff_manage" ON public.working_hours;
CREATE POLICY "working_hours_staff_manage" ON public.working_hours
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff((SELECT auth.uid()), p.barbershop_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff((SELECT auth.uid()), p.barbershop_id)
        )
    );

-- 4. BARBERSHOP MEMBERS
DROP POLICY IF EXISTS "members_select_own_or_staff" ON public.barbershop_members;
CREATE POLICY "members_select_own_or_staff" ON public.barbershop_members
    FOR SELECT TO authenticated
    USING (
        (profile_id = (SELECT auth.uid())) 
        OR is_barbershop_staff((SELECT auth.uid()), barbershop_id)
    );

-- 5. CASH SESSIONS & TRANSACTIONS
DROP POLICY IF EXISTS "cash_sessions_staff" ON public.cash_sessions;
CREATE POLICY "cash_sessions_staff" ON public.cash_sessions
    FOR ALL TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))
    WITH CHECK (is_barbershop_staff((SELECT auth.uid()), barbershop_id));

DROP POLICY IF EXISTS "cash_tx_staff" ON public.cash_transactions;
CREATE POLICY "cash_tx_staff" ON public.cash_transactions
    FOR ALL TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))
    WITH CHECK (is_barbershop_staff((SELECT auth.uid()), barbershop_id));
```

---

## 9. Rollback SQL for Each Group

### Rollback Group A (Index Additions)
```sql
-- Drop the newly created foreign key indexes
DROP INDEX IF EXISTS public.idx_appointment_services_service_id;
DROP INDEX IF EXISTS public.idx_cash_transactions_customer_id;
DROP INDEX IF EXISTS public.idx_cash_transactions_professional_id;
DROP INDEX IF EXISTS public.idx_commissions_appointment_id;
DROP INDEX IF EXISTS public.idx_commissions_transaction_id;
DROP INDEX IF EXISTS public.idx_profiles_default_barbershop_id;
DROP INDEX IF EXISTS public.idx_satisfaction_surveys_professional_id;
DROP INDEX IF EXISTS public.idx_service_professionals_professional_id;
DROP INDEX IF EXISTS public.idx_voice_sessions_appointment_id;
```

### Rollback Group B (Duplicate Indexes)
```sql
-- Recreate the duplicate indexes exactly as they previously existed
CREATE INDEX IF NOT EXISTS appointments_customer_id_idx ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS customers_barbershop_id_idx ON public.customers(barbershop_id);
CREATE INDEX IF NOT EXISTS customers_profile_id_idx ON public.customers(profile_id);
CREATE INDEX IF NOT EXISTS professionals_barbershop_id_idx ON public.professionals(barbershop_id);
CREATE INDEX IF NOT EXISTS services_barbershop_id_idx ON public.services(barbershop_id);
CREATE INDEX IF NOT EXISTS time_off_professional_id_idx ON public.time_off(professional_id);
CREATE INDEX IF NOT EXISTS working_hours_professional_id_idx ON public.working_hours(professional_id);
```

### Rollback Group C (RLS Performance)
```sql
-- Restore duplicate and original un-optimized RLS policies

-- Appointments
CREATE POLICY "appt_staff_read" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        is_barbershop_staff(auth.uid(), barbershop_id)
        OR (EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        is_barbershop_staff(auth.uid(), barbershop_id)
        OR (EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "appt_customer_insert" ON public.appointments;
CREATE POLICY "appt_customer_insert" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "appt_customer_cancel" ON public.appointments;
CREATE POLICY "appt_customer_cancel" ON public.appointments
    FOR UPDATE TO public
    USING (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = auth.uid()
        )
    );

-- Customers
DROP POLICY IF EXISTS "customers_staff_read" ON public.customers;
CREATE POLICY "customers_staff_read" ON public.customers
    FOR SELECT TO authenticated
    USING (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT TO public
    USING (
        ((profile_id IS NOT NULL) AND (profile_id = auth.uid()))
        OR (EXISTS (
            SELECT 1 FROM barbershop_members bm 
            WHERE bm.barbershop_id = customers.barbershop_id 
              AND bm.profile_id = auth.uid()
              AND bm.active = true
        ))
    );

DROP POLICY IF EXISTS "customers_self_update" ON public.customers;
CREATE POLICY "customers_self_update" ON public.customers
    FOR UPDATE TO public
    USING ((profile_id IS NOT NULL) AND (profile_id = auth.uid()));

-- Working Hours
CREATE POLICY "working_hours_public_select" ON public.working_hours
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "working_hours_staff_manage" ON public.working_hours;
CREATE POLICY "working_hours_staff_manage" ON public.working_hours
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff(auth.uid(), p.barbershop_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff(auth.uid(), p.barbershop_id)
        )
    );

-- Barbershop Members
DROP POLICY IF EXISTS "members_select_own_or_staff" ON public.barbershop_members;
CREATE POLICY "members_select_own_or_staff" ON public.barbershop_members
    FOR SELECT TO authenticated
    USING ((profile_id = auth.uid()) OR is_barbershop_staff(auth.uid(), barbershop_id));

-- Cash Sessions & Transactions
DROP POLICY IF EXISTS "cash_sessions_staff" ON public.cash_sessions;
CREATE POLICY "cash_sessions_staff" ON public.cash_sessions
    FOR ALL TO authenticated
    USING (is_barbershop_staff(auth.uid(), barbershop_id))
    WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "cash_tx_staff" ON public.cash_transactions;
CREATE POLICY "cash_tx_staff" ON public.cash_transactions
    FOR ALL TO authenticated
    USING (is_barbershop_staff(auth.uid(), barbershop_id))
    WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));
```

---

## 10. Query-Plan & Lock Rationale

### Query Plan Review
- **Retained Indexes (Group B):** As verified by `EXPLAIN (COSTS)` queries on PostgreSQL catalog:
  - Queries like `SELECT * FROM appointments WHERE customer_id = $1` seamlessly use `Index Scan using idx_appointments_customer_id`.
  - Dropping the redundant duplicate `appointments_customer_id_idx` leaves the cost curve completely identical.
- **New Indexes (Group A):**
  - Table `service_professionals` previously had only composite PK `(service_id, professional_id)`. Querying `service_professionals WHERE professional_id = $1` resulted in sequential table scans. The new index `idx_service_professionals_professional_id` allows instant index scans for the public availability generator.

### Lock Level & Concurrency Analysis
- `CREATE INDEX CONCURRENTLY`: Requires `SHARE UPDATE EXCLUSIVE` lock. Reads and writes (SELECT, INSERT, UPDATE, DELETE) continue unblocked throughout index creation.
- `DROP INDEX CONCURRENTLY`: Requires `SHARE UPDATE EXCLUSIVE` lock. Reads and writes continue unblocked.
- Standard `CREATE INDEX`: Requires `SHARE` lock. Blocks writes for duration of execution (< 5ms on current table sizes).
- Policy replacement (`DROP/CREATE POLICY`): Takes `ACCESS EXCLUSIVE` lock on the specific table for microseconds only.

---

## 11. RLS Regression Matrix

Prior to and immediately following application of Group C, each scenario must be tested:

| # | Test Scenario | Target Role | Expected Outcome | Verification Method |
|---|---|---|---|---|
| 1 | Public read of active barbershop | `anon` | Allowed (`active = true`) | HTTP GET `/agendar?barbershop=barbeos-prestige-62` |
| 2 | Public read of working hours | `anon` | Allowed (`wh_public_read`) | Slot computation query returns slots |
| 3 | Public atomic booking RPC | `anon` | Allowed | `create_public_booking` executes with security definer |
| 4 | Double-booking same slot | `anon` | Denied with `BOOKING_SLOT_TAKEN` | Playwright concurrent test / exclusion constraint trigger |
| 5 | Authenticated customer read own appointments | `authenticated` | Allowed (matched on `profile_id`) | Client queries `/minha-conta` |
| 6 | Authenticated customer cancel own appointment | `authenticated` | Allowed | Appointment status changes to `cancelled` |
| 7 | Cross-tenant appointment read attempt | `authenticated` | Denied (returns empty array) | Query with foreign `barbershop_id` |
| 8 | Cross-tenant appointment update attempt | `authenticated` | Denied (0 rows affected) | Update with foreign `barbershop_id` |
| 9 | Staff agenda access | `authenticated` (staff) | Allowed for own shop only | Agenda view renders staff appointments |
| 10 | Staff cash drawer session & transaction write | `authenticated` (staff) | Allowed for own shop only | PDV transaction successfully recorded |
| 11 | Owner manage working hours | `authenticated` (owner) | Allowed | Save weekly hours in `/admin/horarios` |
| 12 | Professional access time-off records | `authenticated` (pro) | Allowed for own professional ID | Professional schedules view |

---

## 12. Backup, Staged Deployment & Verification Plan

### Staged Rollout Stages

```
+--------------------------------------------------------------------+
| STAGE 0: Pre-Flight Safety Verification                            |
| - Verify active PITR backup in Supabase Dashboard                  |
| - Verify exclusion constraint & create_public_booking grants       |
| - Run test suite (Vitest + Playwright smoke)                       |
+---------------------------------+----------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
| STAGE 1: Apply Group A (Safe FK Index Additions)                   |
| - Apply 9 FK indexes                                               |
| - Verify indisvalid = true on all 9 indexes in pg_index            |
| - Run public booking & directory smoke tests                       |
+---------------------------------+----------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
| STAGE 2: Apply Group B (Safe Duplicate-Index Drops)                |
| - Verify retained idx_* indexes are active                         |
| - Drop 7 redundant *_idx duplicates                                |
| - Run EXPLAIN on retained index scan paths                         |
+---------------------------------+----------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
| STAGE 3: Apply Group C (RLS Performance Optimizations)             |
| - Apply InitPlan subquery policy updates                           |
| - Consolidate duplicate SELECT policies                            |
| - Run full RLS regression matrix (Scenarios 1-12)                  |
+---------------------------------+----------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
| STAGE 4: Post-Deploy Health Check                                  |
| - Check pg_stat_activity for locks or blocked backends             |
| - Check deadlocks = 0 in pg_stat_database                          |
| - Run Supabase Advisor & confirm zero duplicate warnings           |
+--------------------------------------------------------------------+
```

### Stop & Rollback Criteria
Immediately halt deployment and execute the respective rollback script if any of the following occurs:
1. An index build fails or remains in invalid state (`indisvalid = false`).
2. An appointment reservation fails or reports RLS permission denied.
3. The atomic exclusion constraint `appointments_no_overlapping_active_slots` fails to trigger on double-booking.
4. An authenticated user experiences cross-tenant leakage or unintended denial of access.
5. `pg_stat_database` records a deadlock or persistent lock conflict.

---

## 13. Test Requirements Before Execution

Before executing any stage in Etapa 12C:
```bash
npm ci
npm run lint
npm run lint:icons
npm run build
npm test
npx playwright test
```

---

## 14. Confirmation of Non-Modification

During the preparation and documentation of this migration design:
- **Zero** production tables were altered.
- **Zero** production indexes were created or dropped.
- **Zero** RLS policies were modified.
- **Zero** database functions were altered.
- **Zero** production records were mutated.
- All proposals remain strictly documented design specifications.
