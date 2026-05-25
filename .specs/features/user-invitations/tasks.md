# User Invitations Tasks

**Design**: `.specs/features/user-invitations/design.md`
**Status**: Draft

---

## Testing Baseline

This plan now uses `.specs/codebase/TESTING.md`, created by the codebase mapping:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Pure/domain helpers | unit | `pnpm test:unit` |
| Server Actions/services touching auth/db contracts | unit or integration with mocked Prisma/auth boundaries | `pnpm test:unit` |
| Visible browser flows | e2e | `pnpm test:e2e` |
| Full confidence gate | unit + e2e | `pnpm test` |
| Build/type integration | build | `pnpm build` |

Playwright is configured with `fullyParallel: false` and `workers: 1`, so E2E tasks are not parallel-safe.

Relevant mapped concerns:

- `.specs/codebase/CONCERNS.md` P1: Server Actions must authorize internally with `requireRole`.
- `.specs/codebase/CONCERNS.md` P1: E2E data is not reset between runs yet, so invitation tests need deterministic cleanup.

---

## Execution Plan

### Phase 1: Data Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Mutations and UI

```text
T3 -> T4 -> T5 -> T6 -> T7
```

### Phase 3: Browser Coverage and Hardening

```text
T7 -> T8 -> T9 -> T10
```

---

## Task Breakdown

### T1: Add Invitation Schema

