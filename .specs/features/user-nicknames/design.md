# User Name as Nick Design

**Spec**: `.specs/features/user-nicknames/spec.md`
**Status**: Draft

---

## Architecture Overview

This feature extends the completed invitation flow. No new user identity field is needed. The persisted data remains in the existing `User.name` column in `prisma/schema.prisma`, and the invitation acceptance flow must collect that value explicitly from the invited user.

The key rule is simple: `User.name` is the user's unique nick. During invitation acceptance, it must come from the submitted form value and must never be derived from the invitation email.

Next.js 16 note: implementation must read the current local docs in `node_modules/next/dist/docs/` before touching Route Handlers or App Router pages, per project `AGENTS.md`.

---

## Data Model

No Prisma field addition is required.

Current model:

```prisma
model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  // ...
}
```

Target model:

```prisma
model User {
  id    String @id @default(cuid())
  name  String @unique
  email String @unique
  // ...
}
```

Migration considerations:

- A migration is required because `User.name` is not unique in the current Prisma schema.
- Existing users must have deterministic unique `name` values before the unique constraint is added.
- Seed users should keep deterministic unique valid `name` values.
- The current invitation acceptance implementation must stop using `invitation.email.split("@")[0]` as a fallback for `name`.
- Database uniqueness is the final guard for race conditions.

---

## Validation

Extend `acceptInvitationSchema` in `src/features/invitations/invitation.schema.ts`:

- `token`: existing non-empty string.
- `name`: trimmed nick, required.
- `password`: existing password rule.

Recommended name/nick rule:

- Trim whitespace.
- Normalize to lowercase before storage so uniqueness is case-insensitive in practice.
- Length: 3 to 30 characters.
- Decide during implementation whether spaces are allowed. If the value is truly a nick, prefer allowing `a-z`, `A-Z`, `0-9`, `_`, `.`, and `-`.

The API route and service remain authoritative. Client-side `react-hook-form` uses the same schema via `zodResolver`.

---

## Service Changes

Update `acceptInvitation(input)` in `src/features/invitations/invitation.service.ts`:

1. Parse `acceptInvitationSchema`.
2. Resolve pending invitation.
3. Check existing email as today.
4. Check existing `User.name` after normalization.
5. Hash password.
6. In the transaction, create `User` with:
   - `name: parsed.name`
   - existing invitation `email`, `role`, `emailVerified`, and credential account.
7. Mark invitation accepted.

Remove the current behavior:

```ts
name: invitation.email.split("@")[0] ?? invitation.email
```

Add `NAME_ALREADY_REGISTERED` to `InvitationErrorCode`. Route Handlers should map it to a form-friendly `409` response. If Prisma throws a unique constraint error for `name`, map it to the same domain error where practical.

Better Auth note: the current project Prisma schema only has `email String @unique`; it does not currently enforce uniqueness for `name`. This feature should enforce uniqueness at the application/service level and the database level.

---

## UI Changes

### Accept Invite Form

Location: `src/app/convites/[token]/_components/accept-invite-form.tsx`

- Extend `FormValues` with `name`.
- Add a shadcn `Label` + `Input` for nick/name before password.
- Label can be "Nick" while the submitted field remains `name`.
- Use `autoComplete="username"` for name/nick and `autoComplete="new-password"` for password.
- Surface field-level validation for name and password.
- On `NAME_ALREADY_REGISTERED`, show a specific error such as "Este nick ja esta em uso."

### Private Layout

Location: `src/app/app/layout.tsx`

- Show `session.user.name` as primary identity when available.
- Show email as secondary metadata.
- Fall back to email only if `name` is unexpectedly missing.

### Admin Users List

Location: `src/app/app/admin/page.tsx` and related local components.

- Ensure users query includes `name`.
- Render name/nick with email, role, and creation date.

---

## Test Strategy

Unit/integration:

- `src/features/invitations/invitation.schema.test.ts`
  - accepts valid name/nick and trims it.
  - normalizes name/nick for storage.
  - rejects blank or too-short name/nick.
- `src/features/invitations/invitation.service.test.ts`
  - creates user with submitted `name`.
  - verifies `name` is not derived from email.
  - rejects duplicate `name`.
  - leaves invitation pending on name conflict.

E2E:

- Update `src/tests/e2e/invitations.spec.ts`:
  - fill custom nick/name during invite acceptance.
  - after login, verify submitted name appears in private identity UI.

Build/type:

- `pnpm build`.

---

## Open Decisions

- Should name/nick allow spaces? Current recommendation for nick is no spaces.
- Should name/nick preserve casing? Current plan stores lowercase to make uniqueness predictable.
