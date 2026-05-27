# User Invitations Specification

## Problem Statement

Hoje o projeto tem autenticação por email e senha com signup público desativado, mas ainda não há um fluxo operacional para admins criarem novos usuários. A plataforma precisa garantir que alunos e professores só entrem por convite emitido por um admin, vinculando o cadastro ao email e à role definidos no convite.

## Goals

- [x] Permitir que admins convidem alunos e professores por email, com token único.
- [x] Permitir que o convidado cadastre apenas a senha, mantendo email e role fixos pelo convite.
- [x] Garantir que novos usuários reais sejam criados no formato compatível com Better Auth.
- [x] Permitir que admins listem usuários, convites pendentes e cancelem convites ainda não usados.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Signup público | A regra de produto exige que convite seja o único caminho de criação de usuário. |
| Convites para ADMIN | Reduz risco operacional no MVP; admins iniciais continuam via seed/gestão técnica. |
| Reenvio de convite | Útil, mas não necessário para o primeiro fluxo completo. |
| Alteração de role no aceite | A role deve ser definida pelo admin no momento do convite. |
| Verificação de email separada | O convite já é enviado ao email definido e o aceite consome token de posse. |

---

## User Stories

### P1: Admin Envia Convite ⭐ MVP

**User Story**: As an admin, I want to send an invitation to a student or teacher email so that the person can create an account without public signup.

**Why P1**: É a entrada operacional de novos usuários no produto.

**Acceptance Criteria**:

1. WHEN an authenticated ADMIN submits an email and role `STUDENT` or `TEACHER` THEN system SHALL create a pending invitation with a unique token, email, and role.
2. WHEN a non-admin attempts to create an invitation THEN system SHALL reject the mutation and not create data.
3. WHEN the invited email already belongs to an existing user THEN system SHALL reject the invitation with an `EMAIL_ALREADY_REGISTERED` validation error and a message specific to an existing account.
4. WHEN a pending invitation already exists for the same email THEN system SHALL reject duplicate creation with a `PENDING_INVITATION_EXISTS` validation error and a message instructing the admin to cancel the pending invite first.
5. WHEN an invitation is created THEN system SHALL send an email containing a registration link with the raw token.

**Independent Test**: Login as admin, create a teacher invite, and verify it appears as pending with the expected email and role.

---

### P1: Convidado Aceita Convite ⭐ MVP

**User Story**: As an invited student or teacher, I want to open the invite link and set my password so that my account is created with the intended email and role.

**Why P1**: Completa o fluxo de criação sem signup público.

**Acceptance Criteria**:

1. WHEN a valid pending invitation token is opened THEN system SHALL render a registration form with email and role prefilled and non-editable.
2. WHEN the invite token is invalid, cancelled, or already accepted THEN system SHALL show a non-usable error state and no password form.
3. WHEN the invited user submits a valid password THEN system SHALL create a Better Auth-compatible credential user with the invitation email and role.
4. WHEN the user account is created THEN system SHALL mark the invitation as accepted and prevent token reuse.
5. WHEN password validation fails THEN system SHALL keep the invitation pending and show validation feedback.

**Independent Test**: Open a generated invite link, confirm email/role are locked, set a password, then log in with the new credentials.

---

### P1: Admin Lista Usuários e Convites ⭐ MVP

**User Story**: As an admin, I want to see registered users and pending invitations so that I can manage access to the platform.

**Why P1**: Fecha o ciclo administrativo mínimo pedido para a feature.

**Acceptance Criteria**:

1. WHEN an ADMIN opens the admin area THEN system SHALL show registered users with email, role, and creation date.
2. WHEN an ADMIN opens the admin area THEN system SHALL show pending invitations with email, role, status, and creation date.
3. WHEN a non-admin attempts to access the management UI THEN system SHALL be redirected or denied by existing role protection.
4. WHEN there are no users beyond seed or no pending invites THEN system SHALL show an empty state instead of a broken table.

**Independent Test**: Login as admin and verify both users and pending invitations sections render with deterministic data.

---

### P1: Admin Cancela Convite Pendente ⭐ MVP

**User Story**: As an admin, I want to cancel a pending invitation so that a stale or incorrect link cannot be used.

**Why P1**: É requisito explícito e reduz risco de acesso indevido.

**Acceptance Criteria**:

1. WHEN an ADMIN cancels a pending invitation THEN system SHALL mark it as cancelled and remove it from active pending invite actions.
2. WHEN a cancelled invite link is opened THEN system SHALL not allow registration.
3. WHEN an ADMIN attempts to cancel an accepted or already cancelled invitation THEN system SHALL return a safe no-op or clear validation message.
4. WHEN a non-admin attempts cancellation THEN system SHALL reject the mutation.

**Independent Test**: Create an invite, cancel it, then open its link and verify registration is unavailable.

---

## Edge Cases

- WHEN a token is guessed or malformed THEN system SHALL compare only against stored token hashes and return a generic invalid invite state.
- WHEN two requests try to accept the same invitation concurrently THEN system SHALL create at most one user and leave the invite accepted once.
- WHEN email casing differs THEN system SHALL normalize email before uniqueness checks.
- WHEN the invited email becomes an existing user before acceptance THEN system SHALL reject acceptance and mark the invite unusable or surface an admin-visible conflict.
- WHEN an admin invites an email with an existing account THEN system SHALL show a different error than the pending-invite duplicate case.
- WHEN an admin invites an email with a pending invitation THEN system SHALL show a different error than the existing-account case.
- WHEN email delivery fails after invitation creation THEN system SHALL record the invite and surface delivery failure to the admin for retry/follow-up.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| INV-01 | P1: Admin Envia Convite | Phase 1 + Phase 2 | Verified |
| INV-02 | P1: Admin Envia Convite | Tasks | Verified |
| INV-03 | P1: Convidado Aceita Convite | Phase 1 + Phase 2 | Verified |
| INV-04 | P1: Convidado Aceita Convite | Tasks | Verified |
| INV-05 | P1: Admin Lista Usuários e Convites | Tasks | Verified |
| INV-06 | P1: Admin Cancela Convite Pendente | Phase 1 + Phase 2 | Verified |
| INV-07 | Edge Cases: token/security/concurrency | Phase 1 + Phase 2/3 | Verified |

**Coverage:** 7 total, 7 mapped to completed tasks, 7 verified, 0 unmapped.

**Implementation Progress:** Feature completed on 2026-05-27: data foundation, invitation services, email adapter, API routes, admin UI, public invite acceptance flow, E2E lifecycle coverage, and final traceability were completed.

---

## Success Criteria

- [x] Admin can create an invite for `student@example.com` or `teacher@example.com` without public signup.
- [x] Invite acceptance creates a login-capable Better Auth credential account with the correct role.
- [x] Email and role are never editable by the invited user during registration.
- [x] Cancelled, accepted, and malformed tokens cannot create users.
- [x] The main admin flow is covered by E2E and the core invitation rules are covered by automated tests.
