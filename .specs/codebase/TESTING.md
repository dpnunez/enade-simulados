# Testing Infrastructure

**Analyzed:** 2026-05-25

## Test Frameworks

**Unit/Integration:** Vitest 3.2.4
**E2E:** Playwright 1.56.0
**Coverage:** No coverage reporter or enforced threshold observed.

## Test Organization

**Location:**

- Unit tests can be colocated with source, e.g. `src/infra/auth/session.test.ts`.
- E2E tests live in `src/tests/e2e`.
- Shared setup lives in `src/tests/setup` and `src/tests/e2e/global-setup.ts`.
- E2E helpers and fixtures live in `src/tests/e2e/helpers` and `src/tests/e2e/fixtures`.

**Naming:**

- Unit: `*.test.ts` / `*.test.tsx`
- E2E: `*.spec.ts`

## Testing Patterns

### Unit Tests

**Approach:** Mock framework and app dependencies at module boundaries.
**Location:** Colocated under source folders.

`src/infra/auth/session.test.ts` uses `vi.hoisted` to define mocks before importing the module under test. It mocks `next/headers`, `next/navigation`, and `@auth/server`, then asserts `getCurrentSession`, `requireAuth`, and `requireRole`.

### Integration-Light Tests

No separate integration test directory is present. Current "integration-light" coverage is unit-level with mocked boundaries. Database-backed integration tests are not yet implemented.

### E2E Tests

**Approach:** Real browser against built Next server and real PostgreSQL test database.
**Location:** `src/tests/e2e`

Playwright tests use deterministic seed users from `src/tests/e2e/fixtures/users.ts`. `loginAs` drives the login page with semantic locators. Existing specs cover successful login and admin route denial for a student.

## Test Execution

**Commands from `package.json`:**

- Unit: `pnpm test:unit`
- Unit watch: `pnpm test:unit:watch`
- E2E: `pnpm test:e2e`
- E2E headed: `pnpm test:e2e:headed`
- All tests: `pnpm test`

**Configuration:**

- Vitest config: `vitest.config.ts`
- Playwright config: `playwright.config.ts`
- Playwright base URL: `http://localhost:3001`
- Playwright web server: `tsx scripts/e2e/start-web-server.ts`
- E2E global setup: `src/tests/e2e/global-setup.ts`

## Test Database

`.env.test` points to `enade_eng_prod_test`. `src/tests/e2e/global-setup.ts` loads `.env.test` and runs `pnpm e2e:prepare`. The prepare script creates the database if needed, runs `pnpm prisma migrate deploy`, and runs `pnpm db:seed:users`.

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
| --- | --- | --- | --- |
| Pure helpers and validation | unit | `src/**/*.test.ts` | `pnpm test:unit` |
| Auth/session helpers | unit | `src/infra/auth/*.test.ts` | `pnpm test:unit` |
| API Route Handlers and data mutations | unit/integration-light, plus E2E if user-visible | colocated `*.test.ts`; E2E in `src/tests/e2e` | `pnpm test:unit`, `pnpm test:e2e` |
| App Router pages/layouts with visible behavior | e2e for critical flows | `src/tests/e2e/*.spec.ts` | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `prisma/**`, `scripts/e2e/**` | `pnpm build`, `pnpm test:e2e` |
| UI primitives | unit/component if behaviorful; otherwise build | `src/components/ui/**/*.test.tsx` if added | `pnpm test:unit`, `pnpm build` |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --- | --- | --- | --- |
| Unit | Mostly yes | Vitest thread isolation; mocked dependencies | `vitest.config.ts` uses `poolOptions.threads.isolate: true` |
| E2E | No | Shared PostgreSQL test database and deterministic seed users | `playwright.config.ts` sets `fullyParallel: false`, `workers: 1`; `.env.test` has one DB URL |
| DB-backed integration | Not established | Would share the same configured database unless isolated per test | No per-test database/schema pattern observed |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After helper/auth/server logic covered by unit tests | `pnpm test:unit` |
| E2E | After browser-visible auth/navigation changes | `pnpm test:e2e` |
| Full | Before completing a user-facing feature | `pnpm test` |
| Build | After schema, route, config, or type-heavy changes | `pnpm build` |
| Lint | Before merging broader edits when style/import concerns are likely | `pnpm lint` |
