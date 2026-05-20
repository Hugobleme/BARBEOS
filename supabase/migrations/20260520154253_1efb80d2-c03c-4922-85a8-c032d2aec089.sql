
create table public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active',
  outcome text,
  appointment_id uuid references public.appointments(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_turns int not null default 0,
  total_audio_seconds numeric not null default 0,
  language text not null default 'pt-BR',
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_voice_sessions_shop on public.voice_sessions(barbershop_id, started_at desc);
create index idx_voice_sessions_customer on public.voice_sessions(customer_id);
create index idx_voice_sessions_profile on public.voice_sessions(profile_id);

create table public.voice_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.voice_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool','system')),
  content text,
  tool_name text,
  tool_payload jsonb,
  tool_result jsonb,
  audio_url text,
  duration_ms int,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create index idx_voice_messages_session on public.voice_messages(session_id, created_at);

alter table public.voice_sessions enable row level security;
alter table public.voice_messages enable row level security;

create trigger voice_sessions_updated_at before update on public.voice_sessions
  for each row execute function public.tg_set_updated_at();

-- RLS voice_sessions
create policy vs_staff_all on public.voice_sessions
  for all using (is_barbershop_staff(auth.uid(), barbershop_id))
  with check (is_barbershop_staff(auth.uid(), barbershop_id));

create policy vs_self_read on public.voice_sessions
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from public.customers c where c.id = voice_sessions.customer_id and c.profile_id = auth.uid())
  );

create policy vs_self_insert on public.voice_sessions
  for insert to authenticated with check (
    profile_id is null or profile_id = auth.uid()
  );

create policy vs_guest_insert on public.voice_sessions
  for insert to anon with check (profile_id is null);

create policy vs_self_update on public.voice_sessions
  for update using (
    profile_id = auth.uid()
    or exists (select 1 from public.customers c where c.id = voice_sessions.customer_id and c.profile_id = auth.uid())
  );

-- RLS voice_messages
create policy vm_staff_all on public.voice_messages
  for all using (
    exists (select 1 from public.voice_sessions s
            where s.id = voice_messages.session_id
              and is_barbershop_staff(auth.uid(), s.barbershop_id))
  )
  with check (
    exists (select 1 from public.voice_sessions s
            where s.id = voice_messages.session_id
              and is_barbershop_staff(auth.uid(), s.barbershop_id))
  );

create policy vm_self_read on public.voice_messages
  for select using (
    exists (select 1 from public.voice_sessions s
            where s.id = voice_messages.session_id
              and (s.profile_id = auth.uid()
                   or exists (select 1 from public.customers c where c.id = s.customer_id and c.profile_id = auth.uid())))
  );

create policy vm_self_insert on public.voice_messages
  for insert to authenticated with check (
    exists (select 1 from public.voice_sessions s
            where s.id = voice_messages.session_id
              and (s.profile_id is null or s.profile_id = auth.uid()))
  );

create policy vm_guest_insert on public.voice_messages
  for insert to anon with check (
    exists (select 1 from public.voice_sessions s
            where s.id = voice_messages.session_id
              and s.profile_id is null)
  );

-- Storage bucket privado para auditoria opcional
insert into storage.buckets (id, name, public)
values ('voice-recordings', 'voice-recordings', false)
on conflict (id) do nothing;

create policy "voice_rec_staff_read" on storage.objects for select using (
  bucket_id = 'voice-recordings'
  and exists (
    select 1 from public.voice_sessions s
    where s.id::text = (storage.foldername(name))[1]
      and is_barbershop_staff(auth.uid(), s.barbershop_id)
  )
);

create policy "voice_rec_staff_insert" on storage.objects for insert with check (
  bucket_id = 'voice-recordings'
  and exists (
    select 1 from public.voice_sessions s
    where s.id::text = (storage.foldername(name))[1]
      and is_barbershop_staff(auth.uid(), s.barbershop_id)
  )
);
