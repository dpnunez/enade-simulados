# Questions Tasks

**Design**: `.specs/features/questions/design.md`
**Status**: Draft

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure validation/helpers | unit | `pnpm test:unit` |
| Services/domain mutations | unit/integration-light with mocked boundaries where practical | `pnpm test:unit` |
| API route handlers | E2E through visible flows; build for type checks | `pnpm test:e2e`, `pnpm build` |
| Visible browser flow | e2e | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `pnpm build`, `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- Mutations must authorize internally and must not rely on `src/proxy.ts` or page visibility.
- E2E data is not reset between runs, so question browser tests must clean deterministic records.
- Prisma schema changes require `pnpm prisma:generate` and `pnpm build`.
- Next.js 16 docs under `node_modules/next/dist/docs/` must be checked before editing routes/pages.

---

## Execution Plan

### Phase 1: Data and Domain Foundation

```text
T1 -> T2 -> T3 -> T4
```

### Phase 2: Mutation Boundary and Editor Foundation

```text
T4 -> T5
T4 -> T6
T5 + T6 -> T7
```

### Phase 3: UI Integration

```text
T7 -> T8 -> T9 -> T10
```

### Phase 4: Browser Coverage and Final Gate

```text
T10 -> T11 -> T12
```

---

## Task Breakdown

### T1: Add Question Prisma Models

**What**: Add `QuestionDifficulty`, `QuestionSource`, `Question`, `QuestionAlternative`, migration, partial unique index for one correct alternative, and generated Prisma client.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma/*`
**Depends on**: None
**Reuses**: Existing Prisma schema, `SubjectField`, `User`, migration patterns.
**Requirement**: QST-01, QST-02, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Enums are named `QuestionDifficulty` and `QuestionSource`.
- [x] `Question` has `descriptionMarkdown`, `difficulty`, `source`, `year`, `subjectFieldId`, `correctAnswerExplanation`, `createdById`, `createdAt`, and `updatedAt`.
- [x] `Question.subjectFieldId` references `SubjectField.id` with delete behavior intentionally kept non-cascade for this phase.
- [x] `Question.createdById` references `User.id` for audit.
- [x] `QuestionAlternative` has `contentMarkdown`, `position`, and `isCorrect`.
- [x] `QuestionAlternative.questionId` references `Question.id` with `onDelete: Cascade`.
- [x] Migration includes a database-level guard for at most one correct alternative per question.
- [x] Prisma client generation succeeds.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T2: Create Question Validation Schema

**What**: Implement Zod schemas and normalization for question create/update inputs.
**Where**: `src/features/questions/question.schema.ts`, `src/features/questions/question.schema.test.ts`
**Depends on**: T1
**Reuses**: `src/features/subject-fields/subject-field.schema.ts`.
**Requirement**: QST-01, QST-03, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Schema trims markdown fields and normalizes empty optional fields to `null`.
- [x] Schema validates difficulty and optional source enums.
- [x] Schema validates optional integer year.
- [x] Schema validates required `subjectFieldId`.
- [x] Schema validates 2 to 8 alternatives.
- [x] Schema validates alternative markdown content.
- [x] Schema enforces exactly one correct alternative.
- [x] Unit tests cover valid input, empty description, invalid difficulty, omitted source/year, invalid source, invalid year, missing subject field id, too few alternatives, empty alternative, zero correct alternatives, and two correct alternatives.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Implement Question Service

**What**: Implement list, create, update, delete, transactional alternative replacement, and domain error mapping.
**Where**: `src/features/questions/question.service.ts`, `src/features/questions/question.service.test.ts`
**Depends on**: T2
**Reuses**: Subject-field service/domain error pattern and Prisma singleton.
**Requirement**: QST-01, QST-02, QST-03, QST-04, QST-05, QST-06, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `listQuestions` returns questions ordered by `updatedAt desc` with subject field and alternatives.
- [x] `getQuestionForEdit` returns one question with subject field and alternatives or throws `QUESTION_NOT_FOUND`.
- [x] `createQuestion` validates input, checks subject field existence, creates question and alternatives in one transaction, and stores `createdById`.
- [x] `updateQuestion` validates input, checks question and subject field existence, updates question fields, and replaces alternatives transactionally.
- [x] `deleteQuestion` deletes the question and relies on cascade to delete alternatives.
- [x] Domain errors include `QUESTION_NOT_FOUND`, `QUESTION_SUBJECT_FIELD_NOT_FOUND`, and stable validation/write failure mapping as needed.
- [x] Unit/integration-light tests cover list ordering, get-for-edit success, get-for-edit not found, create success, missing subject field, invalid correct count, update success with replaced alternatives, not-found update, transactional rollback on invalid update, delete success, and not-found delete.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T4: Add Question API Routes

