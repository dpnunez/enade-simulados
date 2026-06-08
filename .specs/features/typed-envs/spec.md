# Typed Envs with t3-env

**Status:** Planned
**Created:** 2026-06-07
**Scope:** Medium

## Summary

Adopt `@t3-oss/env-nextjs` as the typed, validated environment contract for the Next.js application, replacing ad hoc `process.env` reads in app/server code while preserving existing test and script workflows.

## Context

The project currently reads environment variables directly from `process.env` in:

- Runtime app/server code: Prisma connection, Better Auth, invitation email adapter, Supabase Storage adapter.
- Next and tooling configs: `next.config.ts`, `prisma.config.ts`, `playwright.config.ts`.
- E2E scripts/helpers: database preparation, web server startup, DB helper connections, invitation log helper.
- Unit tests that intentionally mutate `process.env`.

The current `.env.example` already documents the main runtime envs, but there is no single typed schema that validates required values or centralizes defaults.

## External Guidance Checked

- `t3-env` Next.js docs recommend installing `@t3-oss/env-nextjs` and `zod`.
- For Next.js 16+, the docs recommend importing the env module in `next.config.ts` to validate at build time.
- The package is ESM-only and requires TypeScript/module resolution capable of package exports; this repo already uses `moduleResolution: "bundler"`.
- Next.js docs confirm non-`NEXT_PUBLIC_` variables remain server-only, and env loading outside the Next runtime needs separate care, commonly via `@next/env`.

## Requirements

### TE-001: Central typed env schema

Create a single application env module at `src/infra/env.ts`, exporting `env` from `createEnv`.

The schema must include currently used server-side runtime variables:

- `DATABASE_URL`
- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_RATE_LIMIT_DISABLED`
- `INVITATION_EMAIL_DELIVERY`
- `INVITATION_EMAIL_FROM`
- `INVITATION_EMAIL_LOG_DIR`
- `INVITATION_EMAIL_LOG_FILE_NAME`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_STORAGE_PUBLIC_URL`

### TE-002: Preserve current optional/default behavior

The schema must preserve existing fallback semantics:

- `APP_BASE_URL` defaults to `http://localhost:3000`.
- `BETTER_AUTH_RATE_LIMIT_DISABLED` is interpreted as a boolean-like env with default `false`.
- `INVITATION_EMAIL_DELIVERY` defaults to `console`.
- `INVITATION_EMAIL_FROM` defaults to `noreply@enade.local`.
- SMTP variables remain optional unless SMTP delivery becomes implemented/enforced.
- Supabase Storage envs remain optional at app startup if the current runtime behavior allows delayed failure in the storage adapter.

### TE-003: Build-time validation for Next

Import the env module from `next.config.ts` so `pnpm build` fails early when required runtime envs are invalid or missing.

### TE-004: Replace direct runtime reads in app code

Replace direct `process.env` reads in app/server runtime modules with the typed `env` object where feasible:

- `src/infra/db/prisma.ts`
- `src/infra/auth/server.ts`
- `src/features/invitations/invitation-email.adapter.ts`
- `src/infra/storage/supabase-storage.adapter.ts`

Keep `process.env.NODE_ENV` direct unless there is a project-wide reason to type it.

### TE-005: Keep tooling/scripts compatible

Do not blindly replace all `process.env` access in scripts and tool configs on the first pass.

Tooling that runs outside the Next runtime should either:

- Continue using `process.env` with existing explicit checks, or
- Use a separate env loader/schema later if the implementation proves safe with `.env.test`, Prisma, and Playwright.

### TE-006: Test compatibility

Update or add focused unit tests for env-dependent behavior without making tests brittle.

At minimum:

- Existing invitation email adapter tests should keep passing with typed env access.
- Existing Supabase Storage adapter tests should keep passing with typed env access.
- If `src/infra/env.ts` introduces parsing transforms/defaults, add lightweight tests for the schema behavior if it can be tested without fighting module-level env caching.

### TE-007: Documentation

Update `.env.example` comments if needed so every typed env has clear semantics and optionality.

## Non-Goals

- No new public client envs unless a real `NEXT_PUBLIC_` use case appears.
- No migration of all E2E/helper/script env reads unless needed for safety.
- No production email provider decision; that remains deferred.
- No secret values committed.

## Acceptance Criteria

- `@t3-oss/env-nextjs` is installed and imported only through the project env module.
- `pnpm build` validates the env schema through `next.config.ts`.
- Runtime app modules use `env` for the main application environment contract.
- Existing unit tests for invitation email and Supabase Storage pass.
- `pnpm test:unit` passes.
- `.env.example` remains a faithful source for required and optional env keys.

## Risks and Mitigations

**Risk:** Build-time validation may fail in local or CI contexts where optional envs are intentionally empty.
**Mitigation:** Model optional envs intentionally and only require variables already needed to boot/build reliably.

**Risk:** Unit tests that mutate `process.env` may break if `env` is evaluated once at module import.
**Mitigation:** Prefer adapter-level factories or isolated module imports in tests where env mutation is part of the behavior under test.

**Risk:** Scripts using `.env.test` may accidentally validate against dev envs.
**Mitigation:** Keep script/tooling migration separate unless the implementation explicitly loads the right env file first.
