# Student Simulated Exams Tasks

**Design**: `.specs/features/student-simulated-exams/design.md`
**Status**: Draft

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure selection/validation helpers | unit | `pnpm test:unit` |
| Feature services and schemas | unit with mocked Prisma/adapters where practical | `pnpm test:unit` |
| API route handlers and data mutations | build plus E2E through visible flows | `pnpm build`, `pnpm test:e2e` |
| App Router visible student flow | e2e | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `pnpm build`, `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- Mutations must authorize internally; private navigation and proxy are not authorization.
- E2E database is not reset between runs, so tests must clean deterministic simulation data.
- Prisma schema changes require `pnpm prisma:generate` and `pnpm build`.
- Next.js 16 docs under `node_modules/next/dist/docs/` must be checked before editing routes/pages.

---

## Execution Plan

### Phase 1: Data and Domain Foundation

```text
T1 -> T2 -> T3 -> T4
```

### Phase 2: Server Boundaries

```text
T4 -> T5 -> T6
```

### Phase 3: Student UI

```text
     ┌-> T7 -┐
T6 --┤       ├-> T9
     └-> T8 -┘
```

### Phase 4: Browser Coverage and Final Gate

```text
T9 -> T10 -> T11
```

---

## Task Breakdown

### T1: Add Simulation Prisma Models

**What**: Add simulation attempt enums/models, relations, constraints, migration, and generated Prisma client.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma/*`
**Depends on**: None
**Reuses**: Existing `User`, `SubjectField`, `Question`, `QuestionAlternative`, Prisma migration pattern.
**Requirement**: SIM-04, SIM-06, SIM-09, SIM-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `SimulationAttemptStatus` enum exists with `IN_PROGRESS` and `COMPLETED`.
- [ ] `SimulationAttempt`, `SimulationAttemptSubjectField`, `SimulationAttemptQuestion`, and `SimulationAnswer` exist with constraints from design.
- [ ] `User` has a relation to simulation attempts.
- [ ] Relations cascade only where historical integrity remains safe.
- [ ] Migration applies cleanly.
- [ ] Prisma client generation succeeds.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T2: Create Simulation Schemas

**What**: Implement Zod schemas for generation, attempt id, and answer submission.
**Where**: `src/features/simulated-exams/simulated-exam.schema.ts`, `src/features/simulated-exams/simulated-exam.schema.test.ts`
**Depends on**: T1
**Reuses**: `src/features/questions/question.schema.ts` and subject-field schema style.
**Requirement**: SIM-01, SIM-04, SIM-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Generation schema validates unique `subjectFieldIds` and `questionCount` range.
- [ ] Submit schema validates attempt-question ids and selected-alternative ids.
- [ ] Schemas normalize empty/duplicate values where appropriate.
- [ ] Unit tests cover valid generation, missing subject fields, duplicate subject fields, invalid question count, valid submit, malformed ids, and empty answers.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Implement Balanced Question Selector

**What**: Implement difficulty-balanced question selection and pure quota calculation helpers.
**Where**: `src/features/simulated-exams/question-selection.ts`, `src/features/simulated-exams/question-selection.test.ts`
**Depends on**: T2
**Reuses**: Existing `QuestionDifficulty` enum and Prisma client patterns.
**Requirement**: SIM-02, SIM-03

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Selector filters by selected `subjectFieldIds`.
- [ ] Selector rejects when available count is below requested count.
- [ ] Quota helper distributes evenly across difficulties when possible.
- [ ] Quota helper redistributes shortages to available difficulties.
- [ ] Random selection returns exactly `N` unique questions.
- [ ] Unit tests cover balanced 3-way distribution, remainder distribution, shortage redistribution, insufficient total, and subject-field filtering.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T4: Implement Simulated Exam Service

**What**: Implement eligible subject fields, attempt creation, attempt detail, submit/finalize, and history listing.
**Where**: `src/features/simulated-exams/simulated-exam.service.ts`, `src/features/simulated-exams/simulated-exam.service.test.ts`
**Depends on**: T3
**Reuses**: Service/domain error patterns from `src/features/questions/question.service.ts`.
**Requirement**: SIM-01, SIM-04, SIM-05, SIM-06, SIM-07, SIM-08, SIM-09, SIM-10, SIM-11, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `listEligibleSubjectFields` returns only grandes areas with question count > 0.
- [ ] `createSimulationAttempt` creates attempt, selected subject fields, selected questions, positions, and initial aggregate counts transactionally.
- [ ] In-progress detail service enforces ownership and returns only safe answer-taking DTO fields.
- [ ] Completed review detail service enforces ownership and returns correction fields only after finalization.
- [ ] In-progress DTO excludes `isCorrect`, `correctAlternativeId`, `correctAnswerExplanation`, and any equivalent correct-answer marker.
- [ ] `submitSimulationAttempt` validates ownership/status, validates alternatives belong to attempt questions, upserts answers, finalizes status, and stores score aggregates.
- [ ] `submitSimulationAttempt` accepts answers keyed by attempt-question id, independent of display/navigation order.
- [ ] `listSimulationAttemptsForStudent` returns only that student's attempts ordered newest first.
- [ ] Domain errors include not enough questions, not found/not owned, already completed, and invalid answer.
- [ ] Unit tests cover success/failure paths and assert in-progress payloads do not expose correct-answer fields.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T5: Add Student Simulation API Routes

