# Password Reset

Last updated: 2026-06-20

## Summary

Password reset is implemented as a first-party application feature, not as the Better Auth generated reset endpoint flow. The feature plan and traceability live in `.specs/features/password-reset/`.

## Decision Pointers

- `src/infra/auth/server.ts` has `emailAndPassword.enabled: true` and `disableSignUp: true`, but no `sendResetPassword` callback configured.
- Better Auth 1.6.11 includes reset endpoints in `node_modules/better-auth/dist/api/routes/password.mjs`, requiring `emailAndPassword.sendResetPassword` and using generic `Verification` records.
- Existing invitations already create Better Auth-compatible credential accounts through `src/features/invitations/invitation.service.ts:acceptInvitation()`.
- Invitation token hashing pattern is in `src/features/invitations/invitation-token.service.ts`.
- `PasswordResetToken` stores only token hashes and lives in `prisma/schema.prisma`.
- Reset request/confirm services live in `src/features/password-reset/password-reset.service.ts`; confirmation updates credential `Account.password` with `hashPassword` and deletes `Session` rows.
- Console/log-file delivery lives in `src/features/password-reset/password-reset-email.adapter.ts` with `PASSWORD_RESET_EMAIL_*` envs.
- SMTP delivery uses `src/infra/email/smtp-mailer.ts:sendSmtpEmail()`.
- Public routes are `src/app/api/password-reset/request/route.ts` and `src/app/api/password-reset/confirm/route.ts`; UI routes are `/esqueci-senha` and `/redefinir-senha/[token]`.
- E2E coverage is in `src/tests/e2e/password-reset.spec.ts`; helper `src/tests/e2e/helpers/password-reset.ts` restores the seeded student password.
- Password requirements are centralized in `src/features/auth/password-policy.ts`; `src/features/password-reset/password-policy.ts` re-exports that contract for compatibility.
- The shared `src/components/password-requirements.tsx` checklist is consumed by both `/redefinir-senha/[token]` and `/convites/[token]`.

## Gotchas

- Do not re-enable public signup to support reset.
- Public reset request responses must not reveal whether an email exists.
- E2E reset coverage must restore or isolate seeded user passwords, because seeded users are reused across tests.
- Real reset email delivery requires `PASSWORD_RESET_EMAIL_DELIVERY=smtp` plus valid `SMTP_*` envs.
- `/redefinir-senha/[token]` depends on mutable token state, so `src/app/redefinir-senha/[token]/page.tsx` uses request-time rendering (`connection()` plus `dynamic = "force-dynamic"`).
