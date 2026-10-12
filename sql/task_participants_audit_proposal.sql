-- PROPOSAL ONLY: not executed. Review before applying.
-- Adds audit fields for authenticated task participation, without modifying RLS.
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
DROP TRIGGER IF EXISTS task_participants_audit ON public.task_participants;
CREATE TRIGGER task_participants_audit BEFORE INSERT OR UPDATE ON public.task_participants
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
COMMIT;

