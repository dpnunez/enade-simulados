# Teacher Simulation Ranking Tasks

**Design**: `.specs/features/teacher-simulation-ranking/design.md`
**Status**: Complete

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure helpers and schemas | unit | `pnpm test:unit` |
| Feature services | unit with mocked Prisma/adapters | `pnpm test:unit` |
| API route handlers | unit/integration-light where practical; build for type checks | `pnpm test:unit`, `pnpm build` |
| App Router visible behavior | e2e for critical flows | `pnpm test:e2e` |
| Dependency/schema/type changes | build | `pnpm build` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- API routes and pages must authorize server-side with `TEACHER`.
- E2E database is shared and sequential; ranking tests must create/clean deterministic attempts and catalog rows carefully.
- Next.js 16 docs under `node_modules/next/dist/docs/` must be checked before editing pages/routes.
- `@tanstack/react-table` is not currently in `package.json`; installing it is part of the implementation.

---

## Execution Plan

### Phase 1: Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Backend Boundary

```text
T3 -> T4
```

### Phase 3: UI

```text
T1 + T5 -> T6
T4 + T6 -> T7
T7 -> T8
```

### Phase 4: Browser Coverage and Final Gate

```text
T8 -> T9 -> T10
```

---

## Task Breakdown

### T1: Install TanStack Table Dependency

**What**: Add `@tanstack/react-table` to project dependencies.
**Where**: `package.json`, `pnpm-lock.yaml`
**Depends on**: None
**Reuses**: Existing pnpm dependency workflow.
**Requirement**: RANK-01, RANK-02

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Dependency is installed with pnpm and lockfile updated.
- [x] Version resolves successfully in the local workspace.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T2: Create Ranking Query Schema

**What**: Implement Zod schema for ranking query params, pagination bounds and allowed sort fields.
**Where**: `src/features/simulation-ranking/simulation-ranking.schema.ts`, `src/features/simulation-ranking/simulation-ranking.schema.test.ts`
**Depends on**: None
**Reuses**: Existing feature schema patterns from `src/features/simulated-exams/simulated-exam.schema.ts`.
**Requirement**: RANK-02, RANK-06, RANK-07, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `page` defaults to 1 and rejects/coerces invalid non-positive values according to schema decision.
- [x] `pageSize` defaults to 20 and is bounded between 10 and 100.
- [x] Sort fields are restricted to allowed columns.
- [x] Direction is restricted to `asc`/`desc`.
- [x] Unit tests cover defaults, valid pagination, invalid pagination, valid sort and invalid sort.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Implement Ranking Service

**What**: Implement ranking aggregation, weighted score helper and paginated DTO.
**Where**: `src/features/simulation-ranking/simulation-ranking.service.ts`, `src/features/simulation-ranking/simulation-ranking.service.test.ts`
**Depends on**: T2
**Reuses**: Prisma singleton, simulation attempt schema, service test mock style.
**Requirement**: RANK-01, RANK-03, RANK-04, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `calculateQuestionWeight` returns 1 for `EASY`, 2 for `MEDIUM`, 3 for `HARD`, and 2 for null/undefined.
- [x] Service filters only `SimulationAttempt.status = COMPLETED`.
- [x] Service sums points only when `SimulationAnswer.isCorrect = true`.
- [x] Errors/null correction fields add 0 and never subtract.
- [x] Service returns `rows`, `rowCount`, `page`, `pageSize`, and `pageCount`.
- [x] Row `rank` reflects global position based on backend page offset.
- [x] Default ordering is points desc, acerto desc, formularios desc, nome/email asc.
- [x] Unit tests cover scoring weights, no error penalty, global percent denominator, pagination metadata and stable ordering.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T4: Add Teacher Ranking API Route

**What**: Implement `GET /api/teacher/simulation-ranking` with teacher authorization and query parsing.
**Where**: `src/app/api/teacher/simulation-ranking/route.ts`
**Depends on**: T3
**Reuses**: API route patterns from `src/app/api/student/simulated-exams/route.ts` and auth helpers.
**Requirement**: RANK-05, RANK-06, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Relevant Next.js 16 route handler docs are checked before editing.
- [x] Handler requires `TEACHER`.
- [x] Handler validates query params through ranking schema.
- [x] Handler returns table DTO as JSON on success.
- [x] Unauthorized users do not execute ranking query.
- [x] Invalid query returns stable error JSON.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T9
**Gate**: build

---

### T5: Add shadcn-Style Table Primitive

**What**: Add local table primitives if the project does not already have them.
**Where**: `src/components/ui/table.tsx`
**Depends on**: None
**Reuses**: `src/lib/utils.ts` and shadcn component style.
**Requirement**: RANK-01

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Exports `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption` or equivalent shadcn-compatible primitives.
- [x] Styling follows existing UI primitive conventions.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T6: Build Ranking Table Client Component

**What**: Create a client component that uses TanStack Table for server-side pagination and table rendering.
**Where**: `src/app/app/professor/ranking/_components/ranking-table.tsx`
**Depends on**: T1, T5
**Reuses**: shadcn primitives, `Button`, `Badge`, fetch JSON pattern.
**Requirement**: RANK-01, RANK-02, RANK-07, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Component declares `"use client"`.
- [x] Uses `useReactTable` with `manualPagination: true`.
- [x] Provides backend `rowCount` to the table.
- [x] Controls `pagination` state and refetches on page/pageSize change.
- [x] Renders columns for rank, student, weighted score, completed forms, correct, wrong, total questions and accuracy.
- [x] Handles loading, empty and error states.
- [x] Sorting UI is included only for approved columns if P2 is implemented now; otherwise headers remain static.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T9
**Gate**: build

