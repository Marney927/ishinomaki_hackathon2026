-- Current-code lookup proposal only. rotate_guild_invite_code is supplied separately; do not replace it here.
-- Proposal only. NOT executed. Apply after reviewing guild_schema.sql + rls.sql.
-- Owner-only access: do not grant direct SELECT on secret_uuid_v4.
begin;
create or replace function public.get_guild_invite_code(p_guild_id integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.guilds where id = p_guild_id and owner_id = auth.uid()) then
    raise exception 'Guild owner required';
  end if;
  select secret_uuid_v4 into result from public.guilds where id = p_guild_id;
  return result;
end;
$$;
revoke all on function public.get_guild_invite_code(integer) from public, anon, authenticated;
grant execute on function public.get_guild_invite_code(integer) to authenticated;
NOTIFY pgrst, 'reload schema';
commit;


