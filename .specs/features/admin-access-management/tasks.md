# Admin Access Management Tasks

**Design**: `.specs/features/admin-access-management/design.md`
**Status**: Implemented

---

## Testing Baseline

Uses `.specs/codebase/TESTING.md`:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Zod schemas and services | unit | `pnpm test:unit` |
| API Route Handlers | unit/integration-light plus E2E for visible flows | `pnpm test:unit`, `pnpm test:e2e` |
| Browser-visible admin pages/sidebar | e2e | `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |
| Dependency/type integration | build | `pnpm build` |

E2E is not parallel-safe in this project because Playwright uses one worker and a shared test database.

---

## Execution Plan

### Phase 1: Foundation

```text
T1 -> T2
```

### Phase 2: Paginated Read APIs

```text
T2 -> T3
T2 -> T4
```

### Phase 3: Admin UI Split

```text
T3 -> T5
T4 + T5 -> T6
T5 + T6 -> T7 -> T8
```

### Phase 4: Browser Verification

```text
T8 -> T9 -> T10
```

---

## Task Breakdown

### T1: Add React Query Dependency and Provider

**What**: Install/configure TanStack Query and expose a QueryProvider to the logged-in app.
**Where**: `package.json`, lockfile, `src/app/app/layout.tsx`, provider component under `src/app/app/_components/` or `src/components/`
**Depends on**: None
**Reuses**: Existing private app layout.
**Requirement**: ADM-01, ADM-03

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] `@tanstack/react-query` is present in dependencies and lockfile.
- [x] Private app routes are wrapped by `QueryClientProvider` through a client provider component.
- [x] Provider does not force public auth/login routes into client rendering.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

---

### T2: Add Shared Admin Table Query Contracts

**What**: Define reusable pagination/sorting schemas and row/page types for admin users and invitations.
**Where**: `src/features/admin-users/admin-user.schema.ts`, `src/features/admin-users/admin-user.schema.test.ts`, `src/features/invitations/invitation.schema.ts`, `src/features/invitations/invitation.schema.test.ts`
**Depends on**: T1
**Reuses**: `src/features/simulation-ranking/simulation-ranking.schema.ts` pattern.
**Requirement**: ADM-01, ADM-03

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Users query schema validates `page`, `pageSize`, `sort`, and `direction`.
- [x] Invitations query schema validates `page`, `pageSize`, `sort`, and `direction`.
- [x] Supported sort fields are intentionally limited to indexed/simple columns such as `createdAt`, `email`, `role`, and user `name`.
- [x] Unit tests cover defaults, coercion, valid sorting, invalid sorting, and page-size limits.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

---

### T3: Implement Paginated Admin Users API

**What**: Add service and Route Handler for paginated admin user reads.
**Where**: `src/features/admin-users/admin-user.service.ts`, `src/features/admin-users/admin-user.service.test.ts`, `src/app/api/admin/users/route.ts`
**Depends on**: T2
**Reuses**: Prisma client, ranking service pagination pattern, invitation API authorization pattern.
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Service returns `{ rows, rowCount, page, pageSize, pageCount }`.
- [x] API authorizes ADMIN server-side before reading users.
- [x] API validates query params with the schema from T2.
- [x] Rows expose only table-safe fields: id, name, email, role, createdAt.
- [x] Unit tests cover service pagination/sorting and unauthorized/validation API behavior where practical with existing test patterns.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T4: Paginate Invitations GET API

**What**: Replace the unpaginated invitation list read with paginated pending-invitation results.
**Where**: `src/features/invitations/invitation.service.ts`, `src/features/invitations/invitation.service.test.ts`, `src/app/api/invitations/route.ts`
**Depends on**: T2
**Reuses**: Existing `listPendingInvitations`, invitation route authorization, ranking pagination response shape.
**Requirement**: ADM-03, ADM-04

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] `GET /api/invitations` accepts paginated table query params.
- [x] Response returns `rows`, `rowCount`, `page`, `pageSize`, and `pageCount`.
- [x] `POST /api/invitations` behavior and error mapping remain compatible with the existing form.
- [x] Existing server-side/admin authorization remains inside the Route Handler.
- [x] Tests are updated for the new GET shape and existing create/cancel flows remain covered.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration-light
**Gate**: quick

---

### T5: Build Dedicated Users Page and Table

**What**: Create `/app/admin/usuarios` with a user-friendly paginated users table powered by Query + Table.
**Where**: `src/app/app/admin/usuarios/page.tsx`, `src/app/app/admin/usuarios/_components/users-table.tsx`
**Depends on**: T3
**Reuses**: Ranking table manual pagination/sorting pattern, shadcn `Table`, `Button`, `Badge`, `Alert`, `Skeleton` if useful.
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: filesystem
- Skill: codenavi, shadcn

**Done when**:

- [x] Page calls `requireRole("ADMIN")`.
- [x] Table uses `useQuery` for `/api/admin/users`.
- [x] Table uses `useReactTable` with manual pagination and sorting.
- [x] Loading, empty, error, and normal states are polished and accessible.
- [x] Pagination controls include page-size selection and previous/next buttons.
- [x] Gate check passes: `pnpm build`.

**Tests**: e2e later in T9
**Gate**: build

---

### T6: Build Dedicated Invitations Page, Form Refresh, and Table

**What**: Create `/app/admin/convites` with improved invite form and paginated invitations table below it.
**Where**: `src/app/app/admin/convites/page.tsx`, route-local components or reused `src/app/app/admin/_components/invite-form.tsx`, invitations table component
**Depends on**: T4, T5
**Reuses**: Existing invite form, existing cancel behavior, shadcn field/alert/table patterns.
**Requirement**: ADM-03, ADM-04

**Tools**:

- MCP: filesystem
- Skill: codenavi, shadcn

**Done when**:

- [x] Page calls `requireRole("ADMIN")`.
- [x] Form remains based on `react-hook-form`, `zodResolver`, and existing create schema.
- [x] Form feedback is friendly for duplicate account, duplicate pending invite, validation, unauthorized, and generic failures.
- [x] Successful creation invalidates/refetches the invitations query and makes the new invite appear immediately.
- [x] Invitations table uses `useQuery` and `useReactTable` with manual pagination/sorting.
- [x] Cancelling an invite invalidates/refetches the invitations query.
- [x] Loading, empty, error, and normal table states are polished and accessible.
- [x] Gate check passes: `pnpm build`.

**Tests**: e2e later in T9
**Gate**: build

---

### T7: Split Admin Sidebar Navigation

**What**: Update ADMIN sidebar entries to point to Usuarios and Convites separately.
**Where**: `src/app/app/app-sidebar.tsx`
**Depends on**: T5, T6
**Reuses**: Existing `ROLE_NAV_ITEMS`, `isActivePath`, lucide icons.
**Requirement**: ADM-05

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] ADMIN nav includes `/app/admin/usuarios` and `/app/admin/convites`.
- [x] Active state works for each page.
- [x] STUDENT and TEACHER nav configs remain unchanged.
- [x] Gate check passes: `pnpm build`.

**Tests**: e2e later in T9
**Gate**: build

---

### T8: Preserve `/app/admin`

**What**: Convert the existing combined admin page into a redirect or small hub.
**Where**: `src/app/app/admin/page.tsx`
**Depends on**: T5, T6, T7
**Reuses**: Existing `requireRole("ADMIN")` page protection.
**Requirement**: ADM-06

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] `/app/admin` no longer renders the old combined user/invite content.
- [x] Route either redirects to `/app/admin/usuarios` or renders clear links to Usuarios and Convites.
- [x] Role protection remains intact.
- [x] Gate check passes: `pnpm build`.

**Tests**: e2e later in T9
**Gate**: build

---

### T9: Update Admin E2E Coverage

**What**: Update/add Playwright coverage for split admin pages, sidebar navigation, users table, and invitation create/refetch behavior.
**Where**: `src/tests/e2e/admin-authorization.spec.ts`, `src/tests/e2e/invitations.spec.ts`, helpers under `src/tests/e2e/helpers/`
**Depends on**: T8
**Reuses**: Existing `loginAs`, invitation helpers, deterministic seed users.
**Requirement**: ADM-01, ADM-03, ADM-04, ADM-05, ADM-06

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Admin sidebar test verifies Usuarios and Convites links.
- [x] Users page test verifies seeded users appear in the table.
- [x] Invitations page test creates an invite and verifies it appears immediately below without manual page reload.
- [x] Cancel behavior test still passes after Query invalidation changes.
- [x] Non-admin authorization coverage is updated for the new routes and APIs.
- [x] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

---

### T10: Final Verification and Traceability Update

**What**: Run final checks and update spec/task traceability statuses.
**Where**: `.specs/features/admin-access-management/spec.md`, `.specs/features/admin-access-management/tasks.md`
**Depends on**: T9
**Reuses**: tlc-spec-driven traceability format.
**Requirement**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06

**Tools**:

- MCP: filesystem
- Skill: tlc-spec-driven

**Done when**:

- [x] `pnpm test:unit` passes.
- [x] `pnpm test:e2e` passes.
- [x] `pnpm build` passes.
- [x] Requirement traceability marks implemented requirements as verified.
- [x] Any deviations are documented explicitly.

**Tests**: full/build
**Gate**: full

---

## Parallel Execution Map

```text
Sequential by default:
  T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T8 -> T9 -> T10

