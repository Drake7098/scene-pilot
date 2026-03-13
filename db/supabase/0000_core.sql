-- ScenePilotix Stage-1 core schema for Supabase Postgres
-- Target: Auth + Wallet + Billing + Ledger + Paddle events
-- Run in Supabase SQL Editor (project: sampclwsqputkeswqbbu)

begin;

create extension if not exists pgcrypto;

create schema if not exists app;

create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  tier text not null default 'free' check (tier in ('free', 'member', 'pro')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.users_profile(id) on delete cascade,
  credit_balance integer not null default 0 check (credit_balance >= 0),
  lifetime_credits_purchased integer not null default 0 check (lifetime_credits_purchased >= 0),
  lifetime_credits_used integer not null default 0 check (lifetime_credits_used >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  code text primary key,
  kind text not null check (kind in ('credit_pack', 'subscription')),
  name text not null,
  provider text not null default 'paddle',
  provider_price_id text,
  credits_amount integer,
  monthly_credit_grant integer,
  price_amount numeric(12, 2) not null check (price_amount >= 0),
  currency text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  provider text not null default 'paddle',
  provider_subscription_id text unique,
  plan_code text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  monthly_credit_grant integer not null default 0 check (monthly_credit_grant >= 0),
  last_credit_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  provider text not null,
  provider_transaction_id text unique,
  payment_type text not null,
  product_code text not null references public.products(code),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null,
  status text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null unique,
  event_type text not null,
  status text not null,
  payload jsonb not null,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  kind text not null check (kind in ('credits', 'pro')),
  product_code text not null references public.products(code),
  provider text not null default 'paddle',
  status text not null default 'created',
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  entry_type text not null check (entry_type in ('purchase', 'subscription_grant', 'admin_grant', 'reserve', 'finalize', 'rollback', 'adjustment')),
  status text not null default 'done' check (status in ('pending', 'done', 'rolled_back')),
  credits_delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  related_generation_id text,
  related_payment_id uuid references public.payments(id),
  related_ledger_id uuid references public.credit_ledger(id),
  idempotency_key text unique,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_created on public.credit_ledger (user_id, created_at desc);
create index if not exists idx_subscriptions_user on public.subscriptions (user_id, updated_at desc);
create index if not exists idx_payments_user on public.payments (user_id, created_at desc);
create index if not exists idx_checkout_sessions_user on public.checkout_sessions (user_id, created_at desc);

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_profile_touch_updated_at on public.users_profile;
create trigger trg_users_profile_touch_updated_at
before update on public.users_profile
for each row execute function app.touch_updated_at();

drop trigger if exists trg_wallets_touch_updated_at on public.wallets;
create trigger trg_wallets_touch_updated_at
before update on public.wallets
for each row execute function app.touch_updated_at();

drop trigger if exists trg_products_touch_updated_at on public.products;
create trigger trg_products_touch_updated_at
before update on public.products
for each row execute function app.touch_updated_at();

drop trigger if exists trg_subscriptions_touch_updated_at on public.subscriptions;
create trigger trg_subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function app.touch_updated_at();

drop trigger if exists trg_payments_touch_updated_at on public.payments;
create trigger trg_payments_touch_updated_at
before update on public.payments
for each row execute function app.touch_updated_at();

drop trigger if exists trg_checkout_sessions_touch_updated_at on public.checkout_sessions;
create trigger trg_checkout_sessions_touch_updated_at
before update on public.checkout_sessions
for each row execute function app.touch_updated_at();

create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, email, tier, status)
  values (new.id, coalesce(lower(new.email), ''), 'free', 'active')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.wallets (user_id, credit_balance, lifetime_credits_purchased, lifetime_credits_used)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_auth_user();

create or replace function app.seed_default_products()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.products (code, kind, name, provider, provider_price_id, credits_amount, monthly_credit_grant, price_amount, currency, active)
  values
    ('credit_100', 'credit_pack', '100 credits / $3', 'paddle', null, 100, null, 3.00, 'USD', true),
    ('credit_500', 'credit_pack', '500 credits / $12', 'paddle', null, 500, null, 12.00, 'USD', true),
    ('credit_2000', 'credit_pack', '2000 credits / $40', 'paddle', null, 2000, null, 40.00, 'USD', true),
    ('pro_monthly', 'subscription', 'Pro Monthly', 'paddle', null, null, 500, 12.00, 'USD', true)
  on conflict (code) do update
    set kind = excluded.kind,
        name = excluded.name,
        provider = excluded.provider,
        credits_amount = excluded.credits_amount,
        monthly_credit_grant = excluded.monthly_credit_grant,
        price_amount = excluded.price_amount,
        currency = excluded.currency,
        active = excluded.active,
        updated_at = now();
end;
$$;

create or replace function app.grant_credits(
  p_user_id uuid,
  p_credits integer,
  p_entry_type text,
  p_idempotency_key text,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_balance integer;
begin
  if p_credits <= 0 then
    raise exception 'invalid_credits';
  end if;
  if p_idempotency_key is not null then
    select id, credit_ledger.balance_after
    into entry_id, balance_after
    from public.credit_ledger
    where idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return next;
      return;
    end if;
  end if;

  select *
  into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  v_balance := v_wallet.credit_balance + p_credits;

  update public.wallets
  set
    credit_balance = v_balance,
    lifetime_credits_purchased = v_wallet.lifetime_credits_purchased + p_credits,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_ledger (
    user_id,
    entry_type,
    status,
    credits_delta,
    balance_after,
    idempotency_key,
    meta
  )
  values (
    p_user_id,
    p_entry_type,
    'done',
    p_credits,
    v_balance,
    p_idempotency_key,
    coalesce(p_meta, '{}'::jsonb)
  )
  returning id, credit_ledger.balance_after into entry_id, balance_after;

  return next;
end;
$$;

create or replace function app.reserve_credits(
  p_user_id uuid,
  p_credits integer,
  p_related_action text,
  p_idempotency_key text,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_balance integer;
  v_meta jsonb;
begin
  if p_credits <= 0 then
    raise exception 'invalid_credits';
  end if;
  if p_idempotency_key is not null then
    select id, credit_ledger.balance_after
    into entry_id, balance_after
    from public.credit_ledger
    where idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return next;
      return;
    end if;
  end if;

  select *
  into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  if v_wallet.credit_balance < p_credits then
    raise exception 'insufficient_credits';
  end if;

  v_balance := v_wallet.credit_balance - p_credits;
  v_meta := coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('related_action', coalesce(p_related_action, ''));

  update public.wallets
  set
    credit_balance = v_balance,
    lifetime_credits_used = v_wallet.lifetime_credits_used + p_credits,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_ledger (
    user_id,
    entry_type,
    status,
    credits_delta,
    balance_after,
    idempotency_key,
    meta
  )
  values (
    p_user_id,
    'reserve',
    'pending',
    -p_credits,
    v_balance,
    p_idempotency_key,
    v_meta
  )
  returning id, credit_ledger.balance_after into entry_id, balance_after;

  return next;
end;
$$;

create or replace function app.finalize_reserved_credits(
  p_user_id uuid,
  p_reserve_entry_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credit_ledger
  set status = 'done', entry_type = 'finalize'
  where id = p_reserve_entry_id
    and user_id = p_user_id
    and entry_type = 'reserve'
    and status = 'pending';

  return found;
end;
$$;

create or replace function app.rollback_reserved_credits(
  p_user_id uuid,
  p_reserve_entry_id uuid,
  p_idempotency_key text default null,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserve public.credit_ledger%rowtype;
  v_wallet public.wallets%rowtype;
  v_credits integer;
  v_balance integer;
begin
  if p_idempotency_key is not null then
    select id, credit_ledger.balance_after
    into entry_id, balance_after
    from public.credit_ledger
    where idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return next;
      return;
    end if;
  end if;

  select *
  into v_reserve
  from public.credit_ledger
  where id = p_reserve_entry_id
    and user_id = p_user_id
    and entry_type = 'reserve'
  for update;

  if not found then
    raise exception 'reserve_not_found';
  end if;

  if v_reserve.status <> 'pending' then
    return;
  end if;

  v_credits := abs(v_reserve.credits_delta);

  select *
  into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  v_balance := v_wallet.credit_balance + v_credits;

  update public.wallets
  set
    credit_balance = v_balance,
    lifetime_credits_used = greatest(0, v_wallet.lifetime_credits_used - v_credits),
    updated_at = now()
  where user_id = p_user_id;

  update public.credit_ledger
  set status = 'rolled_back'
  where id = p_reserve_entry_id;

  insert into public.credit_ledger (
    user_id,
    entry_type,
    status,
    credits_delta,
    balance_after,
    related_ledger_id,
    idempotency_key,
    meta
  )
  values (
    p_user_id,
    'rollback',
    'done',
    v_credits,
    v_balance,
    p_reserve_entry_id,
    p_idempotency_key,
    coalesce(p_meta, '{}'::jsonb)
  )
  returning id, credit_ledger.balance_after into entry_id, balance_after;

  return next;
end;
$$;

alter table public.users_profile enable row level security;
alter table public.wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.products enable row level security;

drop policy if exists users_profile_self_read on public.users_profile;
create policy users_profile_self_read on public.users_profile
for select
to authenticated
using (id = auth.uid());

drop policy if exists wallets_self_read on public.wallets;
create policy wallets_self_read on public.wallets
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists credit_ledger_self_read on public.credit_ledger;
create policy credit_ledger_self_read on public.credit_ledger
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists subscriptions_self_read on public.subscriptions;
create policy subscriptions_self_read on public.subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists payments_self_read on public.payments;
create policy payments_self_read on public.payments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists products_read_active_anon on public.products;
create policy products_read_active_anon on public.products
for select
to anon
using (active = true);

drop policy if exists products_read_active_auth on public.products;
create policy products_read_active_auth on public.products
for select
to authenticated
using (active = true);

revoke all on function app.seed_default_products() from public, anon, authenticated;
grant execute on function app.seed_default_products() to service_role;

revoke all on function app.grant_credits(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function app.grant_credits(uuid, integer, text, text, jsonb) to service_role;

revoke all on function app.reserve_credits(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function app.reserve_credits(uuid, integer, text, text, jsonb) to service_role;

revoke all on function app.finalize_reserved_credits(uuid, uuid) from public, anon, authenticated;
grant execute on function app.finalize_reserved_credits(uuid, uuid) to service_role;

revoke all on function app.rollback_reserved_credits(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function app.rollback_reserved_credits(uuid, uuid, text, jsonb) to service_role;

select app.seed_default_products();

commit;
