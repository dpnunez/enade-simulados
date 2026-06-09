# Simulation Answer Drafts Tasks

**Design**: `.specs/features/simulation-answer-drafts/design.md`
**Status**: Verified

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Feature services and schemas | unit with mocked Prisma/adapters | `pnpm test:unit` |
| API Route Handlers and data mutations | build plus E2E if user-visible | `pnpm build`, `pnpm test:e2e` |
| App Router visible student flow | e2e for critical flows | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `pnpm build`, `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- Next.js 16 docs under `node_modules/next/dist/docs/` must be checked before editing route handlers/pages.
- In-progress attempt payloads must never reveal correction fields.
- E2E tests share one PostgreSQL test database and must keep deterministic cleanup.
- Prisma schema changes require generated client/build confidence.

---

## Execution Plan

### Phase 1: Domain Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Server Boundary

```text
T3 -> T4
```

### Phase 3: Student Experience

```text
T4 -> T5 -> T6
```

### Phase 4: Final Verification

```text
T6 -> T7
```

---

## Task Breakdown

### T1: Allow Draft Answer Rows

**What**: Make simulation answer correction fields nullable so an answer can exist before evaluation.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`
**Depends on**: None
**Reuses**: Existing `SimulationAnswer` model and migration pattern from `prisma/migrations/20260609120000_student_simulated_exams`.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-04, DRAFT-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `SimulationAnswer.correctAlternativeId` is nullable.
- [x] `SimulationAnswer.correctAlternative` relation is nullable.
- [x] `SimulationAnswer.isCorrect` is nullable.
- [x] Existing unique/index constraints for attempt question and alternatives remain intact.
- [x] Migration represents only the nullability changes required for draft saves.
- [x] Gate check passes: `pnpm build`.

**Tests**: build plus E2E DB setup later
**Gate**: build

**Verify**:

- Run `pnpm build`.
- Expected: build succeeds with generated Prisma types accepting draft rows.

**Commit**: `feat(simulados): allow draft simulation answers`

---

### T2: Add Draft Save Schemas

**What**: Extract or add answer-list schemas for draft save payloads while preserving submit validation.
**Where**: `src/features/simulated-exams/simulated-exam.schema.ts`, `src/features/simulated-exams/simulated-exam.schema.test.ts`
**Depends on**: T1
**Reuses**: Existing `simulationSubmitInputSchema` answer shape and duplicate-answer validation.
**Requirement**: DRAFT-01, DRAFT-09

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Draft save schema validates `{ answers: [...] }`.
- [x] Submit schema continues accepting the same answer payload shape.
- [x] Duplicate answers for the same attempt question are rejected in both save and submit paths.
- [x] Empty answer arrays remain accepted where current submit behavior expects them.
- [x] Unit tests cover valid draft save, id trimming, invalid ids, duplicate attempt-question ids, and submit schema regression.
- [x] Gate check passes: `pnpm test:unit`.
- [x] Test count does not decrease.

**Tests**: unit
**Gate**: quick

**Verify**:

- Run `pnpm test:unit src/features/simulated-exams/simulated-exam.schema.test.ts`.
- Expected: schema tests pass, including new draft save cases.

**Commit**: `feat(simulados): add draft answer schemas`

---

### T3: Implement Draft Save Service

**What**: Add service logic to save answers for an in-progress attempt without correction, and update finalization to merge saved answers.
**Where**: `src/features/simulated-exams/simulated-exam.service.ts`, `src/features/simulated-exams/simulated-exam.service.test.ts`
**Depends on**: T2
**Reuses**: `getInProgressSimulationAttemptForStudent`, `submitSimulationAttempt`, `SimulationDomainError`, Prisma transaction pattern.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, DRAFT-05, DRAFT-06, DRAFT-08, DRAFT-09, DRAFT-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `saveSimulationAttemptAnswers` validates attempt ownership.
- [x] Saving rejects completed attempts with `SIMULATION_ATTEMPT_ALREADY_COMPLETED`.
- [x] Saving validates attempt-question membership.
- [x] Saving validates selected alternatives belong to their question without selecting/returning correct-answer fields.
- [x] Saving upserts `SimulationAnswer` rows with `correctAlternativeId: null` and `isCorrect: null`.
- [x] Saving updates `answeredCount` for the in-progress attempt.
- [x] Saving returns safe in-progress detail and does not return `isCorrect`, `correctAlternativeId`, `correctAnswerExplanation`, or equivalent fields.
- [x] `submitSimulationAttempt` corrects the merged set of persisted answers plus payload answers, with payload values taking precedence.
- [x] Unit tests cover save success, not-owned/not-found, already-completed, invalid alternative, safe DTO secrecy, answered count update, and finalization using saved answers.
- [x] Gate check passes: `pnpm test:unit`.
- [x] Test count does not decrease.

