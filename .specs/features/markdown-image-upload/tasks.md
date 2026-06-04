# Markdown Image Upload Tasks

**Design**: `.specs/features/markdown-image-upload/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Contracts And Validation (Parallel OK)

```
T1
├── T2 [P]
└── T3 [P]
```

### Phase 2: Provider And API Boundary

```
T2 ─┐
T3 ─┼── T4 ── T5
T1 ─┘
```

### Phase 3: Editor Integration And Browser Flow

```
T5 ── T6 ── T7
```

### Phase 4: Final Verification

```
T7 ── T8
```

---

## Task Breakdown

### T1: Add Supabase Storage Dependency And Configuration

**What**: Add Supabase JS dependency and document required storage env vars.
**Where**: `package.json`, lockfile, `.env.example` if present, `.specs/codebase/INTEGRATIONS.md`
**Depends on**: None
**Reuses**: Existing integration docs style.
**Requirement**: MIMG-04, MIMG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `@supabase/supabase-js` is installed.
- [ ] Required env vars are documented: project URL, service role or storage key, bucket, public base URL/prefix.
- [ ] No Supabase env var is exposed with `NEXT_PUBLIC_` unless intentionally public and safe.
- [ ] Integration docs mention Supabase Storage as file storage provider.

**Tests**: build
**Gate**: `pnpm build`

---

### T2: Create Upload Validation And Key Helpers [P]

**What**: Create feature helpers for allowed image types, max size, and safe unique object keys.
**Where**: `src/features/uploads/markdown-image.schema.ts`, `src/features/uploads/markdown-image.schema.test.ts`
**Depends on**: None
**Reuses**: Zod/test style from `src/features/questions/question.schema.ts`.
**Requirement**: MIMG-03, MIMG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Allowed types include `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
- [ ] SVG and arbitrary MIME types are rejected.
- [ ] File size max is enforced, defaulting to 6MB unless config overrides.
- [ ] Object keys are unique, path-safe, extension-aware, and do not trust raw filenames.
- [ ] Unit tests cover valid file, invalid MIME, oversized file, unsafe filename, and uniqueness shape.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Define Storage Adapter Port And Upload Service [P]

**What**: Create provider-agnostic storage contract and `uploadMarkdownImage` service with domain errors.
**Where**: `src/features/uploads/object-storage.ts`, `src/features/uploads/markdown-image.service.ts`, `src/features/uploads/markdown-image.service.test.ts`
**Depends on**: None
**Reuses**: Domain error style from `src/features/questions/question.service.ts` and adapter pattern from invitations.
**Requirement**: MIMG-03, MIMG-04, MIMG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Service accepts a generic storage adapter.
- [ ] Service validates file metadata before calling storage.
- [ ] Service returns `{ url, key, contentType, size }`.
- [ ] Storage failures are mapped to stable domain errors.
- [ ] Tests use a fake adapter and do not import Supabase.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T4: Implement Supabase Storage Adapter

**What**: Implement the storage adapter using Supabase Storage on the server.
**Where**: `src/infra/storage/supabase.ts`, `src/infra/storage/supabase-storage.adapter.ts`, optional colocated tests
**Depends on**: T1, T2, T3
**Reuses**: Existing `src/infra` organization.
**Requirement**: MIMG-04, MIMG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Adapter reads server-only env config and fails clearly when missing.
- [ ] Adapter uploads using configured bucket/key/content type/cache control.
- [ ] Adapter uses `upsert: false`.
- [ ] Adapter returns a persistent URL from Supabase/public URL configuration.
- [ ] Provider errors are mapped without leaking raw internals to clients.
- [ ] Gate check passes: `pnpm test:unit` and `pnpm build`.

**Tests**: unit with mocked Supabase client, build
**Gate**: quick + build

---

### T5: Add Protected Markdown Image Upload Route

**What**: Add a route handler that accepts multipart image upload and calls the upload service.
**Where**: `src/app/api/uploads/markdown-images/route.ts`, optional `route.test.ts`
**Depends on**: T3, T4
**Reuses**: Auth and error response pattern from `src/app/api/questions/route.ts`.
**Requirement**: MIMG-02, MIMG-03, MIMG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Route reads `await request.formData()` and extracts field `file`.
- [ ] Route requires authenticated `TEACHER`.
- [ ] Route returns stable `{ success, image }` or `{ success: false, error }`.
- [ ] Route never exposes Supabase credentials or raw provider errors.
- [ ] Unit/integration-light tests cover unauthorized, invalid file, service error, and success.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T6: Extend MarkdownEditor With Generic Image Upload

