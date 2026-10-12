-- PROPOSAL ONLY: not executed. Review against the deployed database first.
-- Restores audit triggers, participant validation, RLS and grants after table recreation.
-- Does not drop tables or overwrite the supplied management RPCs.
BEGIN;

create or replace function public.set_audit_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Authentication required for audited writes';
  end if;
  if tg_op = 'INSERT' then
    new.created_by := actor;
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := actor;
  new.updated_at := now();
  return new;
end;
$$;

DROP TRIGGER IF EXISTS guilds_audit ON public.guilds;
CREATE TRIGGER guilds_audit BEFORE INSERT OR UPDATE ON public.guilds
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP TRIGGER IF EXISTS guild_members_audit ON public.guild_members;
CREATE TRIGGER guild_members_audit BEFORE INSERT OR UPDATE ON public.guild_members
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP TRIGGER IF EXISTS tasks_audit ON public.tasks;
CREATE TRIGGER tasks_audit BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP TRIGGER IF EXISTS task_participants_audit ON public.task_participants;
CREATE TRIGGER task_participants_audit BEFORE INSERT OR UPDATE ON public.task_participants
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

create or replace function public.validate_task_participant()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare task_guild integer;
begin
  select guild_id into task_guild from public.tasks where id = new.task_id;
  if task_guild is null or not exists (
    select 1 from public.guild_members
    where guild_id = task_guild and user_id = new.user_id
  ) then
    raise exception 'Task participant must belong to the task guild';
  end if;
  return new;
end;
$$;
DROP TRIGGER IF EXISTS task_participant_membership ON public.task_participants;
CREATE TRIGGER task_participant_membership BEFORE INSERT OR UPDATE OF task_id, user_id ON public.task_participants FOR EACH ROW EXECUTE FUNCTION public.validate_task_participant();

-- Guild task board / Supabase PostgreSQL: RLS and API privileges
-- guild_schema.sql の後に実行。テーブルとRPCの作成は同ファイルに定義。
-- 既存の同名ポリシーは置き換え可能。独自に追加したポリシーは変更しません。

-- Enable RLS before allowing browser clients to use the tables.
alter table public.profiles enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_participants enable row level security;

-- Security-definer membership helper avoids recursive RLS checks on guild_members.
create or replace function public.is_guild_member(p_guild_id integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.guild_members
    where guild_id = p_guild_id and user_id = auth.uid()
  );
$$;
revoke all on function public.is_guild_member(integer) from public, anon, authenticated;
grant execute on function public.is_guild_member(integer) to authenticated;

create or replace function public.is_guild_owner(p_guild_id integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.guilds
    where id = p_guild_id and owner_id = auth.uid()
  );
$$;
revoke all on function public.is_guild_owner(integer) from public, anon, authenticated;
grant execute on function public.is_guild_owner(integer) to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or exists (
  select 1 from public.guild_members gm
  where gm.user_id = profiles.id and public.is_guild_member(gm.guild_id)
));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists guilds_read on public.guilds;
create policy guilds_read on public.guilds for select to authenticated
using (public.is_guild_member(id));
drop policy if exists guilds_update on public.guilds;
create policy guilds_update on public.guilds for update to authenticated
using (public.is_guild_owner(id)) with check (public.is_guild_owner(id));

drop policy if exists guild_members_read on public.guild_members;
create policy guild_members_read on public.guild_members for select to authenticated
using (public.is_guild_member(guild_id));

drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
using (public.is_guild_member(guild_id));
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check (public.is_guild_member(guild_id) and created_by = (select auth.uid()));
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
using (public.is_guild_owner(guild_id) or created_by = (select auth.uid()))
with check (public.is_guild_owner(guild_id) or created_by = (select auth.uid()));
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
using (public.is_guild_owner(guild_id) or created_by = (select auth.uid()));

drop policy if exists task_participants_read on public.task_participants;
create policy task_participants_read on public.task_participants for select to authenticated
using (exists (select 1 from public.tasks t where t.id = task_id and public.is_guild_member(t.guild_id)));
drop policy if exists task_participants_insert on public.task_participants;
create policy task_participants_insert on public.task_participants for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.tasks t where t.id = task_id and public.is_guild_member(t.guild_id)
));
drop policy if exists task_participants_delete on public.task_participants;
create policy task_participants_delete on public.task_participants for delete to authenticated
using (user_id = (select auth.uid()) and exists (
  select 1 from public.tasks t where t.id = task_id and public.is_guild_member(t.guild_id)
));

-- RPC実行権限。
grant execute on function public.create_guild(text,text) to authenticated;
grant execute on function public.join_guild(uuid) to authenticated;

-- 既定の広い権限を解除し、必要な操作・カラムだけを許可。
revoke all on public.profiles, public.guild_members, public.tasks, public.task_participants
  from anon, authenticated;
-- Avoid exposing the secret code and audit columns via table API writes/reads.
revoke all on public.guilds from anon, authenticated;
grant select (id, name, description, owner_id, created_by, created_at, updated_by, updated_at)
  on public.guilds to authenticated;
grant update (name, description) on public.guilds to authenticated;
grant select on public.profiles, public.guild_members, public.tasks, public.task_participants to authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant insert (guild_id, title, description, due_date, owner_id, status, is_published) on public.tasks to authenticated;
grant update (title, description, due_date, owner_id, status, is_published) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;
grant insert (task_id, user_id) on public.task_participants to authenticated;
grant delete on public.task_participants to authenticated;

COMMIT;

