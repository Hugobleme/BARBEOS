# Database Performance Migration Execution Report (Etapa 12C)

## 1. Migration Filename
- **Path:** `supabase/migrations/20260907130000_apply_approved_performance_cleanup.sql`
- **Execution Mode:** Controlled staged deployment via Supabase CLI (`db query` staged validation followed by `db push --linked` tracking synchronization).

---

## 2. Execution Timestamp
- **Applied At:** `2026-09-07T12:56:38-03:00`
- **Target Project:** `arsxcltldvyuomhvmtvj` (`BARBEOS`)
- **Git Baseline:** Commit `433b8d8` (`docs(db): design safe performance migration`)

---

## 3. Group A Changes — Foreign-Key Index Additions

All 9 approved foreign-key covering indexes were created and validated in PostgreSQL catalog:

| # | Table & Index Name | Column | Referenced Table | Catalog State |
|---|---|---|---|---|
| 1 | `appointment_services.idx_appointment_services_service_id` | `service_id` | `services(id)` | `indisvalid = true`, `indisready = true` |
| 2 | `cash_transactions.idx_cash_transactions_customer_id` | `customer_id` | `customers(id)` | `indisvalid = true`, `indisready = true` |
| 3 | `cash_transactions.idx_cash_transactions_professional_id` | `professional_id` | `professionals(id)` | `indisvalid = true`, `indisready = true` |
| 4 | `commissions.idx_commissions_appointment_id` | `appointment_id` | `appointments(id)` | `indisvalid = true`, `indisready = true` |
| 5 | `commissions.idx_commissions_transaction_id` | `transaction_id` | `cash_transactions(id)` | `indisvalid = true`, `indisready = true` |
| 6 | `profiles.idx_profiles_default_barbershop_id` | `default_barbershop_id` | `barbershops(id)` | `indisvalid = true`, `indisready = true` |
| 7 | `satisfaction_surveys.idx_satisfaction_surveys_professional_id` | `professional_id` | `professionals(id)` | `indisvalid = true`, `indisready = true` |
| 8 | `service_professionals.idx_service_professionals_professional_id` | `professional_id` | `professionals(id)` | `indisvalid = true`, `indisready = true` |
| 9 | `voice_sessions.idx_voice_sessions_appointment_id` | `appointment_id` | `appointments(id)` | `indisvalid = true`, `indisready = true` |

---

## 4. Group B Changes — Duplicate-Index Removals

All 7 redundant duplicate indexes were dropped, while retaining the actively utilized `idx_*` counterparts:

| # | Dropped Index | Table | Retained Active Index | Verification Status |
|---|---|---|---|---|
| 1 | `appointments_customer_id_idx` | `appointments` | `idx_appointments_customer_id` | Dropped; retained index active |
| 2 | `customers_barbershop_id_idx` | `customers` | `idx_customers_barbershop_id` | Dropped; retained index active |
| 3 | `customers_profile_id_idx` | `customers` | `idx_customers_profile_id` | Dropped; retained index active |
| 4 | `professionals_barbershop_id_idx` | `professionals` | `idx_professionals_barbershop_id` | Dropped; retained index active |
| 5 | `services_barbershop_id_idx` | `services` | `idx_services_barbershop_id` | Dropped; retained index active |
| 6 | `time_off_professional_id_idx` | `time_off` | `idx_time_off_professional_id` | Dropped; retained index active |
| 7 | `working_hours_professional_id_idx` | `working_hours` | `idx_working_hours_professional_id` | Dropped; retained index active |

---

## 5. Group C Changes — RLS Performance-Only Optimizations

All 12 approved policy rewrites and consolidations were applied and re-read from `pg_policies`:

