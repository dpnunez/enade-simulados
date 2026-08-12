# Supabase Keep Alive
> Scheduled database query for Supabase Free projects

Entry: `.github/workflows/supabase-keep-alive.yml`

Flow: GitHub Actions schedule → Supabase PostgREST `health_check` query → `public.health_check`

Schema: `prisma/schema.prisma:HealthCheck` → `prisma/migrations/20260811090000_add_health_check/migration.sql`
- Table has only `id = 1`; no application-domain data
- RLS is enabled; `anon` gets `SELECT` policy only when the role exists
- Conditional role block preserves compatibility with local Docker Postgres

Secrets: GitHub repository `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`
- Never use `SUPABASE_SECRET_KEY`; `src/infra/storage/supabase-storage.adapter.ts:createSupabaseStorageClient()` uses it for privileged server-side Storage access

Operation: apply the Prisma migration to the target Supabase database before enabling the workflow; trigger `workflow_dispatch` once to validate secrets and read policy.

Updated: 2026-08-11
