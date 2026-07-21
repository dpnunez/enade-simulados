# Student Markdown Rendering Tasks

**Design**: `.specs/features/student-markdown-rendering/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation

```
T1 -> T2
```

### Phase 2: Integration

```
T2 -> T3 -> T4
```

### Phase 3: Final Gates

```
T4 -> T5
```

E2E tests are not parallel-safe in this project, so all tasks run sequentially.

---

## Task Breakdown

### T1: Add Markdown Rendering Dependencies

**What**: Add the Markdown rendering and sanitization packages required by the design.
**Where**: `package.json`, lockfile
**Depends on**: None
**Reuses**: Existing pnpm dependency workflow.
**Requirement**: SMR-01, SMR-03

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `react-markdown`, `remark-gfm`, `rehype-raw`, and `rehype-sanitize` are installed.
- [ ] Lockfile is updated.
- [ ] No unrelated dependency churn is introduced.

**Tests**: build/type gate after implementation
**Gate**: `pnpm build`

---

### T2: Create Safe MarkdownContent Component

**What**: Create a reusable read-only Markdown renderer with raw HTML parsing followed by sanitization.
**Where**: `src/components/markdown/markdown-content.tsx`, optional colocated test `src/components/markdown/markdown-content.test.tsx`
**Depends on**: T1
**Reuses**: `src/lib/utils.ts`, `src/components/markdown/markdown-editor.tsx` folder convention.
**Requirement**: SMR-01, SMR-02, SMR-03, SMR-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Empty/null values render without error.
- [ ] Markdown emphasis, lists and links render as React elements.
- [ ] Stored `<img src="https://...">` renders as responsive image.
- [ ] `<script>`, event attributes such as `onerror`, and `javascript:` URLs are stripped or neutralized.
- [ ] Component tests assert allowed and blocked cases.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit/component
**Gate**: quick

---

### T3: Use MarkdownContent In Student Attempt View

**What**: Replace plain text rendering of question statements and alternatives with `MarkdownContent`.
**Where**: `src/app/app/aluno/simulados/_components/simulation-attempt-view.tsx`
**Depends on**: T2
**Reuses**: Existing answer selection, save and finalize logic.
**Requirement**: SMR-01, SMR-02

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `descriptionMarkdown` no longer renders as literal Markdown syntax.
- [ ] `contentMarkdown` alternatives render formatted content inside existing labels.
- [ ] Radio selection remains clickable when Markdown contains nested text or image.
- [ ] Completed review visual states still work.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit gate plus E2E in T4
**Gate**: quick

---

### T4: Add Student Markdown Rendering E2E Coverage

**What**: Add or extend Playwright coverage for a simulado whose question contains Markdown and an HTML `<img>` tag.
**Where**: `src/tests/e2e/student-simulated-exams.spec.ts`, helpers under `src/tests/e2e/helpers` if needed.
**Depends on**: T3
**Reuses**: Existing auth, question, subject-field and simulated-exam helpers.
**Requirement**: SMR-01, SMR-02, SMR-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] E2E creates or seeds a question with Markdown and `<img src="...">`.
- [ ] Student opens generated simulado and sees image element, not literal `<img ...>`.
- [ ] Student can select an alternative and continue/finalize as before.
- [ ] E2E does not depend on external network image loading; assertion can inspect element attributes.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T5: Run Final Gates And Update Traceability

**What**: Run final validation and update spec/task statuses after implementation.
**Where**: `.specs/features/student-markdown-rendering/spec.md`, `.specs/features/student-markdown-rendering/tasks.md`, `.specs/project/STATE.md` if a decision or blocker emerges.
**Depends on**: T4
**Reuses**: Existing `.specs` traceability convention.
**Requirement**: SMR-01, SMR-02, SMR-03, SMR-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm test:unit` passes.
- [ ] Targeted or full `pnpm test:e2e` passes.
- [ ] `pnpm build` passes or blocker is documented with exact reason.
- [ ] Requirement statuses are updated from Pending to Verified.

**Tests**: unit, e2e, build
**Gate**: full/build

---

## Parallel Execution Map

```
Sequential:
  T1 -> T2 -> T3 -> T4 -> T5
```

No `[P]` tasks: T2 depends on new deps, T3 depends on the renderer, T4 depends on UI integration, and E2E is not parallel-safe per `.specs/codebase/TESTING.md`.

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic? | Reason |
| --- | --- | --- |
| T1 | OK | One dependency update. |
| T2 | OK | One reusable component plus its colocated tests. |
| T3 | OK | One UI integration file. |
| T4 | OK | One E2E coverage change for visible behavior. |
| T5 | OK | One final validation/status update pass. |

### Diagram-Definition Cross-Check

| Task | Depends on in definition | Matches execution plan? |
| --- | --- | --- |
| T1 | None | OK |
| T2 | T1 | OK |
| T3 | T2 | OK |
| T4 | T3 | OK |
| T5 | T4 | OK |

### Test Co-Location Validation

| Task | Code Layer | Required Test Type | Planned Tests | OK? |
| --- | --- | --- | --- | --- |
| T1 | Dependencies/config | Build | `pnpm build` | OK |
| T2 | UI component/helper | Unit/component if behaviorful | colocated component test + `pnpm test:unit` | OK |
| T3 | App visible UI | E2E for critical flow | covered by T4 | OK |
| T4 | Browser-visible behavior | E2E | `pnpm test:e2e` | OK |
| T5 | Validation/docs | Full/build | unit/e2e/build gates | OK |

---

## Execution Question

Before execution, confirm whether to use only the built-in filesystem/shell tools plus `tlc-spec-driven`, or whether you want any additional tooling for implementation. No extra MCP is required by the current plan.