**Tests**: unit/integration-light
**Gate**: quick

**Verify**:

- Run `pnpm test:unit src/features/simulated-exams/simulated-exam.service.test.ts`.
- Expected: all simulated-exam service tests pass, including draft save and finalization merge cases.

**Commit**: `feat(simulados): save draft answers without correction`

---

### T4: Add Draft Save API Route

**What**: Add an authenticated student API route for saving draft answers.
**Where**: `src/app/api/student/simulated-exams/[attemptId]/answers/route.ts`
**Depends on**: T3
**Reuses**: Existing student simulated-exam route handler style in `src/app/api/student/simulated-exams/[attemptId]/route.ts`.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-04, DRAFT-08, DRAFT-09, DRAFT-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Relevant Next.js 16 route handler docs are checked under `node_modules/next/dist/docs/`.
- [x] `PUT /api/student/simulated-exams/[attemptId]/answers` requires `STUDENT`.
- [x] Route validates `attemptId` and JSON body with the draft save schema.
- [x] Route calls `saveSimulationAttemptAnswers`.
- [x] Route maps domain errors to stable JSON responses and HTTP statuses.
- [x] Successful response returns only safe in-progress attempt fields.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T6
**Gate**: build

**Verify**:

- Run `pnpm build`.
- Expected: build succeeds and route types compile against Next.js 16.

**Commit**: `feat(simulados): add draft answer API`

---

### T5: Add Save Controls To Attempt View

**What**: Add explicit save behavior and feedback to the in-progress simulated-exam UI.
**Where**: `src/app/app/student/simulados/_components/simulation-attempt-view.tsx`
**Depends on**: T4
**Reuses**: Existing local answer state, `Alert`, `Button`, badges, `messageForError`.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, DRAFT-07, DRAFT-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] In-progress view shows a secondary "Salvar respostas" action.
- [x] Save sends selected answers to `/api/student/simulated-exams/[attemptId]/answers` with `PUT`.
- [x] Save pending state prevents duplicate requests.
- [x] Successful save updates the saved baseline/dirty state and displays concise confirmation.
- [x] Failed save keeps local selections and displays a retryable error.
- [x] Changing an answer after save marks the view as having unsaved changes.
- [x] Finalize remains a distinct action labeled "Finalizar e corrigir".
- [x] No completed-review editing behavior changes.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T6
**Gate**: build

**Verify**:

- Run `pnpm build`.
- Expected: component compiles and no type errors are introduced.

**Commit**: `feat(simulados): add draft save controls`

---

### T6: Add E2E Coverage For Draft Saves

**What**: Extend browser coverage to prove saved answers persist without correction and later finalization works.
**Where**: `src/tests/e2e/student-simulated-exams.spec.ts`, `src/tests/e2e/helpers/simulated-exams.ts` if needed
**Depends on**: T5
**Reuses**: Existing deterministic simulated-exam E2E setup and `loginAs` helper.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, DRAFT-05, DRAFT-06, DRAFT-07, DRAFT-08, DRAFT-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Test saves at least one answer in an in-progress attempt.
- [x] Test navigates away/reopens the attempt and sees the saved alternative selected.
- [x] Test verifies the attempt still shows "Em andamento" and not "Finalizado".
- [x] Test verifies in-progress HTML/network payload does not include `isCorrect`, `correctAlternativeId`, `correctAnswerExplanation`, or known correct-answer markers.
- [x] Test finalizes after reopening and sees expected corrected result.
- [x] Test verifies saving after finalization is rejected through API or UI-visible state.
- [x] Gate check passes: `pnpm test:e2e`.
- [x] E2E count does not decrease.