---

### T7: Add Teacher Ranking Page and Navigation

**What**: Add the professor ranking page and link it from the private layout for teachers.
**Where**: `src/app/app/professor/ranking/page.tsx`, `src/app/app/layout.tsx`
**Depends on**: T4, T6
**Reuses**: Professor page structure from `questoes/page.tsx`, lucide icons, role-gated nav pattern.
**Requirement**: RANK-01, RANK-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Page requires `TEACHER` server-side.
- [x] Page renders title/description and `RankingTable`.
- [x] Teacher nav shows a ranking link with icon.
- [x] Non-teacher nav does not show the link.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T9
**Gate**: build

---

### T8: Create Ranking E2E Fixture Helpers

**What**: Add deterministic helper setup for ranking attempts and cleanup.
**Where**: `src/tests/e2e/helpers/simulation-ranking.ts` or extend `src/tests/e2e/helpers/simulated-exams.ts`
**Depends on**: T3
**Reuses**: Existing E2E helpers for auth, questions, subject fields and simulated exams.
**Requirement**: RANK-03, RANK-04

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Helper creates at least two students or uses existing deterministic users safely.
- [x] Helper creates completed attempts with known EASY/MEDIUM/HARD correct and incorrect answers.
- [x] Cleanup removes attempts before question/subject-field catalog rows.
- [x] Gate check passes: `pnpm test:e2e` when used by T9.

**Tests**: e2e
**Gate**: e2e

---

### T9: Add Ranking E2E Coverage

**What**: Cover professor access, ranking order, pagination behavior and student denial in browser tests.
**Where**: `src/tests/e2e/teacher-simulation-ranking.spec.ts`
**Depends on**: T7, T8
**Reuses**: `loginAs`, deterministic users, ranking helper.
**Requirement**: RANK-01, RANK-02, RANK-03, RANK-05, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Teacher can open ranking page and see expected students/metrics.
- [x] Higher weighted score appears before lower weighted score.
- [x] Incorrect answers do not reduce points.
- [x] Page controls trigger backend pagination and preserve visible row count.
- [x] Student cannot access ranking page/API.
- [x] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T10: Run Final Gates and Update Planning State

**What**: Run final verification and update feature/task statuses after implementation.
**Where**: `.specs/features/teacher-simulation-ranking/*.md`, `.specs/project/STATE.md`, `.specs/project/ROADMAP.md`
**Depends on**: T9
**Reuses**: TLC spec-driven status conventions.
**Requirement**: RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, RANK-06, RANK-07, RANK-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `pnpm test:unit` passes.
- [x] `pnpm test:e2e` passes.
- [x] `pnpm build` passes.
- [x] Requirement traceability statuses are updated.
- [x] STATE/ROADMAP reflect implementation outcome.

**Tests**: full/build
**Gate**: full

---

## Parallel Execution Map

```text
Sequential foundation:
  T1, T2 and T5 can start independently.

Backend:
  T2 -> T3 -> T4

Frontend:
  T1 + T5 -> T6 -> T7

Verification:
  T3 -> T8
  T7 + T8 -> T9 -> T10
```

---

## Pre-Approval Checks

### Check 1: Task Granularity

| Task | Atomic? | Reason |
| --- | --- | --- |
| T1 | Pass | One dependency addition. |
| T2 | Pass | One schema module with colocated tests. |
| T3 | Pass | One service module with colocated tests. |
| T4 | Pass | One API endpoint. |
| T5 | Pass | One UI primitive file. |
| T6 | Pass | One client table component. |
| T7 | Pass | One page/navigation integration step. |
| T8 | Pass | One E2E helper fixture module. |
| T9 | Pass | One E2E spec. |
| T10 | Pass | Final verification/status update only. |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends on field | Diagram dependency | Result |
| --- | --- | --- | --- |
| T1 | None | Independent foundation | Pass |
| T2 | None | Independent foundation | Pass |
| T3 | T2 | `T2 -> T3` | Pass |
| T4 | T3 | `T3 -> T4` | Pass |
| T5 | None | Independent UI foundation | Pass |
| T6 | T1, T5 | `T1 + T5 -> T6` | Pass |
| T7 | T4, T6 | `T4 + T6 -> T7` | Pass |
| T8 | T3 | `T3 -> T8` | Pass |
| T9 | T7, T8 | `T7 + T8 -> T9` | Pass |
| T10 | T9 | `T9 -> T10` | Pass |

### Check 3: Test Co-Location Validation

| Task | Code Layer | Required Test Type | Included In Task? | Result |
| --- | --- | --- | --- | --- |
| T1 | Dependency/type change | build | Yes | Pass |
| T2 | Pure validation | unit | Yes | Pass |
| T3 | Feature service/helper | unit/integration-light | Yes | Pass |
| T4 | API route | build + E2E through T9 | Yes | Pass |
| T5 | UI primitive | build | Yes | Pass |
| T6 | Client UI | build + E2E through T9 | Yes | Pass |
| T7 | Page/navigation | build + E2E through T9 | Yes | Pass |
| T8 | E2E helper | e2e through T9 | Yes | Pass |
| T9 | Browser-visible flow | e2e | Yes | Pass |
| T10 | Verification/status | full/build | Yes | Pass |

---

## Tooling Question Before Execution

Before implementing these tasks, confirm whether to use only the available filesystem/browser tooling or delegate any task to a sub-agent if multi-agent tools are available in that session.
