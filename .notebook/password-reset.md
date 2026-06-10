# Password Reset

Last updated: 2026-06-09

## Summary

Password reset is planned as a first-party application feature, not as the Better Auth generated reset endpoint flow. The plan lives in `.specs/features/password-reset/`.

## Decision Pointers

- `src/infra/auth/server.ts` has `emailAndPassword.enabled: true` and `disableSignUp: true`, but no `sendResetPassword` callback configured.
- Better Auth 1.6.11 includes reset endpoints in `node_modules/better-auth/dist/api/routes/password.mjs`, requiring `emailAndPassword.sendResetPassword` and using generic `Verification` records.
- Existing invitations already create Better Auth-compatible credential accounts through `src/features/invitations/invitation.service.ts:acceptInvitation()`.
- Invitation token hashing pattern is in `src/features/invitations/invitation-token.service.ts`.
- Reset design recommends custom token lifecycle plus `hashPassword` from `better-auth/crypto`, updating credential `Account.password`, and deleting `Session` rows after success.

## Gotchas

- Do not re-enable public signup to support reset.
- Public reset request responses must not reveal whether an email exists.
- E2E reset coverage must restore or isolate seeded user passwords, because seeded users are reused across tests.