**Tests**: e2e
**Gate**: e2e

**Verify**:

- Run `pnpm test:e2e src/tests/e2e/student-simulated-exams.spec.ts`.
- Expected: student simulated-exam E2E passes with the new draft-save flow.

**Commit**: `test(simulados): cover draft answer saves`

---

### T7: Final Gate And Knowledge Update

**What**: Run final verification and update project knowledge for the new simulation answer lifecycle.
**Where**: `.notebook/student-simulated-exams.md`, `.specs/features/simulation-answer-drafts/tasks.md`
**Depends on**: T6
**Reuses**: Existing `.notebook` format and task verification pattern.
**Requirement**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, DRAFT-05, DRAFT-06, DRAFT-07, DRAFT-08, DRAFT-09, DRAFT-10

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`, `codenavi`

**Done when**:

- [x] `pnpm test:unit` passes.
- [x] `pnpm test:e2e` passes.
- [x] `pnpm build` passes.
- [x] `.notebook/student-simulated-exams.md` documents that `SimulationAnswer` can be a draft before correction.
- [x] Task statuses are updated from Draft/In Progress to Verified after execution.
- [x] Final implementation summary notes any deviations from this plan.

**Tests**: full/build
**Gate**: full

**Verify**:

- Run `pnpm test:unit`.
- Run `pnpm test:e2e`.
- Run `pnpm build`.
- Expected: all commands pass.

**Commit**: `docs(simulados): record draft answer lifecycle`

---

## Parallel Execution Map

```text
Sequential by design:
  T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7
```

The plan is intentionally sequential because the Prisma nullability change drives generated types, the service contract drives the API, the API drives UI integration, and E2E should verify the full vertical slice after UI integration.

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic Deliverable | Status |
| --- | --- | --- |
| T1 | One Prisma/model migration concern | OK |
| T2 | One schema/test concern | OK |
| T3 | One service/test concern | OK |
| T4 | One API route concern | OK |
| T5 | One UI component concern | OK |
| T6 | One E2E flow concern | OK |
| T7 | One final verification/docs concern | OK |

### Diagram-Definition Cross-Check

| Task | Depends on | Diagram Position | Status |
| --- | --- | --- | --- |
| T1 | None | Starts Phase 1 | OK |
| T2 | T1 | After T1 | OK |
| T3 | T2 | After T2 | OK |
| T4 | T3 | Phase 2 after T3 | OK |
| T5 | T4 | Phase 3 after T4 | OK |
| T6 | T5 | Phase 3 after T5 | OK |
| T7 | T6 | Final phase after T6 | OK |

### Test Co-Location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/migrations | build plus E2E DB setup | build plus E2E DB setup later | OK |
| T2 | Feature schemas | unit | unit | OK |
| T3 | Feature service/data mutation | unit/integration-light | unit/integration-light | OK |
| T4 | API route handler | build plus E2E if user-visible | build; E2E in T6 | OK |
| T5 | App Router visible student flow | e2e for critical flows | build; E2E in T6 | OK |
| T6 | Browser-visible flow | e2e | e2e | OK |
| T7 | Docs/final gates | full/build | full/build | OK |

Note: T4 and T5 rely on T6 for runnable E2E because the user-visible behavior requires the API and UI together. This follows the task reference guidance to merge runnable end-to-end verification into the earliest cohesive integration task.

---

## Tools And Skills For Execution

Before execution, confirm whether to use the following default tool plan:

| Task | MCPs/Tools | Skills |
| --- | --- | --- |
| T1 | filesystem, shell, Prisma scripts | `tlc-spec-driven`, `codenavi` |
| T2 | filesystem, shell/Vitest | `tlc-spec-driven` |
| T3 | filesystem, shell/Vitest | `tlc-spec-driven`, `codenavi` |
| T4 | filesystem, shell/build, Next docs from `node_modules` | `tlc-spec-driven` |
| T5 | filesystem, shell/build | `tlc-spec-driven` |
| T6 | filesystem, Playwright | `tlc-spec-driven` |
| T7 | filesystem, shell gates | `tlc-spec-driven`, `codenavi` |
