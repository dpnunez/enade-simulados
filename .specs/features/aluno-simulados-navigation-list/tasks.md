# Organização das Telas de Aluno e Lista de Simulados Tasks

**Design**: `.specs/features/aluno-simulados-navigation-list/design.md`
**Status**: Complete

---

## Execution Plan

### Phase 1: Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Routes and UI

```text
T3 -> T4 -> T5 -> T6
          \-> T7
```

### Phase 3: Verification

```text
T6 + T7 -> T8 -> T9
```

---

## Task Breakdown

### T1: Add React Query Dependency

**What**: Add `@tanstack/react-query` to project dependencies.
**Where**: `package.json`, `pnpm-lock.yaml`
**Depends on**: None
**Reuses**: Current pnpm dependency management.
**Requirement**: ALUNO-SIM-03

**Done when**:

- [x] `@tanstack/react-query` appears in dependencies.
- [x] Lockfile is updated by package manager.
- [x] Existing build dependency graph remains valid.

**Tests**: Build
**Gate**: `pnpm build`

---

### T2: Create React Query Provider

**What**: Add a client `QueryProvider` and wrap private app content.
**Where**: `src/app/app/query-provider.tsx`, `src/app/app/layout.tsx`
**Depends on**: T1
**Reuses**: Existing private layout shell.
**Requirement**: ALUNO-SIM-03

**Done when**:

- [x] `QueryClientProvider` is available below `/app`.
- [x] Provider is client-only and does not break server auth in `PrivateLayout`.
- [x] Existing private pages still render.

**Tests**: Build
**Gate**: `pnpm build`

---

### T3: Add Paginated Simulated Exam List Contract

**What**: Add schema, service DTO and paginated service function for student attempts.
**Where**: `src/features/simulated-exams/simulated-exam.schema.ts`, `src/features/simulated-exams/simulated-exam.service.ts`, `src/features/simulated-exams/simulated-exam.service.test.ts`
**Depends on**: None
**Reuses**: Existing `listSimulationAttemptsForStudent()` select fields and ranking pagination patterns.
**Requirement**: ALUNO-SIM-05, ALUNO-SIM-06

**Done when**:

- [x] Query schema validates `page` and `pageSize`.
- [x] Service returns `rows`, `rowCount`, `page`, `pageSize`, `pageCount`.
- [x] Service filters by `studentId`.
- [x] Service paginates with database `skip/take`.
- [x] Unit tests cover default pagination, invalid params and student-scoped query.

**Tests**: Unit
**Gate**: `pnpm test:unit`

---

### T4: Add GET List API

**What**: Add `GET /api/student/simulated-exams` for paginated attempts while keeping existing `POST`.
**Where**: `src/app/api/student/simulated-exams/route.ts`
**Depends on**: T3
**Reuses**: Existing auth/validation error shape and `simulation-ranking` GET route pattern.
**Requirement**: ALUNO-SIM-05, ALUNO-SIM-06

**Done when**:

- [x] GET requires authenticated `STUDENT`.
- [x] GET validates query params with Zod.
- [x] GET returns paginated service response.
- [x] POST behavior remains unchanged.
- [x] Route-level tests are added if current test style makes this low cost; otherwise covered by service unit + E2E.

**Tests**: Unit/E2E
**Gate**: `pnpm test:unit`

---

### T5: Move Student UI to Aluno Routes and Add Legacy Redirects

**What**: Create canonical `/app/aluno` route tree and make old `/app/student` pages redirect to equivalent URLs.
**Where**: `src/app/app/aluno/**`, `src/app/app/student/**`, `src/app/app/app-sidebar.tsx`
**Depends on**: T3
**Reuses**: Existing student pages/components and Next `redirect()`.
**Requirement**: ALUNO-SIM-01, ALUNO-SIM-02

**Done when**:

- [x] Sidebar student links point to `/app/aluno`, `/app/aluno/simulados/novo`, `/app/aluno/lista-simulados`.
- [x] `/app/student` redirects to `/app/aluno`.
- [x] `/app/student/simulados` redirects to `/app/aluno/lista-simulados`.
- [x] `/app/student/simulados/novo` redirects to `/app/aluno/simulados/novo`.
- [x] `/app/student/simulados/[attemptId]` redirects preserving `attemptId`.
- [x] All canonical aluno pages keep `requireRole("STUDENT")`.

**Tests**: E2E
**Gate**: `pnpm test:e2e`

---

### T6: Build React Query + React Table Lista de Simulados

**What**: Replace the old history UI with a client paginated table using React Query and TanStack React Table.
**Where**: `src/app/app/aluno/lista-simulados/page.tsx`, `src/app/app/aluno/lista-simulados/_components/simulation-attempts-table.tsx`
**Depends on**: T2, T4, T5
**Reuses**: shadcn `Table`, `Button`, `Badge`, `Alert`; ranking table manual pagination pattern.
**Requirement**: ALUNO-SIM-03, ALUNO-SIM-04

**Done when**:

- [x] Page title is "Lista de simulados".
- [x] Table fetches with `useQuery`.
- [x] Table uses `useReactTable` with `manualPagination: true`.
- [x] Columns include status, grandes áreas, início, finalização, progresso/resultado and action.
- [x] Dates include date and time in `pt-BR`.
- [x] `IN_PROGRESS` rows show clear "Retomar e finalizar" action.
- [x] `COMPLETED` rows show "Revisar resultado" action.
- [x] Loading, empty and error states are visible and accessible.

