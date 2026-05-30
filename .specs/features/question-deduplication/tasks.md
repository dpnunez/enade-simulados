# Question Deduplication Tasks

**Design**: `.specs/features/question-deduplication/design.md`
**Status**: Complete

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure helpers and validation | unit | `pnpm test:unit` |
| Feature services and schemas | unit with mocked Prisma/adapters | `pnpm test:unit` |
| API route handlers and data mutations | unit/integration-light, plus E2E if user-visible | `pnpm test:unit`, `pnpm test:e2e` |
| App Router pages/layouts with visible behavior | e2e for critical flows | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `pnpm build`, `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- E2E data is not reset between runs, so duplicate-question browser tests must use deterministic markers and cleanup.
- Question browser flow already has a coverage gap, so this feature should add focused E2E coverage.
- Prisma schema changes require `pnpm prisma:generate` and `pnpm build`.
- If API route behavior changes beyond domain error mapping, check Next.js 16 docs under `node_modules/next/dist/docs/` before editing.

---

## Execution Plan

### Phase 1: Hash Contract

```text
T1
```

### Phase 2: Database and Service Invariant

```text
T1 -> T2 -> T3
```

### Phase 3: API/UI Feedback

```text
T3 -> T4 -> T5
```

### Phase 4: Browser Coverage and Final Gate

```text
T5 -> T6 -> T7
```

---

## Task Breakdown

### T1: Create Question Content Hash Helper

**What**: Implement canonicalization and SHA-256 hashing for question markdown.
**Where**: `src/features/questions/question-content-hash.ts`, `src/features/questions/question-content-hash.test.ts`
**Depends on**: None
**Reuses**: Parsed `descriptionMarkdown` from `src/features/questions/question.schema.ts`.
**Requirement**: QDUP-01, QDUP-03, QDUP-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `normalizeQuestionMarkdownForHash` trims whitespace.
- [x] `normalizeQuestionMarkdownForHash` normalizes CRLF/CR line endings.
- [x] `normalizeQuestionMarkdownForHash` collapses repeated whitespace to one ASCII space.
- [x] `createQuestionContentHash` returns a lowercase SHA-256 hex digest.
- [x] Unit tests prove equivalent whitespace variants produce the same hash.
- [x] Unit tests prove meaningfully different text produces a different hash.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T2: Add Question Content Hash Column

**What**: Add `Question.contentHash`, backfill existing rows, create a unique index, and regenerate Prisma client.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma/*`
**Depends on**: T1
**Reuses**: Existing Prisma schema and migration workflow.
**Requirement**: QDUP-01, QDUP-02, QDUP-04, QDUP-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `Question` has `contentHash String @unique`.
- [x] Migration backfills `contentHash` for existing questions using the same canonicalization rules as the helper.
- [x] Migration fails explicitly if duplicate hashes already exist before unique index creation.
- [x] Unique index exists for `Question.contentHash`.
- [x] Prisma client generation succeeds with `pnpm prisma:generate`.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E DB setup in T6
**Gate**: build

---

### T3: Enforce Hash in Question Service

**What**: Persist `contentHash` on create/update and map unique constraint conflicts to a duplicate-content domain error.
**Where**: `src/features/questions/question.service.ts`, `src/features/questions/question.service.test.ts`
**Depends on**: T2
**Reuses**: Existing `questionData`, `mapQuestionWriteError`, Prisma error-code mapping, and service tests.
**Requirement**: QDUP-01, QDUP-02, QDUP-03, QDUP-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `questionData` includes `contentHash: createQuestionContentHash(parsed.descriptionMarkdown)`.
- [x] `QuestionErrorCode` includes `QUESTION_DUPLICATE_CONTENT`.
- [x] Prisma `P2002` for `contentHash` maps to `QUESTION_DUPLICATE_CONTENT`.
- [x] Create duplicate test asserts no second question is accepted.
- [x] Update duplicate test asserts the original question remains unchanged.
- [x] Update unchanged self-content test remains allowed.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T4: Map Duplicate Error in Question API Routes

