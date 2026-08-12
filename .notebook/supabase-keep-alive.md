# Supabase Keep Alive
> Scheduled database query for Supabase Free projects

Entry: `.github/workflows/supabase-keep-alive.yml`

Flow: GitHub Actions schedule → direct PostgreSQL `psql` query → `public.health_check`

Schema: `prisma/schema.prisma:HealthCheck` → `prisma/migrations/20260811090000_add_health_check/migration.sql` → `prisma/migrations/20260811100000_restrict_health_check_to_keepalive/migration.sql`
- Table has only `id = 1`; no application-domain data
- RLS is enabled; the dedicated `keepalive` role gets `SELECT` only on this table
- Legacy `anon`/REST access is removed by the follow-up migration

Secrets: GitHub repository `SUPABASE_KEEPALIVE_DATABASE_URL`
- Connection URL belongs to the dedicated `keepalive` PostgreSQL role
- GitHub Actions requires the Supabase Session pooler URL (port `5432`), because Free direct connections are IPv6-only
- Never use `SUPABASE_SECRET_KEY`; `src/infra/storage/supabase-storage.adapter.ts:createSupabaseStorageClient()` uses it for privileged server-side Storage access

Operation: apply the Prisma migration, create the restricted database role and grant, then add the connection URL as a GitHub repository secret; trigger `workflow_dispatch` once to validate the query.

Updated: 2026-08-11