**What**: Add create and submit API route handlers with server-side student authorization.
**Where**: `src/app/api/student/simulated-exams/route.ts`, `src/app/api/student/simulated-exams/[attemptId]/route.ts`
**Depends on**: T4
**Reuses**: Existing route handler authorization and JSON response style.
**Requirement**: SIM-01, SIM-04, SIM-05, SIM-09, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Relevant Next.js 16 route handler docs are checked before editing.
- [ ] `POST /api/student/simulated-exams` requires `STUDENT`, validates JSON, calls service, and returns created attempt id.
- [ ] `PATCH /api/student/simulated-exams/[attemptId]` requires `STUDENT`, validates JSON, calls submit service, and returns corrected attempt summary only after finalization.
- [ ] No API response for an in-progress attempt includes correct-answer fields.
- [ ] Unauthorized users receive `401` and mutate no data.
- [ ] Domain errors map to stable response codes and statuses.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T10
**Gate**: build

---

### T6: Add Student Navigation and Page Shells

**What**: Add student-only navigation links and server page shells for history, generation, and attempt detail.
**Where**: `src/app/app/layout.tsx`, `src/app/app/student/simulados/page.tsx`, `src/app/app/student/simulados/novo/page.tsx`, `src/app/app/student/simulados/[attemptId]/page.tsx`
**Depends on**: T5
**Reuses**: `src/app/app/student/page.tsx`, existing private layout pattern.
**Requirement**: SIM-01, SIM-06, SIM-09, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Relevant Next.js 16 page/layout docs are checked before editing.
- [ ] Student nav exposes links to gerar simulado and histórico only for `STUDENT`.
- [ ] Pages use `requireRole("STUDENT")`.
- [ ] History page loads attempt summaries.
- [ ] Generation page loads eligible subject fields.
- [ ] Attempt page loads only owned attempt details.
- [ ] Attempt page passes only safe in-progress DTOs to Client Components before finalization.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T10
**Gate**: build

---

### T7: Build Generation Form

**What**: Build the client form for selecting grandes areas and question count, then creating an attempt.
**Where**: `src/app/app/student/simulados/_components/simulation-generate-form.tsx`
**Depends on**: T6
**Reuses**: Existing `react-hook-form` + zod + shadcn form patterns.
**Requirement**: SIM-01, SIM-02, SIM-03

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Form renders eligible grandes areas as checkbox/toggle controls.
- [ ] Numeric field validates question count.
- [ ] Submit calls create API and navigates to the attempt page.
- [ ] Validation/domain errors render clearly.
- [ ] Empty eligible subject fields render a useful empty state.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T10
**Gate**: build

---

### T8: Build Attempt Answer/Review View

**What**: Build the client/server UI for answering in-progress attempts and reviewing completed attempts.
**Where**: `src/app/app/student/simulados/_components/simulation-attempt-view.tsx`
**Depends on**: T6
**Reuses**: Question markdown rendering/list patterns where available, shadcn radio/buttons/badges.
**Requirement**: SIM-04, SIM-05, SIM-06, SIM-07, SIM-08, SIM-11, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] In-progress attempts render alternatives as selectable controls.
- [ ] In-progress attempts show previous/next controls and a question navigator/status list.
- [ ] Student can jump to any question and answer questions in any order.
- [ ] In-progress component props do not contain correct-answer fields.
- [ ] Completed attempts render chosen/correct states without allowing edits.
- [ ] Submit/finalize calls API and refreshes/navigates to completed review.
- [ ] Unanswered questions are represented in the UI.
- [ ] Aggregate score summary is visible after completion.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T10
**Gate**: build

---

### T9: Add Deterministic E2E Helpers

**What**: Add helpers/fixtures to create and clean deterministic simulation test data.
**Where**: `src/tests/e2e/helpers/simulated-exams.ts`, existing e2e helpers as needed.
**Depends on**: T7, T8
**Reuses**: `src/tests/e2e/helpers/questions.ts`, `src/tests/e2e/helpers/subject-fields.ts`, `src/tests/e2e/fixtures/users.ts`.
**Requirement**: SIM-01, SIM-04, SIM-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Helpers can create subject fields/questions for all difficulties deterministically.
- [ ] Helpers clean attempts, answers, and dependent test records without leaking data across runs.
- [ ] Helper cleanup respects existing cascade/restrict rules.
- [ ] Gate check passes: `pnpm test:unit` or targeted type/build gate if helpers are E2E-only.