**What**: Implement create, update, and delete route handlers with server-side teacher authorization.
**Where**: `src/app/api/questions/route.ts`, `src/app/api/questions/[questionId]/route.ts`
**Depends on**: T3
**Reuses**: `src/app/api/subject-fields/*`, `src/infra/auth/server.ts`, `src/infra/auth/authorization.ts`.
**Requirement**: QST-01, QST-03, QST-05, QST-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Relevant Next.js 16 route handler docs under `node_modules/next/dist/docs/` are checked before editing.
- [x] `POST /api/questions` validates JSON, requires `TEACHER`, calls the service, and returns form-friendly JSON.
- [x] `PATCH /api/questions/[questionId]` validates id/body, requires `TEACHER`, calls the service, and returns form-friendly JSON.
- [x] `DELETE /api/questions/[questionId]` validates id, requires `TEACHER`, calls the service, and returns form-friendly JSON.
- [x] Unauthorized requests return `401` and mutate no data.
- [x] Domain errors return stable error codes.
- [x] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T11
**Gate**: build

---

### T5: Install and Wrap MDXEditor

**What**: Add `@mdxeditor/editor` and implement a client-only markdown editor wrapper for form usage.
**Where**: `package.json`, lockfile, `src/app/app/professor/questoes/_components/markdown-editor.tsx` or `src/components/markdown/markdown-editor.tsx`, `src/app/globals.css` if CSS import is centralized.
**Depends on**: T4
**Reuses**: Official MDXEditor Next.js App Router pattern and shadcn visual framing.
**Requirement**: QST-01

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Dependency is installed with pnpm.
- [ ] Editor wrapper renders client-side only with SSR disabled.
- [ ] Editor accepts `value` and emits markdown via `onChange`.
- [ ] Basic plugins are enabled for headings, lists, quote, thematic break, markdown shortcuts, and toolbar controls that are useful for question text.
- [ ] CSS is loaded according to MDXEditor docs without breaking app styles.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T11
**Gate**: build

---

### T6: Build Question Form

**What**: Build a client component for creating and editing questions, including alternatives managed by `react-hook-form`.
**Where**: `src/app/app/professor/questoes/_components/question-form.tsx`
**Depends on**: T4
**Reuses**: Subject-field form pattern, shadcn primitives, `useFieldArray`.
**Requirement**: QST-01, QST-03, QST-05, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Component uses `react-hook-form` with `zodResolver`.
- [ ] Create mode posts to `/api/questions`.
- [ ] Edit mode patches `/api/questions/[questionId]`.
- [ ] Form includes markdown description, difficulty, source, year, subject field, explanation, and alternatives.
- [ ] Subject field select is populated from server-provided options.
- [ ] Create mode initializes 5 alternatives by default.
- [ ] Alternatives can be added, removed, reordered, and marked as the single correct option.
- [ ] Submission states, success state, and error state are visible and accessible.
- [ ] Successful create resets to a useful blank state; successful edit exits or reports completion cleanly.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T11
**Gate**: build

---

### T7: Connect Form to Markdown Editor

**What**: Integrate the MDXEditor wrapper into the question form for the required question description field.
**Where**: `src/app/app/professor/questoes/_components/question-form.tsx`, markdown editor wrapper.
**Depends on**: T5, T6
**Reuses**: `react-hook-form` controlled field pattern.
**Requirement**: QST-01, QST-03, QST-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Question description uses MDXEditor and stores markdown in `descriptionMarkdown`.
- [ ] Correct-answer explanation remains a plain optional text control mapped to `correctAnswerExplanation`.
- [ ] Form validation errors remain visible near the editor fields.
- [ ] Existing edit values load correctly into the editor.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T11
**Gate**: build

---

### T8: Build Questions List Component

