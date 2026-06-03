# User Name as Nick Tasks

**Design**: `.specs/features/user-nicknames/design.md`
**Status**: Completed

---

## Testing Baseline

Use the existing project gates:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Validation and domain helpers | unit | `pnpm test:unit` |
| Invitation service contracts | unit/integration with mocks | `pnpm test:unit` |
| Visible invitation flow | e2e | `pnpm test:e2e` |
| Type/build confidence | build | `pnpm build` |

Before implementing App Router or Route Handler changes, read the relevant Next.js 16 local docs in `node_modules/next/dist/docs/`.

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4 -> T5
```

---

## Task Breakdown

### T1: Add Unique Constraint for User Name

**Status**: Completed

**What**: Make `User.name` unique with deterministic cleanup/backfill for existing data.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`, seed scripts if needed.
**Depends on**: None
**Reuses**: Existing Prisma migration and seed conventions.
**Requirement**: NAME-02, NAME-04

**Done when**:

- [x] `User.name` is marked `@unique`.
- [x] Existing users have deterministic unique names before the constraint is added.
- [x] Seed users have deterministic unique valid names.
- [x] Prisma client generation succeeds.

**Tests**: build/schema
**Gate**: `pnpm prisma:generate`, `pnpm build`

---

### T2: Extend Invitation Acceptance Schema

**Status**: Completed

**What**: Add name/nick validation to `acceptInvitationSchema`.
**Where**: `src/features/invitations/invitation.schema.ts`, `src/features/invitations/invitation.schema.test.ts`
**Depends on**: T1
**Reuses**: Existing `zod` schema pattern.
**Requirement**: NAME-01, NAME-02, NAME-04

**Done when**:

- [x] Schema requires `name`.
- [x] Schema trims `name`.
- [x] Schema trims `name` while preserving casing and spaces.
- [x] Schema rejects blank and invalid name/nick values.
- [x] Tests cover valid, trimmed, blank, and invalid names.

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T3: Update Invitation Service Acceptance

**Status**: Completed

**What**: Persist submitted unique name/nick during invite acceptance and remove email-derived fallback.
**Where**: `src/features/invitations/invitation.service.ts`, `src/features/invitations/invitation.service.test.ts`
**Depends on**: T2
**Reuses**: Existing transaction and Better Auth credential user creation.
**Requirement**: NAME-01, NAME-02, NAME-04

**Done when**:

- [x] `acceptInvitation` creates user with submitted `name`.
- [x] `acceptInvitation` no longer derives `name` from invitation email.
- [x] Duplicate `name` returns `NAME_ALREADY_REGISTERED`.
- [x] Tests cover successful creation payload and custom name preservation.
- [x] Tests prove invite for `student@example.com` can create a custom nick that is not derived from email.
- [x] Tests cover duplicate name rejection and pending invitation preservation.

**Tests**: unit/integration
**Gate**: `pnpm test:unit`

---

### T4: Update API, Form, and Identity UI

**Status**: Completed

**What**: Collect name/nick in the public invitation form and display it as primary identity.
**Where**: `src/app/api/invitations/accept/route.ts`, `src/app/convites/[token]/_components/accept-invite-form.tsx`, `src/app/app/layout.tsx`, `src/app/app/admin/page.tsx`
**Depends on**: T3
**Reuses**: Existing `react-hook-form`, `zodResolver`, shadcn `Input`/`Label`/`Alert`.
**Requirement**: NAME-01, NAME-02, NAME-03

**Done when**:

- [x] Form includes name/nick input.
- [x] Client validation uses the shared schema.
- [x] API validates name server-side.
- [x] Duplicate name error is user-facing and specific.
- [x] Existing email/role locked fields continue working.
- [x] Private layout shows `name` as primary identity with email as secondary metadata.
- [x] Admin user list shows name/nick alongside email and role.

**Tests**: unit plus E2E in T5
**Gate**: `pnpm test:unit`, `pnpm build`

---

### T5: Update E2E Invitation Coverage

**Status**: Completed

**What**: Cover the invitation lifecycle with submitted name/nick.
**Where**: `src/tests/e2e/invitations.spec.ts`, relevant E2E helpers/fixtures.
**Depends on**: T4
**Reuses**: Existing invitation E2E helper and seeded admin login.
**Requirement**: NAME-01, NAME-02, NAME-03, NAME-04

**Done when**:

- [x] Invite acceptance test fills custom name/nick.
- [x] Test verifies the new user can log in.
- [x] Test verifies submitted name/nick appears in the private area.
- [x] Optional duplicate name case assessed; duplicate rejection is covered in unit tests to keep E2E deterministic and low maintenance.

**Tests**: e2e
**Gate**: `pnpm test:e2e`, then `pnpm build`
