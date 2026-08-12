-- Create a technical table queried by the Supabase keep-alive workflow.
-- It is deliberately outside the application's domain data.
CREATE TABLE "health_check" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "health_check_pkey" PRIMARY KEY ("id")
);

INSERT INTO "health_check" ("id") VALUES (1);

-- Supabase exposes the `anon` role, while local Docker Postgres does not.
-- The conditional block keeps this migration portable across both environments.
ALTER TABLE "health_check" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT SELECT ON TABLE "health_check" TO anon;

        CREATE POLICY "health_check_is_public"
        ON "health_check"
        FOR SELECT
        TO anon
        USING (true);
    END IF;
END
$$;