| # | Table | Action | Policy Name | Optimized Expression |
|---|---|---|---|---|
| 1 | `appointments` | Drop duplicate | `appt_staff_read` | Consolidates into `appointments_select_policy` |
| 2 | `appointments` | Optimize SELECT | `appointments_select_policy` | `(SELECT auth.uid())` InitPlan subquery |
| 3 | `appointments` | Optimize INSERT | `appt_customer_insert` | `(SELECT auth.uid())` InitPlan subquery |
| 4 | `appointments` | Optimize UPDATE | `appt_customer_cancel` | `(SELECT auth.uid())` InitPlan subquery |
| 5 | `customers` | Optimize SELECT | `customers_staff_read` | `(SELECT auth.uid())` InitPlan subquery |
| 6 | `customers` | Optimize SELECT | `customers_select_policy` | `(SELECT auth.uid())` InitPlan subquery |
| 7 | `customers` | Optimize UPDATE | `customers_self_update` | `(SELECT auth.uid())` InitPlan subquery |
| 8 | `working_hours` | Drop duplicate | `working_hours_public_select` | Consolidates into `wh_public_read` |
| 9 | `working_hours` | Optimize ALL | `working_hours_staff_manage` | `(SELECT auth.uid())` InitPlan subquery |
| 10 | `barbershop_members` | Optimize SELECT | `members_select_own_or_staff` | `(SELECT auth.uid())` InitPlan subquery |
| 11 | `cash_sessions` | Optimize ALL | `cash_sessions_staff` | `(SELECT auth.uid())` InitPlan subquery |
| 12 | `cash_transactions` | Optimize ALL | `cash_tx_staff` | `(SELECT auth.uid())` InitPlan subquery |

---

## 6. Validation After Each Group

1. **Post-Group A Validation:**
   - Catalog check on `pg_index` confirmed all 9 new indexes exist with `indisvalid = true` and `indisready = true`.
   - `EXPLAIN` query on `service_professionals` verified `Bitmap Index Scan using idx_service_professionals_professional_id`.
   - Test suite passed: 53/53 Vitest tests, 30/30 Playwright smoke tests.
2. **Post-Group B Validation:**
   - Catalog check confirmed all 7 dropped indexes are absent (`removed_indexes: null`).
   - Catalog check confirmed all 7 retained `idx_*` indexes remain present and valid.
   - Exclusion constraint `appointments_no_overlapping_active_slots` verified active and valid.
   - `EXPLAIN` query on `appointments WHERE customer_id = ...` verified index scan using retained `idx_appointments_customer_id`.
3. **Post-Group C Validation:**
   - Catalog check on `pg_policies` confirmed all 10 optimized policies now evaluate `(SELECT auth.uid() AS uid)`.
   - Confirmed both duplicate policies (`appt_staff_read` and `working_hours_public_select`) are absent.
   - Supabase CLI `db push --linked` synchronized the schema migration record with status `upToDate: true`.

---

## 7. Rollback Status
- Complete reverse SQL statements for Groups A, B, and C are documented in Section 9 of `docs/DB_PERFORMANCE_MIGRATION_PLAN.md`.
- **Status:** Rollback was **NOT required**; all groups applied cleanly and validated with 100% success.

---

## 8. Supabase Advisor Results
- **Duplicate Indexes:** Resolved (0 duplicate index pairs remaining).
- **Foreign Key Coverage:** Resolved (all 9 target foreign keys now indexed).
- **Multiple Permissive Policies:** Resolved on `appointments` and `working_hours`.
- **Per-Row Auth Evaluation:** Resolved across the high-frequency operational tables.

---

## 9. Application Test Results

- **Unit Test Suite (`vitest run`):**
  - **4 test files passed (4/4)**
  - **53 tests passed (53/53)**
  - Duration: 1.12s
- **Browser E2E Suite (`playwright test`):**
  - **30 tests passed (30/30)**
  - 6 skipped (writable live auth flows requiring `E2E_WRITABLE_ENV=true`)
  - Duration: 33.9s
- **Linter (`npm run lint`):** Passed (0 errors, 5 existing warnings).
- **Icons Linter (`npm run lint:icons`):** Passed (0 errors).
- **Production Build (`npm run build`):** Passed cleanly (Vite client PWA bundle + TanStack Start Nitro SSR server build).

---

## 10. Production Data Modification Status
```text
No row data modified.
```
- Zero rows in `appointments`, `customers`, `professionals`, `services`, `cash_sessions`, `wallet_balances`, or any other business table were modified, created, or deleted.

---

## 11. Deferred Items
The following items were explicitly excluded from this performance migration and remain scheduled for a dedicated security review:
1. `appointment_services.appt_services_insert` (dropping permissive unauthenticated insert policy).
2. `wallet_transactions` & `loyalty_transactions` customer ledger write restrictions.
3. `barbershops` multiple concurrent insert policies consolidation.

---

## 12. Warnings for Future Stages
- The deferred security review items should be addressed in a subsequent authorization hardening task accompanied by end-to-end writable customer ledger integration tests.