**What**: Return stable conflict responses for duplicate question create/update.
**Where**: `src/app/api/questions/route.ts`, `src/app/api/questions/[questionId]/route.ts`
**Depends on**: T3
**Reuses**: Existing question API error mapping style.
**Requirement**: QDUP-01, QDUP-03

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `QUESTION_DUPLICATE_CONTENT` returns HTTP `409`.
- [x] Response body preserves the existing form-friendly JSON shape.
- [x] Other existing question domain errors keep their current behavior.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T6
**Gate**: build

---

### T5: Show Duplicate Feedback in Question Form

**What**: Add a Portuguese duplicate-content message to create/edit submission handling without clearing drafts.
**Where**: `src/app/app/professor/questoes/_components/question-form.tsx`
**Depends on**: T4
**Reuses**: Existing form submit/error alert behavior.
**Requirement**: QDUP-01, QDUP-03

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Create duplicate response shows a clear message such as `Ja existe uma questao com este enunciado.`
- [x] Update duplicate response shows the same message.
- [x] Form values remain in place after duplicate submission.
- [x] Existing validation and success states still work.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T6
**Gate**: build

---

### T6: Add Browser Coverage for Duplicate Prevention

**What**: Add Playwright coverage for create/update duplicate rejection through the visible professor flow.
**Where**: `src/tests/e2e/questions.spec.ts`, `src/tests/e2e/helpers/questions.ts`
**Depends on**: T5
**Reuses**: Existing `loginAs`, seeded `teacher@enade.local`, and question cleanup helpers.
**Requirement**: QDUP-01, QDUP-03, QDUP-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Test data uses deterministic marker text and cleanup to avoid leakage.
- [x] E2E creates one question and verifies duplicate create is rejected.
- [x] E2E verifies duplicate submission preserves visible form input.
- [x] E2E creates/uses a second question and verifies duplicate update is rejected.
- [x] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T7: Run Final Verification

**What**: Run full verification and update task/spec statuses based on results.
**Where**: `.specs/features/question-deduplication/spec.md`, `.specs/features/question-deduplication/tasks.md`
**Depends on**: T6
**Reuses**: Existing project test scripts.
**Requirement**: QDUP-01, QDUP-02, QDUP-03, QDUP-04, QDUP-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `pnpm test:unit` passes.
- [x] `pnpm build` passes.
- [x] `pnpm test:e2e` passes.
- [x] Requirement traceability remains accurate.
- [x] Tasks are marked complete only after verification.

**Tests**: unit + build + e2e
**Gate**: full

---

## Pre-Approval Validation

### Task Granularity Check

| Task | Atomic Deliverable | Result |
| --- | --- | --- |
| T1 | One helper module plus colocated unit test | Pass |
| T2 | One Prisma model/migration change | Pass |
| T3 | One service invariant integration | Pass |
| T4 | One API error-mapping update | Pass |
| T5 | One form feedback update | Pass |
| T6 | One E2E coverage update | Pass |
| T7 | One final verification/status update | Pass |

### Diagram-Definition Cross-Check

| Task | Depends on Field | Execution Plan Incoming Edge | Result |
| --- | --- | --- | --- |
| T1 | None | None | Pass |
| T2 | T1 | T1 -> T2 | Pass |
| T3 | T2 | T2 -> T3 | Pass |
| T4 | T3 | T3 -> T4 | Pass |
| T5 | T4 | T4 -> T5 | Pass |
| T6 | T5 | T5 -> T6 | Pass |
| T7 | T6 | T6 -> T7 | Pass |

### Test Co-Location Validation

| Task | Code Layer | Required Test Type | Task Tests Field | Result |
| --- | --- | --- | --- | --- |
| T1 | Pure helper | unit | unit | Pass |
| T2 | Prisma schema/migration | build plus E2E DB setup | build; E2E DB setup in T6 | Pass |
| T3 | Feature service | unit/integration-light | unit/integration-light | Pass |
| T4 | API route handler | build plus E2E if user-visible | build; E2E in T6 | Pass |
| T5 | Visible form behavior | build plus E2E | build; E2E in T6 | Pass |
| T6 | Browser flow | e2e | e2e | Pass |
| T7 | Verification/docs | full gate | unit + build + e2e | Pass |

---

## Execution Tooling Question

Before implementation, confirm whether to use the default local tools for every task:

- MCP: filesystem/local shell only.
- Skills: `tlc-spec-driven` for execution tracking and `codenavi` for code exploration.
