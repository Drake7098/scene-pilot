begin;

create table if not exists public.legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  consent_context text not null,
  docs jsonb not null default '[]'::jsonb,
  document_versions jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  source text not null,
  accepted_at timestamptz not null,
  ip_hash text,
  ua_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_legal_consents_user_created
  on public.legal_consents (user_id, created_at desc);

alter table public.legal_consents enable row level security;

drop policy if exists legal_consents_self_read on public.legal_consents;
create policy legal_consents_self_read on public.legal_consents
for select
to authenticated
using (user_id = auth.uid());

commit;
