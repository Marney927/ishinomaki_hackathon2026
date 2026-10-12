-- PROPOSAL ONLY: not executed. Review and approve before applying.
-- Fixes tasks.created_by NOT NULL on authenticated INSERT and audits UPDATE.
-- No table/data deletion; no RLS or column privilege changes.
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

DROP TRIGGER IF EXISTS tasks_audit ON public.tasks;
CREATE TRIGGER tasks_audit BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
COMMIT;

-- Verify the audit trigger is enabled (O = enabled for ordinary writes).
SELECT t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
WHERE t.tgrelid = 'public.tasks'::regclass AND NOT t.tgisinternal;

