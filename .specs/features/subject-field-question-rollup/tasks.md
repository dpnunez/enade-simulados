# Subject Field Question Rollup Tasks

**Design**: `.specs/features/subject-field-question-rollup/design.md`
**Status**: Done

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4
```

---

## Task Breakdown

### T1: Change Question Subject Field Relation to Cascade

**What**: Update the Prisma relation so deleting `SubjectField` cascades to `Question`, while question deletion cascades to alternatives.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma/*`
**Depends on**: Questions feature complete
**Reuses**: Question model from `.specs/features/questions`.
**Requirement**: SFR-02

**Done when**:

- [x] `Question.subjectFieldId` uses `onDelete: Cascade`.
- [x] Migration is checked in.
- [x] Prisma client generation succeeds.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T3
**Gate**: build

---

### T2: Add Question Count to Subject Field Service and UI

**What**: Include and render question counts in the grandes areas list.
**Where**: `src/features/subject-fields/subject-field.service.ts`, `src/app/app/professor/grandes-areas/_components/subject-fields-list.tsx`
**Depends on**: T1
**Reuses**: Existing subject-field list item DTO and `Badge`.
**Requirement**: SFR-01

**Done when**:

- [x] `listSubjectFields` includes `_count.questions`.
- [x] Each subject-field card displays the number of questions.
- [x] Zero questions is displayed clearly.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T3
**Gate**: build

---

### T3: Add E2E Coverage for Counts and Cascade

**What**: Verify question count rendering and cascade delete behavior in the browser/database.
**Where**: `src/tests/e2e/subject-fields.spec.ts`, helpers as needed.
**Depends on**: T2
**Reuses**: Question E2E helpers.
**Requirement**: SFR-01, SFR-02

**Done when**:

- [x] Test creates a deterministic subject field with questions and alternatives.
- [x] Test verifies the grandes areas page shows the expected question count.
- [x] Test deletes the subject field through the UI.
- [x] Test verifies related questions and alternatives are deleted.
- [x] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T4: Run Final Verification and Update Specs

**What**: Run final gates and update spec/task statuses.
**Where**: `.specs/features/subject-field-question-rollup/*`, `.specs/project/STATE.md`
**Depends on**: T3
**Reuses**: Existing `.specs` format.
**Requirement**: SFR-01, SFR-02

**Done when**:

- [x] `pnpm test:unit` passes.
- [x] `pnpm test:e2e` passes.
- [x] `pnpm build` passes.
- [x] Requirement traceability statuses are updated.

**Tests**: full/build
**Gate**: full

---

## Pre-Approval Checks

### Check 1: Task Granularity

| Task | Atomic Deliverable | Status |
| --- | --- | --- |
| T1 | One relation/migration change | Pass |
| T2 | One service/UI count update | Pass |
| T3 | One E2E flow | Pass |
| T4 | One verification/status update | Pass |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends on Field | Diagram Predecessor | Status |
| --- | --- | --- | --- |
| T1 | Questions feature complete | Questions feature | Pass |
| T2 | T1 | T1 | Pass |
| T3 | T2 | T2 | Pass |
| T4 | T3 | T3 | Pass |

### Check 3: Test Co-Location Validation

| Task | Layer | Required by TESTING.md | Planned Tests/Gate | Status |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/migration | build plus E2E DB setup | `pnpm build`; E2E in T3 | Pass |
| T2 | Service/UI visible behavior | build plus E2E | `pnpm build`; E2E in T3 | Pass |
| T3 | Browser/data flow | e2e | `pnpm test:e2e` | Pass |
| T4 | Verification/docs | full/build | `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` | Pass |
