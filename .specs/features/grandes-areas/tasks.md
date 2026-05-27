# Grandes Areas Tasks

**Design**: `.specs/features/grandes-areas/design.md`
**Status**: Phase 1 complete

---

## Testing Baseline

This plan uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure validation/helpers | unit | `pnpm test:unit` |
| Services/API mutations | unit/integration-light with mocked boundaries where practical | `pnpm test:unit` |
| Visible browser flow | e2e | `pnpm test:e2e` |
| Prisma schema/migrations | build plus E2E DB setup | `pnpm build`, `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |

Relevant concerns:

- Mutations must authorize internally and must not rely on `src/proxy.ts` or page visibility.
- E2E data is not reset between runs, so subject-field browser tests must clean their deterministic records.
- Prisma schema changes require `pnpm prisma:generate` and `pnpm build`.

---

## Execution Plan

### Phase 1: Data and Domain Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Mutation Boundary and UI

```text
T3 -> T4 -> T5 -> T6 -> T7
```

### Phase 3: Browser Coverage and Final Gate

```text
T7 -> T8 -> T9
```

---

## Task Breakdown

### T1: Add SubjectField Prisma Model ✅

**What**: Add the `SubjectField` data model, relation to `User`, migration, and generated Prisma client.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma/*`
**Depends on**: None
**Reuses**: Existing Prisma schema/migration patterns and `User` model.
**Requirement**: GA-01, GA-03, GA-05, GA-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `SubjectField` has `id`, `title`, `titleNormalized`, `description`, `colorHex`, `createdById`, `createdAt`, and `updatedAt`.
- [x] `SubjectField.createdById` references `User.id`.
- [x] `titleNormalized` is unique across the whole `SubjectField` table.
- [x] Migration is checked in.
- [x] Prisma client generation succeeds.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T2: Create Subject Field Validation Schema ✅

**What**: Implement Zod schemas and normalization helpers for create/update inputs.
**Where**: `src/features/subject-fields/subject-field.schema.ts`, `src/features/subject-fields/subject-field.schema.test.ts`
**Depends on**: T1
**Reuses**: Validation style from `src/features/invitations/invitation.schema.ts`.
**Requirement**: GA-01, GA-02, GA-05, GA-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Schema trims title and description.
- [x] Schema derives or exposes normalized title behavior for catalog-wide duplicate checks.
- [x] Schema validates title min/max, description min/max, and required fields.
- [x] Schema validates and normalizes color to uppercase `#RRGGBB`.
- [x] Unit tests cover valid input, empty title, empty/short description, invalid color, lowercase color normalization, shorthand rejection, whitespace normalization, and title-equivalence examples such as `Calculo` vs `  calculo  `.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Implement Subject Field Service ✅

**What**: Implement list, create, update, duplicate handling, and teacher-only mutation rules.
**Where**: `src/features/subject-fields/subject-field.service.ts`, `src/features/subject-fields/subject-field.service.test.ts`
**Depends on**: T2
**Reuses**: Prisma singleton and domain error pattern from `src/features/invitations/invitation.service.ts`.
**Requirement**: GA-01, GA-03, GA-05, GA-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `listSubjectFields` returns existing records ordered by `updatedAt desc`.
- [x] `createSubjectField` validates input, derives `titleNormalized`, stores `createdById`, and rejects duplicate titles across the catalog.
- [x] `updateSubjectField` validates input, rejects duplicate titles across the catalog except for the same record being edited, and updates allowed fields for any authenticated teacher passed by the API boundary.
- [x] Known domain failures map to explicit error codes: duplicate and not found.
- [x] Unit/integration-light tests cover create success, duplicate create with casing/spacing variation, list ordering, update by a teacher, same-title self update, duplicate update rejection, and not-found update.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T4: Add Subject Fields API Routes

**What**: Implement create and update Route Handlers with server-side teacher authorization.
**Where**: `src/app/api/subject-fields/route.ts`, `src/app/api/subject-fields/[subjectFieldId]/route.ts`
**Depends on**: T3
**Reuses**: `src/app/api/invitations/route.ts`, `src/infra/auth/server.ts`, `src/infra/auth/authorization.ts`.
**Requirement**: GA-01, GA-02, GA-05, GA-06

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Relevant Next.js 16 route handler docs under `node_modules/next/dist/docs/` are checked before editing.
- [ ] `POST /api/subject-fields` validates JSON, requires `TEACHER`, calls the service, and returns form-friendly JSON.
- [ ] `PATCH /api/subject-fields/[subjectFieldId]` validates id/body, requires `TEACHER`, calls the service, and returns form-friendly JSON.
- [ ] Unauthorized requests return `401` and create/update no data.
- [ ] Domain errors return stable error codes for duplicate and not-found cases.
- [ ] Unit tests or service-backed route tests cover unauthorized create/update and duplicate handling where practical.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T5: Build Subject Field Form Component

**What**: Build a client component for creating and editing grande areas with `react-hook-form`.
**Where**: `src/app/app/professor/grandes-areas/_components/subject-field-form.tsx`
**Depends on**: T4
**Reuses**: `src/app/app/admin/_components/invite-form.tsx`, shadcn-style `Alert`, `Button`, `Input`, `Label`.
**Requirement**: GA-01, GA-02, GA-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Component uses `react-hook-form` with `zodResolver`.
- [ ] Create mode posts to `/api/subject-fields`.
- [ ] Edit mode patches `/api/subject-fields/[subjectFieldId]`.
- [ ] Form includes title, description, and color fields.
- [ ] Color field includes a native color input plus hex text input or an equivalent accessible control.
- [ ] Submission states, success state, and error state are visible and accessible.
- [ ] Successful create resets the form; successful edit exits or reports edit completion cleanly.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T6: Build Subject Fields List Component

