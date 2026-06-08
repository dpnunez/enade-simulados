# Tasks: Typed Envs with t3-env

**Status:** Implemented
**Created:** 2026-06-07

## T1 - Add dependency and env module

**Status:** Complete

**Requirement:** TE-001, TE-002
**Where:** `package.json`, `pnpm-lock.yaml`, `src/infra/env.ts`
**Depends on:** none
**Steps:**

- Install `@t3-oss/env-nextjs`.
- Create `src/infra/env.ts` using `createEnv` and `zod`.
- Define server env schema for the current application variables.
- Use transforms/defaults for boolean-like and defaulted values.
- Avoid client env schema unless a current `NEXT_PUBLIC_` key exists.

**Done when:**

- TypeScript can import `env` from `@infra/env`.
- Missing or invalid required envs fail clearly.
- Optional envs match current app behavior.

**Verification:**

- `pnpm build`

## T2 - Validate env during Next build

**Status:** Complete

**Requirement:** TE-003
**Where:** `next.config.ts`
**Depends on:** T1
**Steps:**

- Import `./src/infra/env` at the top of `next.config.ts`.
- Keep the config typed as `NextConfig`.
- Do not use the legacy `next.config.ts env` option for secrets.

**Done when:**

- `next.config.ts` triggers env validation during build.
- No server-only value is exposed through Next's client bundle config.

**Verification:**

- `pnpm build`

## T3 - Migrate runtime app env reads

**Status:** Complete

**Requirement:** TE-004
**Where:**

- `src/infra/db/prisma.ts`
- `src/infra/auth/server.ts`
- `src/features/invitations/invitation-email.adapter.ts`
- `src/infra/storage/supabase-storage.adapter.ts`

**Depends on:** T1
**Steps:**

- Replace direct reads of typed env keys with `env.KEY`.
- Preserve existing fallback behavior through schema defaults instead of local `??` fallbacks.
- Keep `process.env.NODE_ENV` direct for now.
- Keep missing SMTP behavior aligned with current adapter behavior.

**Done when:**

- Runtime app modules no longer duplicate parsing/default logic for typed envs.
- Behavior remains equivalent for console email delivery and Supabase config validation.

**Verification:**

- `pnpm test:unit`

## T4 - Keep tests stable around module-level env parsing

**Status:** Complete

**Requirement:** TE-006
**Where:**

- `src/features/invitations/invitation-email.adapter.test.ts`
- `src/infra/storage/supabase-storage.adapter.test.ts`
- Optional: colocated `src/infra/env.test.ts`

**Depends on:** T1, T3
**Steps:**

- Review tests that mutate `process.env`.
- If module-level parsing interferes with env mutation, use `vi.resetModules()` plus dynamic imports or refactor code to read typed values through testable factories.
- Add focused schema/default coverage only if it improves confidence without over-coupling tests to implementation details.

**Done when:**

- Existing env-dependent unit tests pass deterministically.
- Test setup does not depend on secret real values.

**Verification:**

- `pnpm test:unit`

## T5 - Decide what remains outside typed env

**Status:** Complete

**Requirement:** TE-005
**Where:**

- `prisma.config.ts`
- `playwright.config.ts`
- `scripts/e2e/*`
- `src/tests/e2e/helpers/*`

**Depends on:** T1
**Steps:**

- Audit remaining `process.env` usages after T3.
- Keep script/tooling reads direct when they depend on `.env.test` or external process state.
- If any tooling env should be typed, define a follow-up task for a separate script-safe env loader rather than mixing it into the Next runtime schema.

**Done when:**

- Remaining `process.env` reads are intentional and documented in the implementation summary.
- No E2E setup behavior changes accidentally.

**Verification:**

- `rg "process\\.env" src scripts prisma.config.ts playwright.config.ts next.config.ts`

## T6 - Update env documentation

**Status:** Complete

**Requirement:** TE-007
**Where:** `.env.example`
**Depends on:** T1
**Steps:**

- Ensure every schema key appears in `.env.example`.
- Align comments with required/optional semantics.
- Add missing test-only keys only if they are useful outside `.env.test`; otherwise keep test-only values in `.env.test`.

**Done when:**

- A developer can copy `.env.example` and understand which values are required for local app boot, optional local behavior, and storage/email integrations.

**Verification:**

- Manual compare between `src/infra/env.ts` schema and `.env.example`.

## T7 - Final gates

**Status:** Complete

**Requirement:** TE-001 through TE-007
**Depends on:** T1-T6
**Steps:**

- Run unit tests.
- Run build.
- Run E2E only if implementation changes E2E env loading or browser-visible behavior.

**Done when:**

- `pnpm test:unit` passes.
- `pnpm build` passes.
- Any skipped E2E decision is explicitly justified.
