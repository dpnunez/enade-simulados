# Password Reset Spec

**Status**: Implemented
**Created**: 2026-06-09

---

## Context

O projeto usa Better Auth para login por email/senha e sessão, mas mantém signup público desativado. A criação de usuários já foi implementada como domínio próprio de convites: o convite cria contas compatíveis com Better Auth, sem reabrir endpoints públicos de cadastro.

O Better Auth 1.6.11 instalado possui endpoints de reset de senha (`/request-password-reset`, `/reset-password/:token`, `/reset-password`), mas eles dependem de `emailAndPassword.sendResetPassword`, usam a tabela genérica `Verification` e expõem URLs/contratos próprios da lib. Para este projeto, o fluxo deve seguir o mesmo padrão de convites: UI e rotas first-party em português, token com hash persistido no domínio da feature, adapter de email isolado e atualização de senha compatível com Better Auth.

---

## Goals

- [x] Permitir que usuários existentes solicitem um link de redefinição de senha pelo email.
- [x] Enviar um link de reset usando o mesmo modelo de entrega configurável já adotado para convites.
- [x] Permitir que o usuário defina uma nova senha a partir de um token válido e não expirado.
- [x] Atualizar a senha credential de forma compatível com Better Auth.
- [x] Revogar sessões existentes após a troca de senha.
- [x] Evitar enumeração de usuários por resposta, timing óbvio ou mensagens diferentes.

## Non-Goals

| Out of Scope | Reason |
| --- | --- |
| Usar o endpoint nativo de reset do Better Auth como fluxo principal | O produto já controla criação de conta por domínio próprio e precisa de rotas/UI/adapters consistentes com convites. |
| Permitir reset para emails sem conta | A resposta pública deve ser genérica, mas nenhuma senha deve ser criada para usuário inexistente. |
| Reset iniciado por admin | Fluxo separado de gestão administrativa; pode ser planejado depois. |
| MFA, OTP ou magic link login | Escopo maior que a recuperação básica de senha. |
| Implementar SMTP real | O adapter deve preparar o contrato; provider real segue como decisão posterior, assim como convites. |

---

## Requirements

### RESET-01: Request Password Reset

**User Story**: As a user who forgot my password, I want to request a reset link using my email so that I can regain access.

**Acceptance Criteria**

1. WHEN an anonymous user opens `/esqueci-senha` THEN the system SHALL show an email form.
2. WHEN the submitted email is syntactically invalid THEN the system SHALL show validation feedback and SHALL NOT create a token.
3. WHEN the submitted email belongs to an existing credential user THEN the system SHALL create a password reset token, store only its hash, and send a reset link.
4. WHEN the submitted email does not belong to an existing user THEN the system SHALL return the same public success message and SHALL NOT disclose that the account is absent.
5. WHEN repeated requests happen for the same email THEN the system SHALL invalidate previous pending reset tokens for that user before creating the new active token.

**Independent Test**: Submit a seeded user email and verify a reset link is logged without exposing the raw token in the database.

### RESET-02: Reset Password With Token

**User Story**: As a user with a reset link, I want to set a new password so that my old password no longer works.

**Acceptance Criteria**

1. WHEN a valid token is opened at `/redefinir-senha/[token]` THEN the system SHALL show a password form.
2. WHEN the token is invalid, expired, already used, or cancelled THEN the system SHALL show a generic unavailable state and SHALL NOT show the password form.
3. WHEN the password is too short or does not match confirmation THEN the system SHALL show validation feedback and SHALL NOT consume the token.
4. WHEN a valid password is submitted with a valid token THEN the system SHALL update the user's credential password, mark the token as used, and revoke existing sessions.
5. WHEN the same token is submitted twice THEN the second request SHALL fail without changing the password again.

**Independent Test**: Reset `student@enade.local`, confirm old password fails and new password signs in.

### RESET-03: Email Delivery Boundary

**User Story**: As an operator, I want reset emails to use the same delivery style as invitations so that dev/test behavior remains deterministic.

**Acceptance Criteria**

1. WHEN delivery is `console` THEN the system SHALL log structured reset email data to stdout.
2. WHEN `console` delivery has log-file envs configured THEN the system SHALL append one JSON line per reset email to that file, using the same pattern as invitations.
3. WHEN running E2E THEN reset delivery SHALL write to an untracked file under `./e2e-fixtures/tmp/`, which is already ignored by git via `/e2e-fixtures/**/*`.
4. WHEN an E2E test requests reset THEN the test SHALL read the reset URL from that deterministic log file, mirroring `src/tests/e2e/helpers/invitations.ts`.
5. WHEN delivery is `smtp` without required SMTP envs THEN the system SHALL fail loudly server-side.
6. WHEN a reset request email fails to send for an existing user THEN the API SHALL return an operational error that does not reveal user existence.

**Independent Test**: Unit-test the adapter URL builder and console/log-file delivery.

### RESET-04: Security and Abuse Controls

**Acceptance Criteria**

1. WHEN tokens are persisted THEN only SHA-256 hashes SHALL be stored.
2. WHEN tokens are generated THEN they SHALL use cryptographically secure random bytes and URL-safe encoding.
3. WHEN tokens expire THEN reset pages and API submissions SHALL reject them.
4. WHEN reset completes THEN all sessions for the user SHALL be deleted.
5. WHEN any request is handled THEN API routes SHALL validate server-side with Zod and SHALL not rely on client validation.
6. WHEN reset endpoints are public THEN responses SHALL avoid user enumeration.

### RESET-05: UX Integration

**Acceptance Criteria**

1. WHEN the login page renders THEN it SHALL include a path to the forgot-password flow.
2. WHEN request submission succeeds THEN the UI SHALL show a neutral "check your email if the account exists" message.
3. WHEN reset succeeds THEN the UI SHALL guide the user back to login.
4. WHEN forms render THEN they SHALL use `react-hook-form`, `zod`, and shadcn-aligned controls.

---

## Edge Cases

- Token guessed or malformed: hash and lookup only; show generic invalid state.
- Existing user without credential account: reject reset internally and return generic public success for request.
- Email case or surrounding spaces: normalize with Zod before lookup.
- Concurrent reset submits for the same token: transactional update should allow only one successful consumption.
- User requests a new token after an older one: older pending token becomes invalid.
- Delivery failure after token creation: record enough state to allow later operational diagnosis without exposing token.

---

## Success Criteria

- [x] `student@enade.local` can reset password end-to-end in Playwright.
- [x] Old sessions are revoked after reset.
- [x] Old password no longer signs in after reset.
- [x] Raw tokens never appear in persisted database rows.
- [x] Unknown email receives the same public response as known email.
- [x] Unit tests cover schemas, token service, domain service, and email adapter.

## Implementation Traceability

| Requirement | Implementation |
| --- | --- |
| RESET-01 | `src/app/esqueci-senha`, `src/app/api/password-reset/request`, `src/features/password-reset/password-reset.service.ts` |
| RESET-02 | `src/app/redefinir-senha/[token]`, `src/app/api/password-reset/confirm`, `src/features/password-reset/password-reset.service.ts` |
| RESET-03 | `src/features/password-reset/password-reset-email.adapter.ts`, `.env.test`, `src/tests/e2e/helpers/password-reset.ts` |
| RESET-04 | `prisma/schema.prisma`, reset token/service tests, transactional confirmation and session deletion |
| RESET-05 | Login link, public reset forms, and Playwright flow in `src/tests/e2e/password-reset.spec.ts` |