**Tests**: E2E
**Gate**: `pnpm test:e2e`

---

### T7: Polish Generate Simulado UX

**What**: Make small user-friendly improvements to the generation screen and update redirects to canonical aluno URLs.
**Where**: `src/app/app/aluno/simulados/novo/page.tsx`, `src/app/app/aluno/simulados/_components/simulation-generate-form.tsx`
**Depends on**: T5
**Reuses**: Existing `react-hook-form`, Zod schema and shadcn form primitives.
**Requirement**: ALUNO-SIM-07

**Done when**:

- [x] Back link points to `/app/aluno/lista-simulados`.
- [x] Successful create navigates to `/app/aluno/simulados/[attemptId]`.
- [x] UI shows selected area count and selected available question total.
- [x] If entered count exceeds selected available total, UI gives friendly guidance before submit.
- [x] Server-side validation remains unchanged and authoritative.

**Tests**: E2E
**Gate**: `pnpm test:e2e`

---

### T8: Update E2E Coverage for New Routes and List Behavior

**What**: Update simulated exam E2E tests to use canonical aluno routes and assert legacy redirects/list actions.
**Where**: `src/tests/e2e/student-simulated-exams.spec.ts`, helpers if needed.
**Depends on**: T5, T6, T7
**Reuses**: Existing deterministic simulation E2E fixtures.
**Requirement**: ALUNO-SIM-01, ALUNO-SIM-02, ALUNO-SIM-03, ALUNO-SIM-04, ALUNO-SIM-07

**Done when**:

- [x] Main flow starts at `/app/aluno/simulados/novo`.
- [x] Review/list return links expect `/app/aluno/lista-simulados`.
- [x] Test validates "Lista de simulados" instead of "Historico".
- [x] Test validates "Retomar e finalizar" for in-progress attempts.
- [x] Test validates old `/app/student/...` redirects.
- [x] Unauthorized teacher/admin assertions still pass.

**Tests**: E2E
**Gate**: `pnpm test:e2e`

---

### T9: Final Verification and Docs Memory

**What**: Run full verification and update persistent notes/spec status.
**Where**: `.notebook/student-simulated-exams.md`, `.notebook/INDEX.md`, `.specs/features/aluno-simulados-navigation-list/*`
**Depends on**: T8
**Reuses**: Existing notebook format.
**Requirement**: ALUNO-SIM-01 through ALUNO-SIM-07

**Done when**:

- [x] `pnpm test` passes, or failures are documented with exact reason.
- [x] `pnpm build` passes.
- [x] Notebook documents canonical aluno routes and paginated list API.
- [x] Spec traceability statuses are updated.

**Tests**: Full
**Gate**: `pnpm test`, `pnpm build`

---

## Parallel Execution Map

```text
Phase 1:
  T1 -> T2
  T3 can run after/alongside T1 because it does not import React Query.

Phase 2:
  T4 after T3
  T5 after T3
  T6 after T2 + T4 + T5
  T7 after T5

Phase 3:
  T8 after T5 + T6 + T7
  T9 after T8
```

No tasks are marked `[P]` because E2E tests are not parallel-safe in this project and several edits touch shared route files.

---

## Pre-Approval Validation

### Task Granularity Check

| Task | Atomic? | Reason |
| --- | --- | --- |
| T1 | Yes | One dependency update. |
| T2 | Yes | One provider integration. |
| T3 | Yes | One backend contract/service deliverable with colocated unit tests. |
| T4 | Yes | One API method on existing route. |
| T5 | Yes | One route migration/redirect deliverable. |
| T6 | Yes | One table component/page deliverable. |
| T7 | Yes | One generation screen polish deliverable. |
| T8 | Yes | One E2E update deliverable. |
| T9 | Yes | One final verification/docs deliverable. |

### Diagram-Definition Cross-Check

| Task | Depends on in definition | Matches execution plan? |
| --- | --- | --- |
| T1 | None | Yes |
| T2 | T1 | Yes |
| T3 | None | Yes |
| T4 | T3 | Yes |
| T5 | T3 | Yes |
| T6 | T2, T4, T5 | Yes |
| T7 | T5 | Yes |
| T8 | T5, T6, T7 | Yes |
| T9 | T8 | Yes |

### Test Co-Location Validation

| Task | Code layer | Required test type from matrix | Planned tests | Valid? |
| --- | --- | --- | --- | --- |
| T1 | Dependency/build graph | Build | `pnpm build` | Yes |
| T2 | App layout/provider | Build/E2E via consumers | `pnpm build` | Yes |
| T3 | Feature service/schema | Unit | colocated service/schema tests | Yes |
| T4 | API route handler | Unit/E2E if visible | unit where practical + E2E via table | Yes |
| T5 | App Router navigation | E2E | simulated exam E2E redirect/nav assertions | Yes |
| T6 | Browser-visible table | E2E | simulated exam E2E list assertions | Yes |
| T7 | Browser-visible form | E2E | simulated exam E2E generation assertions | Yes |
| T8 | E2E suite | E2E | Playwright | Yes |
| T9 | Docs/verification | Full/build | `pnpm test`, `pnpm build` | Yes |

---

## Tools and Skills for Execution

Recommended execution setup:

- Skills: `tlc-spec-driven`, `codenavi`, `shadcn`.
- MCP/tools: filesystem shell/apply_patch; browser tool or Playwright screenshots if visual QA is requested.
- Docs: use local Next.js 16 docs in `node_modules/next/dist/docs` before changing App Router files.
