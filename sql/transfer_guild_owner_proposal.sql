-- PROPOSAL ONLY: not executed. User approval required before applying.
-- Allows only the current guild owner to transfer ownership to an existing member.
-- Does not broaden direct UPDATE privileges or disable RLS.
BEGIN;
CREATE OR REPLACE FUNCTION public.transfer_guild_owner(p_guild_id integer, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor uuid := auth.uid(); current_owner uuid;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT owner_id INTO current_owner FROM public.guilds WHERE id = p_guild_id FOR UPDATE;
  IF current_owner IS NULL OR current_owner <> actor THEN RAISE EXCEPTION 'Guild owner required'; END IF;
  PERFORM 1 FROM public.guild_members WHERE guild_id = p_guild_id AND user_id = p_user_id FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'New owner must be a guild member'; END IF;
  UPDATE public.guilds SET owner_id = p_user_id, updated_by = actor, updated_at = now() WHERE id = p_guild_id;
END;
$$;
REVOKE ALL ON FUNCTION public.transfer_guild_owner(integer,uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_guild_owner(integer,uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