Possible implementation overlap after T2:
  T3 and T4 touch different APIs/services and can be developed in parallel,
  but their tests should be run carefully because both affect admin data contracts.

E2E tasks stay sequential because the project uses one shared Playwright database.
```

---

## Pre-Approval Checks

### Diagram-Definition Cross-Check

| Task | Diagram dependency | `Depends on` field | Status |
| --- | --- | --- | --- |
| T1 | Starts foundation | None | OK |
| T2 | After T1 | T1 | OK |
| T3 | After T2 | T2 | OK |
| T4 | After T2 | T2 | OK |
| T5 | After T3 | T3 | OK |
| T6 | After T4 and table patterns from T5 | T4, T5 | OK |
| T7 | After pages exist | T5, T6 | OK |
| T8 | After sidebar/pages exist | T5, T6, T7 | OK |
| T9 | After full UI split | T8 | OK |
| T10 | After E2E | T9 | OK |

### Test Co-location Validation

| Task | Layer touched | Required tests | Included in task | Status |
| --- | --- | --- | --- | --- |
| T1 | Dependency/provider/layout | build | build gate | OK |
| T2 | Schemas | unit | schema tests included | OK |
| T3 | Service/API | unit/integration-light | service/API tests included | OK |
| T4 | Service/API | unit/integration-light | service/API tests included | OK |
| T5 | Browser UI | e2e | deferred to T9 because T9 covers full split | OK |
| T6 | Browser UI/mutation UX | e2e | deferred to T9 because T9 covers full flow | OK |
| T7 | Sidebar UI | e2e | deferred to T9 | OK |
| T8 | Route behavior | e2e | deferred to T9 | OK |
| T9 | Browser flows | e2e | Playwright tests included | OK |
| T10 | Verification/docs | full/build | final gates included | OK |

---

## Tooling Question Before Execution

Default implementation tools should be filesystem editing plus `codenavi` for codebase navigation, `shadcn` for UI component alignment, and `tlc-spec-driven` for traceability. No extra MCP is required unless a dependency/API question is uncertain during implementation.

---

## Final Verification

- `pnpm test:unit` passed: 32 files, 206 tests.
- `pnpm build` passed and listed `/app/admin/usuarios`, `/app/admin/convites`, and `/api/admin/users`.
- `pnpm test:e2e` passed: 21 browser tests.
- `pnpm lint` passed with existing React Compiler compatibility warnings for TanStack Table/React Hook Form patterns.
- No `SPEC_DEVIATION` markers were needed.
