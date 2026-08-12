-- The keep-alive workflow now uses a dedicated PostgreSQL role instead of
-- Supabase's Data API. Remove the legacy anonymous REST access.
DROP POLICY IF EXISTS "health_check_is_public" ON "health_check";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE SELECT ON TABLE "health_check" FROM anon;
    END IF;
END
$$;