**What**: Build the list UI with empty state, color swatches, metadata, and edit controls for all records.
**Where**: `src/app/app/professor/grandes-areas/_components/subject-fields-list.tsx`
**Depends on**: T5
**Reuses**: shadcn-style `Card`, `Badge`, `Button`, and local form component.
**Requirement**: GA-03, GA-04, GA-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Empty state renders when the list is empty.
- [ ] Each row/card shows title, description, color swatch, hex value, creator email/name when available, and update date.
- [ ] Edit control is available for every listed grande area to authenticated teachers.
- [ ] Edit interaction reuses the form component and updates without layout overlap.
- [ ] UI text fits at mobile and desktop widths.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T7: Add Teacher Management Page and Navigation

**What**: Add the page titled "Gerenciar grandes areas" with create form above the list and a navigation entry for teachers.
**Where**: `src/app/app/professor/grandes-areas/page.tsx`, `src/app/app/layout.tsx` or teacher area navigation location
**Depends on**: T6
**Reuses**: `src/app/app/teacher/page.tsx`, `src/app/app/admin/page.tsx`, `requireRole("TEACHER")`.
**Requirement**: GA-01, GA-03, GA-04

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Relevant Next.js 16 page/App Router docs under `node_modules/next/dist/docs/` are checked before editing.
- [ ] Page calls `requireRole("TEACHER")`.
- [ ] Page title is exactly "Gerenciar grandes areas".
- [ ] Creation form appears above the list.
- [ ] Page fetches grandes areas server-side and passes them to the list.
- [ ] Navigation exposes the page at the Portuguese front route `/app/professor/grandes-areas` without breaking existing links.
- [ ] Gate check passes: `pnpm build`.

**Tests**: e2e required for visible flow, implemented in T8
**Gate**: build

---

### T8: Add E2E Coverage for Teacher Flow

**What**: Cover the main browser flow for teacher create, list, edit, and student denial.
**Where**: `src/tests/e2e/subject-fields.spec.ts`, optional helper under `src/tests/e2e/helpers/subject-fields.ts`
**Depends on**: T7
**Reuses**: `src/tests/e2e/helpers/auth.ts`, `src/tests/e2e/fixtures/users.ts`.
**Requirement**: GA-01, GA-03, GA-04, GA-05

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Test cleans deterministic `SubjectField` records before use to avoid state leakage.
- [ ] Teacher can open the page and see heading "Gerenciar grandes areas".
- [ ] Teacher can create a grande area and see it listed with color.
- [ ] Teacher can edit a listed grande area and see updated values after refresh.
- [ ] Student cannot access the page.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T9: Run Full Verification and Update Specs

**What**: Run final gates and mark spec/task traceability according to actual results.
**Where**: `.specs/features/grandes-areas/spec.md`, `.specs/features/grandes-areas/tasks.md`, `.specs/project/STATE.md`
**Depends on**: T8
**Reuses**: Existing `.specs` status format.
**Requirement**: GA-01, GA-02, GA-03, GA-04, GA-05, GA-06

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
  T1 -> T2 -> T3

Phase 2:
  T3 -> T4 -> T5 -> T6 -> T7

Phase 3:
  T7 -> T8 -> T9
```

No tasks are marked `[P]` in this draft because the implementation is narrow, files depend sequentially on generated types/contracts, and E2E work is not parallel-safe in this project.

---

## Pre-Approval Checks

### Check 1: Task Granularity

| Task | Atomic Deliverable | Status |
| --- | --- | --- |
| T1 | One data model/migration foundation | Pass |
| T2 | One validation schema module with colocated tests | Pass |
| T3 | One service module with colocated tests | Pass |
| T4 | One API boundary group for create/update | Pass |
| T5 | One form component | Pass |
| T6 | One list component | Pass |
| T7 | One page/navigation integration | Pass |
| T8 | One E2E flow spec/helper set | Pass |
| T9 | One verification/status update | Pass |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends on Field | Diagram Predecessor | Status |
| --- | --- | --- | --- |
| T1 | None | None | Pass |
| T2 | T1 | T1 | Pass |
| T3 | T2 | T2 | Pass |
| T4 | T3 | T3 | Pass |
| T5 | T4 | T4 | Pass |
| T6 | T5 | T5 | Pass |
| T7 | T6 | T6 | Pass |
| T8 | T7 | T7 | Pass |
| T9 | T8 | T8 | Pass |

### Check 3: Test Co-Location Validation

| Task | Layer | Required by TESTING.md | Planned Tests/Gate | Status |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/migration | build plus E2E DB setup | `pnpm build`; E2E in T8 | Pass |
| T2 | Pure validation | unit | colocated `*.test.ts`, `pnpm test:unit` | Pass |
| T3 | Service/data mutation rules | unit/integration-light | colocated `*.test.ts`, `pnpm test:unit` | Pass |
| T4 | API mutation boundary | unit/integration-light plus E2E if visible | route/service tests where practical, E2E in T8 | Pass |
| T5 | UI form component | build unless behaviorful component test added | `pnpm build`, E2E in T8 | Pass |
| T6 | UI list component | build unless behaviorful component test added | `pnpm build`, E2E in T8 | Pass |
| T7 | App Router visible page | e2e for critical flow | `pnpm build`, E2E in T8 | Pass |
| T8 | Browser-visible flow | e2e | `pnpm test:e2e` | Pass |
| T9 | Verification/docs | full/build | `pnpm test:unit`, `pnpm test:e2e`, `pnpm build` | Pass |

---

## Tool Question Before Execution

Before implementing these tasks, confirm whether to use only the built-in filesystem/shell tools plus `tlc-spec-driven`, or whether any additional MCPs/skills should be used for execution.