**What**: Build list UI with empty state, metadata, alternatives summary, edit links, and confirmed delete controls.
**Where**: `src/app/app/professor/questoes/_components/questions-list.tsx`
**Depends on**: T7
**Reuses**: Subject-fields list pattern, shadcn `Card`, `Badge`, `Button`, lucide icons.
**Requirement**: QST-04, QST-05, QST-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Empty state renders when no questions exist.
- [ ] Each listed question shows subject field title, difficulty, source/year when present, updated date, and a markdown/plain-text preview.
- [ ] Alternatives summary shows count and identifies that one correct answer exists without exposing it too noisily in list view.
- [ ] Edit control is available for every question and links to `/app/professor/questoes/[id]`.
- [ ] Delete control requires confirmation before calling the API.
- [ ] Confirmed delete removes the question from the local list and refreshes server data.
- [ ] UI text fits at mobile and desktop widths.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build; E2E in T11
**Gate**: build

---

### T9: Add Teacher Questions Pages and Navigation

**What**: Add separate pages for listing, creating, and editing questions, plus navigation entries/actions for teachers.
**Where**: `src/app/app/professor/questoes/page.tsx`, `src/app/app/professor/questoes/nova/page.tsx`, `src/app/app/professor/questoes/[id]/page.tsx`, `src/app/app/layout.tsx`
**Depends on**: T8
**Reuses**: Grandes areas teacher page and private layout nav.
**Requirement**: QST-01, QST-04

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Relevant Next.js 16 page/App Router docs under `node_modules/next/dist/docs/` are checked before editing.
- [ ] List, create, and edit pages call `requireRole("TEACHER")`.
- [ ] List page title is exactly "Gerenciar questoes".
- [ ] Create page title is exactly "Criar questao".
- [ ] Edit page title is exactly "Editar questao".
- [ ] List page fetches questions server-side and does not render the create form.
- [ ] List page exposes a clear action linking to `/app/professor/questoes/nova`.
- [ ] List page edit actions link to `/app/professor/questoes/[id]`.
- [ ] Create page fetches subject fields server-side and renders the creation form.
- [ ] Edit page fetches subject fields and the selected question server-side, then renders the form prefilled.
- [ ] Successful create returns the teacher to `/app/professor/questoes` or otherwise makes the created question visible from the list.
- [ ] Successful edit returns the teacher to `/app/professor/questoes` or otherwise makes the edited question visible from the list.
- [ ] Navigation exposes `/app/professor/questoes` for teachers.
- [ ] Create page gracefully handles no subject fields.
- [ ] Edit page gracefully handles missing question.
- [ ] Gate check passes: `pnpm build`.

**Tests**: e2e required for visible flow, implemented in T11
**Gate**: build

---

### T10: Add E2E Helpers for Questions

**What**: Add deterministic cleanup/creation helpers for question E2E data.
**Where**: `src/tests/e2e/helpers/questions.ts`, optional updates to `src/tests/e2e/helpers/subject-fields.ts`
**Depends on**: T9
**Reuses**: Existing E2E helper structure and Prisma cleanup style.
**Requirement**: QST-01, QST-04, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Helper can clean deterministic question rows by title/content marker or subject field marker.
- [ ] Helper can ensure a deterministic subject field exists for question tests.
- [ ] Helper deletes alternatives through question cascade or explicit cleanup.
- [ ] Gate check passes as part of T11.

**Tests**: e2e helper
**Gate**: e2e

---

### T11: Add E2E Coverage for Teacher Question Flow

**What**: Cover teacher create, list, edit, delete, validation, and student denial in the browser.
**Where**: `src/tests/e2e/questions.spec.ts`
**Depends on**: T10
**Reuses**: `loginAs`, deterministic users, question/subject-field helpers.
**Requirement**: QST-01, QST-03, QST-04, QST-05, QST-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`, `browser` if manual visual verification is needed

**Done when**:

- [ ] Test cleans deterministic question data before use.
- [ ] Teacher can open the list page and see heading "Gerenciar questoes".
- [ ] Teacher can navigate from the list page to the create page and see heading "Criar questao".
- [ ] Teacher can navigate from the list page to an edit page and see heading "Editar questao".
- [ ] Teacher can create a question with markdown description, grande area, difficulty, and alternatives.
- [ ] Teacher sees 5 alternatives when opening a blank create form.
- [ ] Teacher can see the question listed with subject field and metadata.
- [ ] Teacher can edit the question through `/app/professor/questoes/[id]` and verify updated values after refresh.
- [ ] Teacher can delete the question only after confirmation.
- [ ] Validation prevents saving when two alternatives are marked correct.
- [ ] Student cannot access the list or create pages.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T12: Run Full Verification and Update Specs

**What**: Run final gates and mark spec/task traceability according to actual results.
**Where**: `.specs/features/questions/spec.md`, `.specs/features/questions/tasks.md`, `.specs/project/STATE.md`
**Depends on**: T11
**Reuses**: Existing `.specs` status format.
**Requirement**: QST-01, QST-02, QST-03, QST-04, QST-05, QST-06, QST-07

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm test:unit` passes.
- [ ] `pnpm test:e2e` passes.
- [ ] `pnpm build` passes.
- [ ] Requirement traceability statuses are updated.
- [ ] Any implementation deviations are documented with `SPEC_DEVIATION`.

