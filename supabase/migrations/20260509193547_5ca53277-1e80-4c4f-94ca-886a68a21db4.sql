-- ============= ENUMS =============
create type public.app_role as enum ('owner','professional','receptionist','customer');
create type public.appointment_status as enum ('scheduled','in_progress','completed','cancelled','no_show');

-- ============= CORE TABLES =============
create table public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  address jsonb default '{}'::jsonb,
  contacts jsonb default '{}'::jsonb,
  social jsonb default '{}'::jsonb,
  logo_url text,
  banner_url text,
  settings jsonb default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  birth_date date,
  avatar_url text,
  default_barbershop_id uuid references public.barbershops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.barbershop_members (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (barbershop_id, profile_id, role)
);

-- Security definer helpers (avoid RLS recursion)
create or replace function public.has_barbershop_role(_user_id uuid, _barbershop_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.barbershop_members
    where profile_id = _user_id and barbershop_id = _barbershop_id and role = _role and active
  )
$$;

create or replace function public.is_barbershop_member(_user_id uuid, _barbershop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.barbershop_members
    where profile_id = _user_id and barbershop_id = _barbershop_id and active
  )
$$;

create or replace function public.is_barbershop_staff(_user_id uuid, _barbershop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.barbershop_members
    where profile_id = _user_id and barbershop_id = _barbershop_id and active
      and role in ('owner','professional','receptionist')
  )
$$;

-- ============= PROFESSIONALS =============
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  slug text not null,
  bio text,
  avatar_url text,
  specialties text[] default '{}',
  commission_rule jsonb default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, slug)
);
create index on public.professionals(barbershop_id);

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time
);
create index on public.working_hours(professional_id);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text
);
create index on public.time_off(professional_id);

-- ============= SERVICES =============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  description text,
  duration_min integer not null check (duration_min > 0),
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  sort integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.services(barbershop_id);

create table public.service_professionals (
  service_id uuid not null references public.services(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  primary key (service_id, professional_id)
);

-- ============= CUSTOMERS =============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  notes text,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.customers(barbershop_id);
create index on public.customers(profile_id);

-- ============= APPOINTMENTS =============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  total_amount numeric(10,2) not null default 0,
  notes text,
  source text default 'web',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.appointments(barbershop_id, scheduled_start);
create index on public.appointments(professional_id, scheduled_start);
create index on public.appointments(customer_id);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  price_snapshot numeric(10,2) not null,
  duration_snapshot integer not null
);
create index on public.appointment_services(appointment_id);

-- ============= UPDATED_AT TRIGGERS =============
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text;
begin
  for t in select unnest(array['barbershops','profiles','professionals','services','customers','appointments']) loop
    execute format('create trigger trg_%I_updated before update on public.%I for each row execute function public.tg_set_updated_at()', t, t);
  end loop;
end $$;

-- ============= AUTO PROFILE CREATION =============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============= RLS =============
alter table public.barbershops enable row level security;
alter table public.profiles enable row level security;
alter table public.barbershop_members enable row level security;
alter table public.professionals enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.services enable row level security;
alter table public.service_professionals enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;

-- barbershops: public read for active; owners update
create policy "barbershops_public_read" on public.barbershops for select using (active = true or public.is_barbershop_member(auth.uid(), id));
create policy "barbershops_owner_update" on public.barbershops for update using (public.has_barbershop_role(auth.uid(), id, 'owner'));
create policy "barbershops_authenticated_insert" on public.barbershops for insert to authenticated with check (true);

-- profiles: self read/update
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);

-- barbershop_members: members can see own membership records of their shops
create policy "members_self_read" on public.barbershop_members for select using (
  profile_id = auth.uid() or public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
);
create policy "members_owner_manage" on public.barbershop_members for all using (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
) with check (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
);
create policy "members_self_insert_owner_signup" on public.barbershop_members for insert to authenticated with check (profile_id = auth.uid());

-- professionals: public read active
create policy "professionals_public_read" on public.professionals for select using (
  active = true or public.is_barbershop_staff(auth.uid(), barbershop_id)
);
create policy "professionals_owner_manage" on public.professionals for all using (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
) with check (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
);

-- working_hours: public read (needed for slot calc)
create policy "wh_public_read" on public.working_hours for select using (true);
create policy "wh_owner_manage" on public.working_hours for all using (
  exists(select 1 from public.professionals p where p.id = professional_id and public.has_barbershop_role(auth.uid(), p.barbershop_id, 'owner'))
) with check (
  exists(select 1 from public.professionals p where p.id = professional_id and public.has_barbershop_role(auth.uid(), p.barbershop_id, 'owner'))
);

