# SMTP Email
> Gmail SMTP delivery for invitations and password reset

Entry: `src/infra/email/smtp-mailer.ts`

Config: `src/infra/env.ts`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`
- `getSmtpConfig()` validates required fields and numeric port.
- Rejects `SMTP_SECURE=true` with port `587`; Gmail STARTTLS uses `SMTP_SECURE=false`.

Invitation flow:
- `src/features/invitations/invitation-email.adapter.ts:sendInvitationEmail()`
- `console` keeps structured console/log-file behavior.
- `smtp` builds `/convites/[token]` via `buildInvitationUrl()` and calls `sendSmtpEmail()`.

Password reset flow:
- `src/features/password-reset/password-reset-email.adapter.ts:sendPasswordResetEmail()`
- `console` keeps structured console/log-file behavior.
- `smtp` builds `/redefinir-senha/[token]` via `buildPasswordResetUrl()` and calls `sendSmtpEmail()`.

Tests:
- `src/infra/email/smtp-mailer.test.ts`
- `src/features/invitations/invitation-email.adapter.test.ts`
- `src/features/password-reset/password-reset-email.adapter.test.ts`

Docs:
- `.env.example`
- `README.md`
- `.specs/features/gmail-smtp-email/spec.md`

Gotcha:
- E2E still depends on local Postgres/Docker; SMTP work did not change that gate.

Updated: 2026-06-20
