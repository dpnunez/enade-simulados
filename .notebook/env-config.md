# Env Config
> App base URL resolution and local Postgres env contract

Entry: `src/infra/env.ts`

App base URL: `src/infra/url/app-base-url.ts:getAppBaseUrl()`
- Explicit `NEXT_PUBLIC_URL` wins for local/prod canonical URL.
- When `NEXT_PUBLIC_URL` is omitted, Vercel previews use `https://${VERCEL_URL}`.
- Outside Vercel, fallback is `http://localhost:3000`.
- Better Auth uses dynamic `baseURL` with allowed hosts in `src/infra/auth/server.ts`.
- Invitation links use the helper in `src/features/invitations/invitation-email.adapter.ts:buildInvitationUrl()`.
- Password reset links use the helper in `src/features/password-reset/password-reset-email.adapter.ts:buildPasswordResetUrl()`.

Postgres local Docker: `docker-compose.yml`
- Fixed local db/user/password/port in compose
- App/test env contract uses `DATABASE_URL`, not separate `POSTGRES_*` variables

Updated: 2026-06-19
