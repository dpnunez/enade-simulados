# Professor Content Organization Tasks

**Design**: `.specs/features/professor-content-organization/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```text
T1 -> T2 -> T3
```

### Phase 2: Subject Fields (Sequential)

```text
T3 -> T4 -> T5 -> T6
```

### Phase 3: Questions (Sequential)

```text
T3 -> T7 -> T8 -> T9
```

### Phase 4: Verification (Sequential)

```text
T6 + T9 -> T10
```

Parallel implementation may be possible between subject-field UI and question UI after T3, but E2E tests are not parallel-safe in this project, so final browser verification remains sequential.

---

## Task Breakdown

### T1: Add React Query Dependency And Provider

**What**: Install `@tanstack/react-query` and add a small authenticated-app query provider.
**Where**: `package.json`, lockfile, `src/app/app/query-provider.tsx`, `src/app/app/layout.tsx`
**Depends on**: None
**Reuses**: Existing app layout shell.
**Requirement**: PCO-03, PCO-06, PCO-08

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `@tanstack/react-query` is installed.
- [ ] Authenticated app routes can render React Query hooks under a `QueryClientProvider`.
- [ ] Existing `Toaster`/sonner setup is available to authenticated pages, or added if missing.
- [ ] Public login/password pages are not unnecessarily touched.
- [ ] Ranking files remain unchanged.

**Tests**: build/type check
**Gate**: `pnpm build`

---

### T2: Add Question Pagination Query Contract

**What**: Add Zod schema/types for question list query params and paginated response support.
**Where**: `src/features/questions/question.schema.ts`, `src/features/questions/question.service.ts`, colocated tests
**Depends on**: T1
**Reuses**: Existing question schema/service patterns and Prisma include with subject field and alternatives.
**Requirement**: PCO-06, PCO-07, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`

**Done when**:

- [ ] Query schema handles `page`, `pageSize`, `sort`, `direction`.
- [ ] Service returns `{ rows, rowCount, page, pageSize, pageCount }`.
- [ ] Existing unpaginated question behavior is retained only where needed, or call sites are updated intentionally.
- [ ] Unit tests cover defaults, bounds, sorting and count math.

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T3: Add GET APIs For List Screens

**What**: Add teacher-protected `GET` handlers for subject fields and questions.
**Where**: `src/app/api/subject-fields/route.ts`, `src/app/api/questions/route.ts`, route tests if current pattern supports them
**Depends on**: T2
**Reuses**: Existing route auth pattern from current `POST` handlers and question/subject-field services.
**Requirement**: PCO-03, PCO-06, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`

**Done when**:

- [ ] `GET /api/subject-fields` returns all subject-field rows for TEACHER users without pagination.
- [ ] `GET /api/questions` returns paginated question rows for TEACHER users.
- [ ] Unauthorized users receive the same structured unauthorized style as existing routes.
- [ ] Invalid query params are handled predictably.

**Tests**: unit/integration-light
**Gate**: `pnpm test:unit`

---

### T4: Split Subject Field Create Page

**What**: Create `/app/professor/grandes-areas/nova` and make creation redirect to the list.
**Where**: `src/app/app/professor/grandes-areas/nova/page.tsx`, `src/app/app/professor/grandes-areas/_components/subject-field-form.tsx`
**Depends on**: T3
**Reuses**: Existing `SubjectFieldForm`, page header/card/button patterns.
**Requirement**: PCO-01, PCO-02, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`, `shadcn`

**Done when**:

- [ ] Create page is teacher-protected.
- [ ] Form page does not render the list.
- [ ] Successful create redirects to `/app/professor/grandes-areas`.
- [ ] Form keeps inline field validation and uses `sonner` for submission success/domain errors.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T5: Replace Subject Field Cards With React Table + React Query

**What**: Replace the subject-field list cards with an unpaginated React Table backed by React Query.
**Where**: `src/app/app/professor/grandes-areas/page.tsx`, `src/app/app/professor/grandes-areas/_components/subject-fields-table.tsx`
**Depends on**: T4
**Reuses**: `src/components/ui/table.tsx`, delete/edit behavior from `SubjectFieldsList`, ranking table column/sorting pattern.
**Requirement**: PCO-03, PCO-04, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`, `shadcn`

**Done when**:

- [ ] `/app/professor/grandes-areas` renders only list/table content plus create CTA.
- [ ] Table supports loading, error, empty and basic client-side sorting/filtering when implemented.
- [ ] Edit/delete mutations update or invalidate the React Query cache.
- [ ] Edit/delete success and failure feedback uses `sonner`.
- [ ] Delete copy accounts for cascade impact on questions.
- [ ] Ranking files remain unchanged.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T6: Update Subject Field E2E Coverage

**What**: Update browser coverage for split create/list subject-field flow.
**Where**: `src/tests/e2e/subject-fields.spec.ts`, helpers if needed
**Depends on**: T5
**Reuses**: Existing subject-field E2E helper patterns.
**Requirement**: PCO-01, PCO-02, PCO-03, PCO-04, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`

**Done when**:

- [ ] Test creates a grande area from `/nova`.
- [ ] Test confirms redirect/list visibility.
- [ ] Test exercises table rendering and sorting/filtering where deterministic.
- [ ] Test confirms edit/delete still work.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T7: Improve Question Form UX

