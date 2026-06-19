# Tasks: Vercel Preview Base URL

**Status:** Implemented
**Created:** 2026-06-19

## T1 - Add app base URL helper

**Status:** Complete

**Requirement:** VPBU-001, VPBU-006
**Where:** `src/infra/url/app-base-url.ts`, `src/infra/url/app-base-url.test.ts`
**Depends on:** none

**Done when:**

- Explicit `NEXT_PUBLIC_URL` wins.
- `VERCEL_URL` is used when no explicit app URL exists.
- Local fallback remains `http://localhost:3000`.
- Values normalize to URL origins.

**Verification:**

- `pnpm test:unit src/infra/url/app-base-url.test.ts`

## T2 - Configure Better Auth dynamic base URL

**Status:** Complete

**Requirement:** VPBU-002, VPBU-003
**Where:** `src/infra/auth/server.ts`
**Depends on:** T1

**Done when:**

- Better Auth uses dynamic `baseURL`.
- Allowed hosts include the configured app host, `localhost:*`, and `*.vercel.app`.
- Static `trustedOrigins` tied to one URL is removed.

**Verification:**

- `pnpm build`

## T3 - Update absolute email links

**Status:** Complete

**Requirement:** VPBU-004
**Where:** `src/features/invitations/invitation-email.adapter.ts`, `src/features/password-reset/password-reset-email.adapter.ts`
**Depends on:** T1

**Done when:**

- Invitation links use the resolved app base URL.
- Password reset links use the resolved app base URL.
- Existing email adapter tests remain deterministic.

**Verification:**

- `pnpm test:unit src/features/invitations/invitation-email.adapter.test.ts src/features/password-reset/password-reset-email.adapter.test.ts`

## T4 - Document env behavior

**Status:** Complete

**Requirement:** VPBU-005
**Where:** `.env.example`
**Depends on:** T1

**Done when:**

- `.env.example` explains that Vercel Preview should rely on `VERCEL_URL`.
- Local and production `NEXT_PUBLIC_URL` usage remains clear.

**Verification:**

- Manual review.

## T5 - Final gates

**Status:** Complete

**Requirement:** VPBU-001 through VPBU-006
**Depends on:** T1-T4

**Done when:**

- Unit tests pass.
- Build passes.

**Verification:**

- `pnpm test:unit`
- `pnpm build`
