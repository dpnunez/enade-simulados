# User Nicknames

Last updated: 2026-06-02

## Summary

Invitation acceptance now treats `User.name` as the user's unique nick. The accepted nick is collected in `src/app/convites/[token]/_components/accept-invite-form.tsx`, validated by `src/features/invitations/invitation.schema.ts`, and persisted by `src/features/invitations/invitation.service.ts:acceptInvitation()`.

## Flow Pointers

- `prisma/schema.prisma:User` defines `name` as unique.
- `prisma/migrations/20260602120000_user_name_unique_nick/migration.sql` trims existing names and desambiguates exact duplicates deterministically before adding `User_name_key`.
- `src/features/invitations/invitation.schema.ts:nickNameSchema` trims leading/trailing whitespace, preserves casing/internal spaces, and restricts nick characters.
- `src/features/invitations/invitation.service.ts:acceptInvitation()` checks duplicate email, duplicate name, creates the credential account, and maps Prisma `P2002` races to `NAME_ALREADY_REGISTERED`.
- `src/app/app/layout.tsx` displays `session.user.name` as primary identity and email as secondary metadata.
- `src/tests/e2e/invitations.spec.ts` covers accepting an invite with `Maria Silva` and seeing that nick after login.

## Gotchas

- Do not derive `User.name` from invitation email in the acceptance path.
- Seed users use deterministic display-style nick values in `scripts/seed-users.ts`.