**What**: Reorganize the question form into clearer sections while preserving schema, payload and redirect behavior.
**Where**: `src/app/app/professor/questoes/_components/question-form.tsx`, optionally small local subcomponents in same folder
**Depends on**: T3
**Reuses**: Existing `QuestionForm`, `MarkdownEditor`, shadcn form/input/table primitives.
**Requirement**: PCO-05, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`, `shadcn`

**Done when**:

- [ ] Enunciado, metadados, explicacao and alternativas are visually grouped.
- [ ] Validation messages remain close to fields.
- [ ] Submission success and API/domain errors use `sonner`.
- [ ] Correct alternative state is obvious.
- [ ] Add/remove/reorder behavior remains intact.
- [ ] Successful create still redirects to `/app/professor/questoes`.

**Tests**: e2e plus unit if helpers are extracted
**Gate**: `pnpm test:e2e`

---

### T8: Replace Questions Cards With React Table + React Query

**What**: Replace question list cards with a paginated React Table backed by React Query.
**Where**: `src/app/app/professor/questoes/page.tsx`, `src/app/app/professor/questoes/_components/questions-table.tsx`
**Depends on**: T7
**Reuses**: Current `QuestionsList` labels/preview/delete behavior, `src/components/ui/table.tsx`.
**Requirement**: PCO-06, PCO-07, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`, `shadcn`

**Done when**:

- [ ] `/app/professor/questoes` loads question rows via paginated `GET /api/questions`.
- [ ] Table displays required columns with pagination controls.
- [ ] Page, page size and supported sorting update the API query.
- [ ] Edit link routes to `/app/professor/questoes/[id]`.
- [ ] Delete confirmation calls existing delete route and invalidates the query.
- [ ] Delete success and failure feedback uses `sonner`.
- [ ] Empty and error states are present.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T9: Add/Update Question Browser E2E Coverage

**What**: Add focused browser coverage for question create/list/edit/delete behavior after UX/list changes.
**Where**: `src/tests/e2e/questions.spec.ts`, `src/tests/e2e/helpers/questions.ts`
**Depends on**: T8
**Reuses**: Existing question helpers and deterministic teacher user.
**Requirement**: PCO-05, PCO-06, PCO-07, PCO-08

**Tools**:

- MCP: NONE
- Skill: `codenavi`

**Done when**:

- [ ] Test covers creating a question through the refreshed form.
- [ ] Test confirms redirect to table list.
- [ ] Test confirms edit link remains functional.
- [ ] Test confirms delete removes the row from the list.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T10: Final Regression Gate

**What**: Run final checks and verify ranking was not modified.
**Where**: repository root
**Depends on**: T6, T9
**Reuses**: Existing package scripts and git diff.
**Requirement**: PCO-01 through PCO-08

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm test:unit` passes.
- [ ] `pnpm test:e2e` passes.
- [ ] `pnpm build` passes.
- [ ] Git diff shows no changes under `src/app/app/professor/ranking`, `src/app/api/teacher/simulation-ranking`, or `src/features/simulation-ranking`.

**Tests**: full
**Gate**: `pnpm test && pnpm build`

---

## Parallel Execution Map

```text
Foundation:
  T1 -> T2 -> T3

Subject fields:
  T3 -> T4 -> T5 -> T6

Questions:
  T3 -> T7 -> T8 -> T9

Final:
  T6 + T9 -> T10
```

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic? | Notes |
| --- | --- | --- |
| T1 | Pass | One dependency/provider deliverable. |
| T2 | Pass | One service/schema contract. |
| T3 | Pass | One API read surface across two existing route files because both share the same React Query foundation. |
| T4 | Pass | One create route/form redirect deliverable. |
| T5 | Pass | One subject-field table deliverable. |
| T6 | Pass | One E2E update for subject-field flow. |
| T7 | Pass | One form UX refresh. |
| T8 | Pass | One questions table deliverable. |
| T9 | Pass | One E2E update for questions flow. |
| T10 | Pass | One final gate/regression check. |

### Diagram-Definition Cross-Check

| Task | Depends on in Breakdown | Diagram Match |
| --- | --- | --- |
| T1 | None | Pass |
| T2 | T1 | Pass |
| T3 | T2 | Pass |
| T4 | T3 | Pass |
| T5 | T4 | Pass |
| T6 | T5 | Pass |
| T7 | T3 | Pass |
| T8 | T7 | Pass |
| T9 | T8 | Pass |
| T10 | T6, T9 | Pass |

### Test Co-Location Validation

| Task | Code Layer | Required Test Type | Tests Field Match |
| --- | --- | --- | --- |
| T1 | Provider/config dependency | build/type check | Pass |
| T2 | Feature service/schema | unit | Pass |
| T3 | API route handlers | unit/integration-light | Pass |
| T4 | App Router visible flow | e2e | Pass |
| T5 | App Router visible table/mutations | e2e | Pass |
| T6 | E2E spec/helper | e2e | Pass |
| T7 | Behaviorful UI form | e2e plus unit if helper extraction | Pass |
| T8 | Behaviorful UI table/mutations | e2e | Pass |
| T9 | E2E spec/helper | e2e | Pass |
| T10 | Final user-facing regression | full/build | Pass |

---

## Tooling Question Before Execution

Before executing these tasks, confirm whether to use only local tools/skills or also install/use additional MCPs. Available skills in this session that fit this feature are `tlc-spec-driven`, `codenavi`, and `shadcn`.
