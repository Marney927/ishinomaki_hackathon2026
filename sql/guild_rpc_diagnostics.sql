-- Read-only diagnostics: execute in Supabase SQL Editor and inspect locally.
-- No row data, credentials, or invite codes are selected.
select p.oid::regprocedure as signature,
       pg_get_function_result(p.oid) as return_type,
       pg_get_function_arguments(p.oid) as arguments,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('create_guild', 'join_guild');

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('guilds', 'guild_members')
  and column_name in ('id', 'guild_id', 'created_by', 'updated_by');