**Tests**: full/build
**Gate**: full

---

## Parallel Execution Map

```text
Phase 1:
  T1 -> T2 -> T3 -> T4

Phase 2:
  T4 complete, then:
    T5 and T6 can be implemented independently in code,
    but their build gates should be run deliberately to avoid overlapping dependency/editor failures.
  T5 + T6 -> T7

Phase 3:
  T7 -> T8 -> T9

Phase 4:
  T9 -> T10 -> T11 -> T12
```

No tasks are marked `[P]` in this draft because schema/generated types, shared route-local UI, dependency installation, and the non-parallel E2E database make sequential execution safer for this core feature.

---

## Pre-Approval Checks

### Check 1: Task Granularity

| Task | Atomic Deliverable | Status |
| --- | --- | --- |
| T1 | One data model/migration foundation | Pass |
| T2 | One validation schema module with colocated tests | Pass |
| T3 | One service module with colocated tests | Pass |
| T4 | One API boundary group for create/update/delete | Pass |
| T5 | One editor dependency/wrapper foundation | Pass |
| T6 | One form component with alternatives field array | Pass |
| T7 | One integration of editor into form | Pass |
| T8 | One list component | Pass |
| T9 | One page/navigation integration | Pass |
| T10 | One E2E helper set | Pass |
| T11 | One E2E flow spec | Pass |
| T12 | One verification/status update | Pass |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends on Field | Diagram Predecessor | Status |
| --- | --- | --- | --- |
| T1 | None | None | Pass |
| T2 | T1 | T1 | Pass |
| T3 | T2 | T2 | Pass |
| T4 | T3 | T3 | Pass |
| T5 | T4 | T4 | Pass |
| T6 | T4 | T4 | Pass |
| T7 | T5, T6 | T5 + T6 | Pass |
| T8 | T7 | T7 | Pass |
| T9 | T8 | T8 | Pass |
| T10 | T9 | T9 | Pass |
| T11 | T10 | T10 | Pass |
| T12 | T11 | T11 | Pass |

### Check 3: Test Co-Location Validation

| Task | Layer | Required by TESTING.md | Planned Tests/Gate | Status |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/migration | build plus E2E DB setup | `pnpm build`; E2E in T11 | Pass |
| T2 | Pure validation | unit | colocated `*.test.ts`, `pnpm test:unit` | Pass |
| T3 | Service/data mutation rules | unit/integration-light | colocated `*.test.ts`, `pnpm test:unit` | Pass |
| T4 | API route handlers | E2E through visible flows; build | `pnpm build`; E2E in T11 | Pass |
| T5 | Editor wrapper/dependency | build; E2E visible behavior | `pnpm build`; E2E in T11 | Pass |
| T6 | Form UI | build; E2E visible behavior | `pnpm build`; E2E in T11 | Pass |
| T7 | Form/editor integration | build; E2E visible behavior | `pnpm build`; E2E in T11 | Pass |
| T8 | List UI | build; E2E visible behavior | `pnpm build`; E2E in T11 | Pass |
| T9 | Page/navigation | e2e for critical flow | `pnpm build`; E2E in T11 | Pass |
| T10 | E2E helper | e2e | T11 `pnpm test:e2e` | Pass |
| T11 | Browser flow | e2e | `pnpm test:e2e` | Pass |
| T12 | Verification/docs | full/build | `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` | Pass |

---

## Tooling Question Before Execution

Recommended execution tools:

- Filesystem edits through `apply_patch`.
- Local commands for `pnpm prisma:generate`, `pnpm build`, `pnpm test:unit`, and `pnpm test:e2e`.
- `browser` plugin for manual visual verification after the UI is implemented.
- No extra MCP is required unless the user wants live browser inspection beyond Playwright.
