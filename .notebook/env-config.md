# Env Config
> Canonical app URL and local Postgres env contract

Entry: `src/infra/env.ts`

Canonical URL: `NEXT_PUBLIC_URL`
- Used by auth server config: `src/infra/auth/server.ts`
- Used for invitation links: `src/features/invitations/invitation-email.adapter.ts:buildInvitationUrl()`
- Used for password reset links: `src/features/password-reset/password-reset-email.adapter.ts:buildPasswordResetUrl()`

Postgres local Docker: `docker-compose.yml`
- Fixed local db/user/password/port in compose
- App/test env contract uses `DATABASE_URL`, not separate `POSTGRES_*` variables

Updated: 2026-06-19