**What**: Wire MDXEditor image support through an optional provider-agnostic handler.
**Where**: `src/components/markdown/markdown-editor.tsx`, optional component test
**Depends on**: T5
**Reuses**: Current dynamic import and toolbar plugin pattern.
**Requirement**: MIMG-01, MIMG-02, MIMG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `MarkdownEditorProps` accepts `imageUploadHandler?: (file: File) => Promise<string>`.
- [ ] MDXEditor includes `imagePlugin({ imageUploadHandler })` when handler exists.
- [ ] Toolbar includes `InsertImage` only when upload is configured.
- [ ] The component does not import Supabase or upload route constants from infra.
- [ ] Existing editor behavior remains unchanged when no handler is passed.
- [ ] Gate check passes: `pnpm test:unit` and `pnpm build`.

**Tests**: unit/component if feasible; otherwise build
**Gate**: quick + build

---

### T7: Integrate Upload Handler Into Question Form And E2E

**What**: Provide a client upload handler to the question description editor and cover the main browser flow.
**Where**: `src/app/app/professor/questoes/_components/question-form.tsx`, `src/app/app/professor/questoes/_components/question-image-upload.ts`, `src/tests/e2e/questions.spec.ts`, fixtures as needed
**Depends on**: T6
**Reuses**: Existing question E2E flow and `loginAs` helper.
**Requirement**: MIMG-01, MIMG-02, MIMG-03

**Tools**:

- MCP: NONE
- Skill: browser optional for manual frontend verification

**Done when**:

- [ ] Question description editor receives `uploadQuestionMarkdownImage`.
- [ ] Upload helper posts `FormData` to `/api/uploads/markdown-images`.
- [ ] Helper throws user-facing errors for failed upload responses.
- [ ] E2E covers valid teacher image upload and persistence after save/reload.
- [ ] E2E covers at least one rejected upload path if reliable without real Supabase dependency.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T8: Final Gates And Documentation Sync

**What**: Run final gates and sync planning docs/state after implementation.
**Where**: `.specs/features/markdown-image-upload/*.md`, `.specs/project/STATE.md`
**Depends on**: T7
**Reuses**: Existing spec/task status conventions.
**Requirement**: MIMG-01, MIMG-02, MIMG-03, MIMG-04, MIMG-05

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Requirement traceability statuses are updated.
- [ ] Tasks are marked done with verification results.
- [ ] State records final decisions and any deferred cleanup work.

**Tests**: full + build
**Gate**: full

---

## Parallel Execution Map

```
Phase 1:
  T1
  T2 [P]
  T3 [P]

Phase 2:
  T1 + T2 + T3 -> T4 -> T5

Phase 3:
  T5 -> T6 -> T7

Phase 4:
  T7 -> T8
```

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic Deliverable | Status |
| --- | --- | --- |
| T1 | Dependency/config docs only | Pass |
| T2 | Validation/key helpers only | Pass |
| T3 | Storage port/service only | Pass |
| T4 | Supabase adapter only | Pass |
| T5 | Upload route only | Pass |
| T6 | Editor wrapper extension only | Pass |
| T7 | Question-form integration and visible E2E flow | Pass |
| T8 | Final gates/docs sync | Pass |

### Diagram-Definition Cross-Check

| Task | Diagram Dependencies | `Depends on` Field | Status |
| --- | --- | --- | --- |
| T1 | None | None | Pass |
| T2 | None | None | Pass |
| T3 | None | None | Pass |
| T4 | T1, T2, T3 | T1, T2, T3 | Pass |
| T5 | T3, T4 | T3, T4 | Pass |
| T6 | T5 | T5 | Pass |
| T7 | T6 | T6 | Pass |
| T8 | T7 | T7 | Pass |

### Test Co-location Validation

| Task | Code Layer | Required Test Type From Matrix | Assigned Tests | Status |
| --- | --- | --- | --- | --- |
| T1 | Dependency/config/docs | build | build | Pass |
| T2 | Pure helpers/validation | unit | unit | Pass |
| T3 | Feature service/adapter contract | unit with mocked adapter | unit | Pass |
| T4 | Infra adapter/config | unit with mocked provider + build | unit + build | Pass |
| T5 | API route handler/data mutation | unit/integration-light plus E2E if visible | unit/integration-light | Pass |
| T6 | UI primitive/wrapper behavior | unit/component if behaviorful; build otherwise | unit/component or build | Pass |
| T7 | Browser-visible App Router flow | e2e | e2e | Pass |
| T8 | Final feature | full + build | full + build | Pass |

---

## Tooling Question Before Execution

Before implementation, confirm whether to use only built-in filesystem/shell tools or to delegate any tasks to available sub-agent tooling. Suggested default: implement sequentially with built-in tools, use `browser` for manual UI verification after T7, and keep Supabase external calls mocked in automated tests unless real test storage credentials are provided.
