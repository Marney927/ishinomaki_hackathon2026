-- PROPOSAL ONLY: not executed. User approval required before applying.
-- Apply ONLY after diagnostics confirm UUID RPCs remain while guilds.id is integer.
-- PostgreSQL cannot change a function return type with CREATE OR REPLACE.
-- Do not use CASCADE; unexpected dependencies must be reviewed.
BEGIN;
DROP FUNCTION IF EXISTS public.create_guild(text, text);
DROP FUNCTION IF EXISTS public.join_guild(uuid);
create or replace function public.create_guild(p_name text, p_description text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'Create a profile first';
  end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120 then
    raise exception 'Invalid guild name';
  end if;
  insert into public.guilds(name, description, owner_id, created_by, updated_by)
  values (p_name, p_description, v_user, v_user, v_user) returning id into v_id;
  insert into public.guild_members(guild_id, user_id, created_by, updated_by)
  values (v_id, v_user, v_user, v_user);
  return v_id;
end;
$$;
create or replace function public.join_guild(p_secret uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'Create a profile first';
  end if;
  select id into v_id from public.guilds where secret_uuid_v4 = p_secret;
  if v_id is null then raise exception 'Invalid invite code'; end if;
  insert into public.guild_members(guild_id, user_id, created_by, updated_by)
  values (v_id, v_user, v_user, v_user)
  on conflict (guild_id, user_id) do nothing;
  return v_id;
end;
$$;
REVOKE ALL ON FUNCTION public.create_guild(text,text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_guild(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guild(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_guild(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