**What**: Add standalone Prisma `InvitationStatus` and `Invitation`.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`
**Depends on**: None
**Reuses**: Existing `Role` enum and migration pattern.
**Requirement**: INV-01, INV-03, INV-06, INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Prisma schema has invitation lifecycle fields and token hash uniqueness.
- [ ] `User` model remains unchanged; invitation acceptance only creates the normal Better Auth-compatible user/account records.
- [ ] Migration is generated and checked in.
- [ ] Prisma client generation succeeds.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

**Verify**:
Run `pnpm prisma:generate` and `pnpm build`; both should complete without schema/type errors.

---

### T2: Create Invitation Token Utilities

**What**: Implement raw token generation and deterministic token hashing.
**Where**: `src/invitations/invitation-tokens.ts`, `src/invitations/invitation-tokens.test.ts`
**Depends on**: T1
**Reuses**: Node crypto.
**Requirement**: INV-01, INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] `generateInvitationToken` returns URL-safe high-entropy tokens.
- [ ] `hashInvitationToken` is deterministic and never returns the raw token.
- [ ] Unit tests cover URL safety and hash determinism.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Verify**:
Run `pnpm test:unit`; token utility tests should pass along with existing tests.

---

### T3: Implement Invitation Service

**What**: Implement create, resolve, cancel, list, and accept invitation domain logic.
**Where**: `src/invitations/invitation-service.ts`, `src/invitations/invitation-service.test.ts`
**Depends on**: T2
**Reuses**: `src/infra/db/prisma.ts`, `scripts/seed-users.ts` account creation pattern, Better Auth `hashPassword`.
**Requirement**: INV-01, INV-03, INV-04, INV-05, INV-06, INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Service normalizes email and restricts invite roles to `STUDENT`/`TEACHER`.
- [ ] Service rejects existing user emails and duplicate pending invitations.
- [ ] Service resolves only pending tokens.
- [ ] Service accepts invites in a transaction and creates Better Auth-compatible credential accounts.
- [ ] Service cancellation prevents future acceptance.
- [ ] Unit/integration-style tests cover success and main invalid states.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit/integration
**Gate**: quick

**Verify**:
Run `pnpm test:unit`; invitation service tests should pass and existing auth tests should remain green.

---

### T4: Add Invitation Email Adapter

**What**: Add provider-isolated email sending for invite links.
**Where**: `src/invitations/invitation-email.ts`, `src/invitations/invitation-email.test.ts`
**Depends on**: T3
**Reuses**: Invitation service result shape.
**Requirement**: INV-01

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Adapter exposes `sendInvitationEmail`.
- [ ] Invite URL is built from a configured app base URL and raw token.
- [ ] Development/test behavior is deterministic without real external delivery.
- [ ] Failures are returned or thrown in a way admin actions can surface.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Verify**:
Run `pnpm test:unit`; email adapter tests should verify URL composition and failure behavior.

---

### T5: Add Admin Invitation Server Actions

**What**: Implement admin-only Server Actions for creating and cancelling invitations.
**Where**: `src/app/app/admin/actions.ts`, `src/app/app/admin/actions.test.ts`
**Depends on**: T4
**Reuses**: `requireRole("ADMIN")`, invitation service, `revalidatePath`.
**Requirement**: INV-01, INV-02, INV-06, INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Actions re-authorize with `requireRole("ADMIN")` internally.
- [ ] Tests prove actions do not rely on `src/proxy.ts`, page visibility, or client state for authorization.
- [ ] Create action validates email and role server-side.
- [ ] Cancel action validates invitation id server-side.
- [ ] Actions return form-friendly success/error states.
- [ ] Actions revalidate the admin page after mutation.
- [ ] Tests cover unauthorized rejection and validation errors.
- [ ] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Verify**:
Run `pnpm test:unit`; admin action tests should pass without requiring browser automation.

---

### T6: Build Admin User Management UI

**What**: Replace the placeholder admin page with user listing, invite form, pending invites table, and cancel controls.
**Where**: `src/app/app/admin/page.tsx`, optional `src/app/app/admin/*`
**Depends on**: T5
**Reuses**: Existing private layout, shadcn UI components, `requireRole("ADMIN")`.
**Requirement**: INV-01, INV-05, INV-06

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Admin page shows registered users with email, role, created date.
- [ ] Admin page shows pending invitations with email, role, status, and creation date.
- [ ] Admin page includes invite form for email and `STUDENT`/`TEACHER`.
- [ ] Pending invite rows include cancel action.
- [ ] Empty states render for no pending invites.
- [ ] UI uses existing shadcn visual vocabulary.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

**Verify**:
Run `pnpm build`; admin page should compile as a Server Component with action-backed forms.

---

### T7: Build Public Invite Registration Flow

**What**: Add token route and password-only registration form for invited users.
**Where**: `src/app/convites/[token]/page.tsx`, `src/app/convites/[token]/actions.ts`, optional local form component.
**Depends on**: T6
**Reuses**: Login page form styling, invitation service.
**Requirement**: INV-03, INV-04, INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] Valid token page renders locked email and role fields.
- [ ] Invalid, cancelled, and accepted tokens render a no-form error state.
- [ ] Only password is editable.
- [ ] Submit creates the user, marks invite accepted, and navigates toward login or private app flow.
- [ ] Password validation errors keep user on the form.
- [ ] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

**Verify**:
Run `pnpm build`; dynamic invite page should compile and not expose token hashes.

---

### T8: Add E2E Data Cleanup for Invitation Flows

**What**: Make Playwright setup deterministic for invitation-created data.
**Where**: `scripts/e2e/prepare-test-db.ts`, optional helper under `src/tests/e2e/helpers/`
**Depends on**: T7
**Reuses**: `.specs/codebase/CONCERNS.md` P1 finding, existing seed users.
**Requirement**: INV-07

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [ ] E2E setup removes invitation test data without deleting seed users.
- [ ] Cleanup covers standalone `Invitation` rows and invite-created users by deterministic email namespace.
- [ ] Cleanup is safe to run repeatedly.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: e2e

**Verify**:
Run `pnpm test:e2e` twice; both runs should start from deterministic invitation state and pass existing specs.

---

### T9: Add E2E Coverage for Invitation Lifecycle

**What**: Add browser tests for admin invite creation, invite acceptance, login, and cancellation.
**Where**: `src/tests/e2e/invitations.spec.ts`, optional fixtures/helpers under `src/tests/e2e/`
**Depends on**: T8
**Reuses**: `src/tests/e2e/helpers/login.ts`, deterministic seed users.
**Requirement**: INV-01, INV-03, INV-04, INV-05, INV-06

**Tools**:

- MCP: filesystem
- Skill: browser if interactive debugging is needed

**Done when**:

- [ ] E2E creates an invite as admin and sees it pending.
- [ ] E2E opens the invite link, confirms email/role are locked, sets password, and logs in.
- [ ] E2E cancels a second invite and verifies the link cannot register.
- [ ] Test data is deterministic and isolated from development DB.
- [ ] Gate check passes: `pnpm test:e2e`.

**Tests**: e2e
**Gate**: full

**Verify**:
Run `pnpm test:e2e`; invitation lifecycle specs should pass with existing login/admin specs.

---

### T10: Final Feature Gate and Traceability Update

**What**: Run full gates, update requirement statuses, and record final decisions.
**Where**: `.specs/features/user-invitations/spec.md`, `.specs/features/user-invitations/tasks.md`, `.specs/project/STATE.md`
**Depends on**: T9
**Reuses**: TLC spec docs.
**Requirement**: INV-01 through INV-07

**Tools**:

- MCP: filesystem
- Skill: tlc-spec-driven

**Done when**:

- [ ] Full test gate passes: `pnpm test`.
- [ ] Build gate passes: `pnpm build`.
- [ ] Requirement traceability marks implemented requirements as verified.
- [ ] STATE records email-provider decision and any deferred improvements.

**Tests**: full
**Gate**: full

**Verify**:
Run `pnpm test` and `pnpm build`; both should pass before marking feature done.

---

## Parallel Execution Map

This feature is intentionally mostly sequential because auth, schema, and E2E state build on each other.

```text
Phase 1:
  T1 -> T2 -> T3

Phase 2:
  T3 -> T4 -> T5 -> T6 -> T7

Phase 3:
  T7 -> T8 -> T9 -> T10
```

No task is marked `[P]` because the service, admin UI, public route, and E2E test data all share the same auth/invitation contract. Playwright is also configured as single-worker/non-parallel.

---

## Pre-Approval Checks

### Task Granularity

| Task | Scope | Status |
| --- | --- | --- |
| T1: Add Invitation Schema | Prisma model/migration | OK |
| T2: Create Invitation Token Utilities | One helper module | OK |
| T3: Implement Invitation Service | One cohesive domain service | OK |
| T4: Add Invitation Email Adapter | One adapter module | OK |
| T5: Add Admin Invitation Server Actions | One action file + tests | OK |
| T6: Build Admin User Management UI | One route UI surface | OK |
| T7: Build Public Invite Registration Flow | One public route flow | OK |
| T8: Add E2E Data Cleanup | One setup/helper concern | OK |
| T9: Add E2E Coverage | One browser lifecycle spec | OK |
| T10: Final Feature Gate and Traceability Update | Verification/documentation | OK |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | T4 -> T5 | Match |
| T6 | T5 | T5 -> T6 | Match |
| T7 | T6 | T6 -> T7 | Match |
| T8 | T7 | T7 -> T8 | Match |
| T9 | T8 | T8 -> T9 | Match |
| T10 | T9 | T9 -> T10 | Match |

### Test Co-Location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Prisma schema/generated types | build | build | OK |
| T2 | Pure helper | unit | unit | OK |
| T3 | Domain service/auth DB contract | unit/integration | unit/integration | OK |
| T4 | Email adapter | unit | unit | OK |
| T5 | Server Actions | unit | unit | OK |
| T6 | Admin route UI | build, later e2e | build | OK, E2E begins once cleanup and full flow exist in T9 |
| T7 | Public registration route UI/action | build, later e2e | build | OK, E2E begins once cleanup and full flow exist in T9 |
| T8 | E2E setup/data cleanup | e2e | e2e | OK |
| T9 | Browser flow | e2e | e2e | OK |
| T10 | Docs/gates | full | full | OK |

---

## Open Decisions Before Execute

- Email provider for production is not present in the repo. The implementation should start with an adapter and deterministic dev/test delivery, then wire SMTP/provider when credentials are available.
- Decide whether successful invite acceptance should auto-login the new user or redirect to `/login`. The safer MVP default is redirect to `/login` with a success message.

Before execution, choose tools per task. Available here: filesystem shell/apply_patch, Browser plugin for local browser checks, and `tlc-spec-driven`.