**Tests**: build/type confidence
**Gate**: build

---

### T10: Add Student Simulated Exam E2E Coverage

**What**: Add browser coverage for generation, completion, history review, and authorization.
**Where**: `src/tests/e2e/student-simulated-exams.spec.ts`
**Depends on**: T9
**Reuses**: Existing Playwright auth helpers and deterministic seed users.
**Requirement**: SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07, SIM-09, SIM-11, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Student can generate a simulado from selected grandes areas.
- [ ] Generated questions come only from selected grandes areas.
- [ ] Network responses and page payloads for the in-progress attempt do not include `isCorrect`, `correctAlternativeId`, `correctAnswerExplanation`, or the known correct alternative id.
- [ ] Student can answer and finish the simulado.
- [ ] Student can navigate out of sequence, answer a later question first, return to an earlier question, and keep both selections.
- [ ] Completed review shows one correct and one wrong state in deterministic data.
- [ ] History lists the completed simulado.
- [ ] Teacher/admin cannot access student simulation pages or APIs through the tested flow.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T11: Run Final Gates and Update Project Memory

**What**: Run full verification and update persistent planning memory with decisions learned during implementation.
**Where**: `.specs/project/STATE.md`, `.notebook/*` if investigation created reusable knowledge.
**Depends on**: T10
**Reuses**: Existing `.specs` and `.notebook` conventions.
**Requirement**: SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07, SIM-08, SIM-09, SIM-10, SIM-11, SIM-12

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`, `codenavi`

**Done when**:

- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes if not already covered by the final test script.
- [ ] `.specs/project/STATE.md` records accepted modeling decisions.
- [ ] `.notebook` is updated if implementation discovery would be costly to rediscover.
- [ ] Requirement traceability statuses are updated from draft planning to verified implementation state.

**Tests**: full
**Gate**: full

---

## Pre-Approval Checks

### Check 1: Task Granularity

| Task | Atomic Deliverable | Result |
| --- | --- | --- |
| T1 | Prisma models/migration/client for one domain slice | PASS |
| T2 | Validation schemas and schema tests | PASS |
| T3 | Question selection helper and tests | PASS |
| T4 | Feature service and service tests | PASS |
| T5 | API route handlers | PASS |
| T6 | Server pages/navigation shells | PASS |
| T7 | Generation form component | PASS |
| T8 | Attempt answer/review component | PASS |
| T9 | E2E helpers | PASS |
| T10 | E2E spec | PASS |
| T11 | Final gates and memory updates | PASS |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends on Field | Execution Diagram | Result |
| --- | --- | --- | --- |
| T1 | None | Starts Phase 1 | PASS |
| T2 | T1 | `T1 -> T2` | PASS |
| T3 | T2 | `T2 -> T3` | PASS |
| T4 | T3 | `T3 -> T4` | PASS |
| T5 | T4 | `T4 -> T5` | PASS |
| T6 | T5 | `T5 -> T6` | PASS |
| T7 | T6 | `T6 -> T7` | PASS |
| T8 | T6 | `T6 -> T8` | PASS |
| T9 | T8 | `T7 + T8 -> T9` | PASS |
| T10 | T9 | `T9 -> T10` | PASS |
| T11 | T10 | `T10 -> T11` | PASS |

### Check 3: Test Co-Location Validation

| Task | Code Layer | Required Tests from Matrix | Task Tests | Result |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/migration | build + E2E DB setup later | build | PASS |
| T2 | validation | unit colocated | unit | PASS |
| T3 | pure helper/data selection | unit colocated | unit | PASS |
| T4 | feature service | unit/integration-light colocated | unit/integration-light | PASS |
| T5 | API route handlers | build + E2E visible flow | build + T10 | PASS |
| T6 | pages/layout visible behavior | build + E2E | build + T10 | PASS |
| T7 | client form visible behavior | build + E2E | build + T10 | PASS |
| T8 | client answer/review visible behavior | build + E2E | build + T10 | PASS |
| T9 | E2E helpers | build/type confidence | build | PASS |
| T10 | browser flow | E2E | e2e | PASS |
| T11 | final verification | full gate | full | PASS |

---

## Tooling Question Before Execution

Before implementation, confirm whether to use only the current local tools/skills or add any MCP/plugin support for deeper docs/research.

Available skills in this session:

- `tlc-spec-driven`
- `codenavi`
- `browser:browser`
- `openai-docs`
- `imagegen`
- `documents:documents`
- `presentations`
- `spreadsheets`
- `skill-creator`
- `skill-installer`
- `plugin-creator`

Recommended default for execution: use `tlc-spec-driven` for orchestration, `codenavi` for code navigation, local filesystem/shell tools for edits, and `browser:browser` only when validating the final frontend flow.
