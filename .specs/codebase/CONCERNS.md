# Codebase Concerns

**Analyzed:** 2026-05-25

## P1: Public Signup Is Disabled but No Production User Provisioning Exists Yet

**Evidence:** `src/infra/auth/server.ts` sets `emailAndPassword.disableSignUp: true`; `scripts/seed-users.ts` creates deterministic users for local/test usage.

**Risk:** Outside seed scripts, there is currently no product flow for creating real teacher/student users.

**Fix Approach:** Implement the planned invitation feature as the only user provisioning path. Keep public signup disabled.

## P1: E2E Test Database Is Prepared but Not Reset Between Runs

**Evidence:** `scripts/e2e/prepare-test-db.ts` creates the database if missing, runs migrations, and seeds users via upsert. It does not truncate domain tables or recreate the database.

**Risk:** Future E2E tests that create mutable data can leak state across runs, especially for invitations, questions, attempts, or other domain records.

**Fix Approach:** Add deterministic cleanup for non-seed data in `prepare-test-db.ts`, or recreate the test database/schema before each Playwright run.

## P1: Authorization Relies on Page-Level `requireRole`; No Mutation Pattern Exists Yet

**Evidence:** `src/app/app/admin/page.tsx` calls `requireRole("ADMIN")`. There are no domain mutations yet.

**Risk:** New mutations could accidentally rely only on UI visibility or proxy checks. HTTP endpoints and other server-side mutation boundaries can be invoked directly, so each mutation must authorize internally.

**Fix Approach:** For every API handler/controller that mutates data, resolve the current session and enforce the required role before touching data. Add unit tests for unauthorized mutation attempts.

## P2: Proxy Cookie Check Is Only an Optimistic Gate

**Evidence:** `src/proxy.ts` checks only `getSessionCookie(request)`, while real session validation happens later in `requireAuth()`.

**Risk:** A stale or malformed cookie can pass the proxy and reach server rendering, though `requireAuth` should still redirect. This is acceptable as a fast path, but should not be mistaken for authorization.

**Fix Approach:** Keep all sensitive pages and mutations protected by server-side session checks. Document this pattern in feature tasks.

## P2: No Email Integration Yet

**Evidence:** No email dependency, SMTP config, or mailer module exists. `.env.example` only includes database and Better Auth variables.

**Risk:** Invitation delivery cannot be production-ready without choosing and configuring a provider.

**Fix Approach:** Add an email adapter boundary first, with deterministic dev/test behavior, then wire SMTP or provider credentials when available.

## P2: Domain Model Is Still Auth-Only

**Evidence:** `prisma/schema.prisma` only contains Better Auth models plus `User.role`; README lists matérias, questões, simulados, attempts, answers, and metrics as planned but not implemented.

**Risk:** Future features will introduce most of the core domain at once unless scoped carefully.

**Fix Approach:** Continue using spec-driven slices. Add schema and tests per feature, starting with the smallest useful vertical slice.

## P3: Generated Prisma Client Path Requires Discipline

**Evidence:** Prisma generator outputs to `src/generated/prisma`; aliases point `@prisma-generated-client` to `src/generated/prisma/client`.

**Risk:** Missing `pnpm prisma:generate` after schema changes will cause type/build failures.

**Fix Approach:** Include `pnpm prisma:generate` and `pnpm build` in tasks that change `prisma/schema.prisma`.

## P3: README MVP Profile Count Is Slightly Behind Code

**Evidence:** README says MVP has professor and aluno profiles, while code and seed include `ADMIN`, `TEACHER`, and `STUDENT`.

**Risk:** Product docs may confuse contributors about admin responsibilities.

**Fix Approach:** Update README when the admin user-management feature lands.
