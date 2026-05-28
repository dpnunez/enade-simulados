# Codebase Concerns

**Analyzed:** 2026-05-28

## P1: Invitation Email Delivery Is Not Production-Ready

**Evidence:** `src/features/invitations/invitation-email.adapter.ts` provides the adapter boundary, and docs/config mention console/test-oriented delivery. No SMTP or external email dependency is installed.

**Risk:** Admin invitation creation can exist in product code before real email delivery is available for production users.

**Fix Approach:** Wire a concrete SMTP/provider adapter behind the existing invitation email boundary and test both success and provider failure behavior.

## P1: E2E Test Database Is Prepared but Not Reset Between Runs

**Evidence:** `scripts/e2e/prepare-test-db.ts` creates the database if missing, runs migrations, and seeds users via upsert. It does not truncate domain tables or recreate the database.

**Risk:** Future E2E tests that create mutable data can leak state across runs, especially for invitations, questions, attempts, or other domain records.

**Fix Approach:** Add deterministic cleanup for non-seed data in `prepare-test-db.ts`, or recreate the test database/schema before each Playwright run.

## P1: Question Browser Flow Lacks E2E Coverage

**Evidence:** Unit tests exist for `src/features/questions`, and question routes/pages exist under `src/app/app/professor/questoes`; no `src/tests/e2e/questions.spec.ts` was observed.

**Risk:** Markdown editor behavior, alternative validation, create/edit navigation, and route-level teacher authorization could regress without browser coverage.

**Fix Approach:** Add a focused Playwright spec for creating and editing a question through `/app/professor/questoes` once the flow is stable enough for deterministic selectors.

## P2: Proxy Cookie Check Is Only an Optimistic Gate

**Evidence:** `src/proxy.ts` checks only `getSessionCookie(request)`, while real session validation happens later in `requireAuth()`.

**Risk:** A stale or malformed cookie can pass the proxy and reach server rendering, though `requireAuth` should still redirect. This is acceptable as a fast path, but should not be mistaken for authorization.

**Fix Approach:** Keep all sensitive pages and mutations protected by server-side session checks. Document this pattern in feature tasks.

## P2: Domain Model Still Has Major Product Areas Missing

**Evidence:** `prisma/schema.prisma` now has invitations, subject fields, questions, and alternatives. README/planned product scope still includes simulations, attempts, answers, metrics, and broader student flows.

**Risk:** Future features may pressure existing question structures if attempt/answer modeling needs additional invariants or reporting dimensions.

**Fix Approach:** Continue spec-driven vertical slices. Model attempts/answers with migrations and tests before adding dashboard/reporting UI.

## P3: Generated Prisma Client Path Requires Discipline

**Evidence:** Prisma generator outputs to `src/generated/prisma`; aliases point `@prisma-generated-client` to `src/generated/prisma/client`.

**Risk:** Missing `pnpm prisma:generate` after schema changes will cause type/build failures.

**Fix Approach:** Include `pnpm prisma:generate` and `pnpm build` in tasks that change `prisma/schema.prisma`.

## P3: README MVP Profile Count Is Slightly Behind Code

**Evidence:** README says MVP has professor and aluno profiles, while code and seed include `ADMIN`, `TEACHER`, and `STUDENT`.

**Risk:** Product docs may confuse contributors about admin responsibilities.

**Fix Approach:** Update README when the admin user-management feature lands.
