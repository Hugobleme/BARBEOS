
-- ========== FASE 1: Operação (caixa, comissões, avaliações) ==========

-- Métodos de pagamento e status de transação
do $$ begin
  create type public.payment_method as enum ('cash','debit','credit','pix','transfer','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cash_status as enum ('open','closed');
exception when duplicate_object then null; end $$;

-- Sessões de caixa (abre/fecha por barbearia/dia)
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  opened_by uuid not null,
  opened_at timestamptz not null default now(),
  opening_amount numeric not null default 0,
  closed_by uuid,
  closed_at timestamptz,
  closing_amount numeric,
  notes text,
  status cash_status not null default 'open',
  created_at timestamptz not null default now()
);
create index idx_cash_sessions_shop on public.cash_sessions(barbershop_id, status);

-- Transações de caixa (vendas / saídas)
create table public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  session_id uuid references public.cash_sessions(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  kind text not null check (kind in ('sale','expense','adjustment')),
  method payment_method not null default 'cash',
  amount numeric not null,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index idx_cash_tx_shop_date on public.cash_transactions(barbershop_id, created_at desc);
create index idx_cash_tx_appt on public.cash_transactions(appointment_id);

-- Comissões geradas por venda concluída
create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  transaction_id uuid references public.cash_transactions(id) on delete set null,
  base_amount numeric not null,
  rate numeric not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_commissions_shop_pro on public.commissions(barbershop_id, professional_id, status);

-- Avaliações pós-atendimento
create table public.satisfaction_surveys (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  shop_rating smallint check (shop_rating between 1 and 5),
  professional_rating smallint check (professional_rating between 1 and 5),
  nps smallint check (nps between 0 and 10),
  comment text,
  is_public boolean not null default false,
  answered_at timestamptz not null default now()
);
create index idx_surveys_shop on public.satisfaction_surveys(barbershop_id, answered_at desc);

-- ===== RLS =====
alter table public.cash_sessions enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.commissions enable row level security;
alter table public.satisfaction_surveys enable row level security;

-- cash_sessions: apenas staff
create policy cs_staff_all on public.cash_sessions
  for all using (is_barbershop_staff(auth.uid(), barbershop_id))
  with check (is_barbershop_staff(auth.uid(), barbershop_id));

-- cash_transactions: apenas staff
create policy ctx_staff_all on public.cash_transactions
  for all using (is_barbershop_staff(auth.uid(), barbershop_id))
  with check (is_barbershop_staff(auth.uid(), barbershop_id));

-- commissions: owner gerencia, profissional vê as suas
create policy comm_owner_all on public.commissions
  for all using (has_barbershop_role(auth.uid(), barbershop_id, 'owner'))
  with check (has_barbershop_role(auth.uid(), barbershop_id, 'owner'));

create policy comm_pro_read on public.commissions
  for select using (
    exists (select 1 from public.professionals p
            where p.id = commissions.professional_id and p.profile_id = auth.uid())
  );

-- satisfaction_surveys
-- Cliente dono do agendamento pode inserir/ler a sua
create policy surv_customer_insert on public.satisfaction_surveys
  for insert to authenticated
  with check (
    exists (select 1 from public.appointments a
            join public.customers c on c.id = a.customer_id
            where a.id = satisfaction_surveys.appointment_id
              and c.profile_id = auth.uid())
  );

create policy surv_customer_read on public.satisfaction_surveys
  for select using (
    exists (select 1 from public.appointments a
            join public.customers c on c.id = a.customer_id
            where a.id = satisfaction_surveys.appointment_id
              and c.profile_id = auth.uid())
    or is_barbershop_staff(auth.uid(), barbershop_id)
    or (is_public = true)
  );

create policy surv_staff_manage on public.satisfaction_surveys
  for all using (is_barbershop_staff(auth.uid(), barbershop_id))
  with check (is_barbershop_staff(auth.uid(), barbershop_id));