-- time_off: read by staff only
create policy "to_staff_read" on public.time_off for select using (
  exists(select 1 from public.professionals p where p.id = professional_id and public.is_barbershop_staff(auth.uid(), p.barbershop_id))
);
create policy "to_owner_manage" on public.time_off for all using (
  exists(select 1 from public.professionals p where p.id = professional_id and public.has_barbershop_role(auth.uid(), p.barbershop_id, 'owner'))
) with check (
  exists(select 1 from public.professionals p where p.id = professional_id and public.has_barbershop_role(auth.uid(), p.barbershop_id, 'owner'))
);

-- services: public read active
create policy "services_public_read" on public.services for select using (
  active = true or public.is_barbershop_staff(auth.uid(), barbershop_id)
);
create policy "services_owner_manage" on public.services for all using (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
) with check (
  public.has_barbershop_role(auth.uid(), barbershop_id, 'owner')
);

-- service_professionals: public read
create policy "sp_public_read" on public.service_professionals for select using (true);
create policy "sp_owner_manage" on public.service_professionals for all using (
  exists(select 1 from public.services s where s.id = service_id and public.has_barbershop_role(auth.uid(), s.barbershop_id, 'owner'))
) with check (
  exists(select 1 from public.services s where s.id = service_id and public.has_barbershop_role(auth.uid(), s.barbershop_id, 'owner'))
);

-- customers: staff sees all of shop, customer sees own row (linked by profile_id)
create policy "customers_staff_read" on public.customers for select using (
  public.is_barbershop_staff(auth.uid(), barbershop_id) or profile_id = auth.uid()
);
create policy "customers_staff_manage" on public.customers for all using (
  public.is_barbershop_staff(auth.uid(), barbershop_id)
) with check (
  public.is_barbershop_staff(auth.uid(), barbershop_id)
);
-- allow customers to insert their own customer record when booking
create policy "customers_self_insert" on public.customers for insert to authenticated with check (profile_id = auth.uid());
create policy "customers_self_update" on public.customers for update using (profile_id = auth.uid());

-- Public guest customer creation (no auth) for guest booking
create policy "customers_guest_insert" on public.customers for insert to anon with check (profile_id is null);

-- appointments: staff sees shop; customer sees own
create policy "appt_staff_read" on public.appointments for select using (
  public.is_barbershop_staff(auth.uid(), barbershop_id)
  or exists(select 1 from public.customers c where c.id = customer_id and c.profile_id = auth.uid())
);
create policy "appt_staff_manage" on public.appointments for all using (
  public.is_barbershop_staff(auth.uid(), barbershop_id)
) with check (
  public.is_barbershop_staff(auth.uid(), barbershop_id)
);
-- customer can create appointment if it references their own customer_id
create policy "appt_customer_insert" on public.appointments for insert to authenticated with check (
  exists(select 1 from public.customers c where c.id = customer_id and c.profile_id = auth.uid())
);
create policy "appt_customer_cancel" on public.appointments for update using (
  exists(select 1 from public.customers c where c.id = customer_id and c.profile_id = auth.uid())
);
-- guest insert
create policy "appt_guest_insert" on public.appointments for insert to anon with check (
  exists(select 1 from public.customers c where c.id = customer_id and c.profile_id is null)
);

-- appointment_services
create policy "appsv_read" on public.appointment_services for select using (
  exists(select 1 from public.appointments a where a.id = appointment_id and (
    public.is_barbershop_staff(auth.uid(), a.barbershop_id)
    or exists(select 1 from public.customers c where c.id = a.customer_id and c.profile_id = auth.uid())
  ))
);
create policy "appsv_staff_manage" on public.appointment_services for all using (
  exists(select 1 from public.appointments a where a.id = appointment_id and public.is_barbershop_staff(auth.uid(), a.barbershop_id))
) with check (
  exists(select 1 from public.appointments a where a.id = appointment_id and public.is_barbershop_staff(auth.uid(), a.barbershop_id))
);
create policy "appsv_customer_insert" on public.appointment_services for insert to authenticated with check (
  exists(select 1 from public.appointments a join public.customers c on c.id = a.customer_id where a.id = appointment_id and c.profile_id = auth.uid())
);
create policy "appsv_guest_insert" on public.appointment_services for insert to anon with check (
  exists(select 1 from public.appointments a join public.customers c on c.id = a.customer_id where a.id = appointment_id and c.profile_id is null)
);
