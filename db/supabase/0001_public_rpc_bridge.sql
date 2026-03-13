begin;

create schema if not exists app;

create or replace function public.sp_grant_credits(
  p_user_id uuid,
  p_credits integer,
  p_entry_type text,
  p_idempotency_key text,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language sql
security definer
set search_path = public, app
as $$
  select * from app.grant_credits(
    p_user_id,
    p_credits,
    p_entry_type,
    p_idempotency_key,
    p_meta
  );
$$;

create or replace function public.sp_reserve_credits(
  p_user_id uuid,
  p_credits integer,
  p_related_action text,
  p_idempotency_key text,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language sql
security definer
set search_path = public, app
as $$
  select * from app.reserve_credits(
    p_user_id,
    p_credits,
    p_related_action,
    p_idempotency_key,
    p_meta
  );
$$;

create or replace function public.sp_finalize_reserved_credits(
  p_user_id uuid,
  p_reserve_entry_id uuid
)
returns boolean
language sql
security definer
set search_path = public, app
as $$
  select app.finalize_reserved_credits(
    p_user_id,
    p_reserve_entry_id
  );
$$;

create or replace function public.sp_rollback_reserved_credits(
  p_user_id uuid,
  p_reserve_entry_id uuid,
  p_idempotency_key text default null,
  p_meta jsonb default '{}'::jsonb
)
returns table(entry_id uuid, balance_after integer)
language sql
security definer
set search_path = public, app
as $$
  select * from app.rollback_reserved_credits(
    p_user_id,
    p_reserve_entry_id,
    p_idempotency_key,
    p_meta
  );
$$;

revoke all on function public.sp_grant_credits(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.sp_grant_credits(uuid, integer, text, text, jsonb) to service_role;

revoke all on function public.sp_reserve_credits(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.sp_reserve_credits(uuid, integer, text, text, jsonb) to service_role;

revoke all on function public.sp_finalize_reserved_credits(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sp_finalize_reserved_credits(uuid, uuid) to service_role;

revoke all on function public.sp_rollback_reserved_credits(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.sp_rollback_reserved_credits(uuid, uuid, text, jsonb) to service_role;

commit;

