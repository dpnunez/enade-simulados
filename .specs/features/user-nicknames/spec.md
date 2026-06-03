# User Name as Nick Specification

## Problem Statement

Usuarios criados por convite hoje recebem `User.name` derivado do email. A plataforma precisa permitir que o convidado informe seu nick no cadastro por convite, armazenando esse valor em `User.name`. O campo `name` continua existindo e passa a representar o nick escolhido pelo usuario, sem relacao automatica com o email.

## Assumptions

- "Formulario do convite" significa o formulario publico de aceite em `/convites/[token]`, onde o convidado hoje informa a senha.
- Nao sera criado um campo `nickname`.
- `User.name` sera o nick do usuario.
- `User.name` deve ser unico.
- `User.name` NAO deve ser derivado do email.
- O nick deve ser informado pelo convidado no aceite do convite.

## Goals

- [x] Coletar nick no formulario de aceite do convite.
- [x] Persistir o nick em `User.name`.
- [x] Garantir unicidade de `User.name`.
- [x] Garantir que `User.name` nunca seja derivado do email no aceite do convite.
- [x] Validar `name` no cliente e no servidor com `zod`.
- [x] Exibir `name` como identidade primaria do usuario onde fizer sentido.
- [x] Cobrir regras criticas com testes unitarios/integracao e o fluxo principal com E2E.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Campo `nickname` separado | A regra de produto agora usa `User.name` para armazenar o nick. |
| Edicao posterior do nick | Esta feature cobre apenas definicao inicial durante aceite do convite. |
| Reserva de nicks especiais | Pode ser adicionada depois se houver regra de produto clara. |
| Busca publica por nick | A feature e apenas identidade basica do usuario. |

---

## User Stories

### P1: Convidado Define Nick no Aceite

**User Story**: As an invited user, I want to choose my nick while accepting an invitation so that my account identity is not derived from my email.

**Acceptance Criteria**:

1. WHEN a valid pending invitation token is opened THEN system SHALL render a `name` field for nick with email, role, and password fields.
2. WHEN the invited user submits a valid name/nick and password THEN system SHALL create the user with `User.name` equal to the submitted nick.
3. WHEN name validation fails THEN system SHALL keep the invitation pending and show field-level feedback.
4. WHEN the submitted name/nick is already in use THEN system SHALL reject acceptance with a clear error and keep the invitation pending.
5. WHEN the user is created THEN system SHALL mark the invitation as accepted and prevent token reuse.
6. WHEN the submitted nick differs from the email local part THEN system SHALL preserve the submitted nick.

**Independent Test**: Open a generated invite link for `student@example.com`, fill nick `Maria Silva` and password, complete registration, then verify login succeeds and the created user has `name = "Maria Silva"`, not `student`.

---

### P1: Sistema Valida e Unifica Nick no Campo Name

**User Story**: As a platform operator, I want the nick stored in `User.name` to be validated and unique so that user identity is clean and unambiguous.

**Acceptance Criteria**:

1. WHEN a submitted nick has leading/trailing spaces THEN system SHALL trim it before storage.
2. WHEN a submitted nick is missing or blank THEN system SHALL reject acceptance and keep the invitation pending.
3. WHEN a submitted nick only differs by surrounding spaces from an existing name THEN system SHALL treat it as the same nick.
4. WHEN a submitted nick differs by case from an existing name THEN system SHALL preserve the submitted casing and treat it as a distinct nick unless the database value is an exact duplicate.
5. WHEN an acceptance request bypasses the browser form THEN server-side validation SHALL still enforce name/nick rules.
6. WHEN existing seed users exist THEN they SHALL keep deterministic unique `name` values or be updated deterministically if needed.

**Independent Test**: Unit/integration tests verify trimming, blank rejection, duplicate rejection, and user creation payload.

---

### P2: Interface Usa Name como Identidade Primaria

**User Story**: As an authenticated user, I want the app to show my nick so that my email is not the main visible identity.

**Acceptance Criteria**:

1. WHEN an authenticated user opens the private app layout THEN system SHALL show `User.name` as the primary title and may show email as secondary metadata.
2. WHEN an admin lists users THEN system SHALL show name/nick alongside email and role.
3. WHEN a user does not have a usable name due to unexpected legacy data THEN UI SHALL fall back safely to email instead of breaking.

**Independent Test**: E2E acceptance flow verifies the submitted nick appears after login.

---

## Edge Cases

- WHEN name contains leading/trailing spaces THEN system SHALL trim it before validation/storage.
- WHEN name differs from email local part THEN system SHALL preserve the submitted name.
- WHEN name contains unsupported characters, if a character policy is adopted, THEN system SHALL reject it with field-level feedback.
- WHEN two invite acceptances race for the same name THEN database uniqueness SHALL prevent duplicate users.
- WHEN name conflicts during acceptance THEN invitation SHALL remain pending.
- WHEN acceptance fails due to validation THEN invitation SHALL remain pending.
- WHEN migration or seed touches existing users THEN resulting names SHALL be deterministic and valid.

---

## Requirement Traceability

| Requirement ID | Story | Planned Phase | Status |
| --- | --- | --- | --- |
| NAME-01 | P1: Convidado Define Nick no Aceite | Service + UI | Verified |
| NAME-02 | P1: Sistema Valida e Unifica Nick no Campo Name | Data + Schema + Service + Tests | Verified |
| NAME-03 | P2: Interface Usa Name como Identidade Primaria | UI | Verified |
| NAME-04 | Edge Cases: trimming/validation/uniqueness/no-email-derivation | Data + Tests | Verified |

**Coverage:** 4 total, 4 mapped to implemented work, 4 verified.

## Success Criteria

- [x] Convidado precisa informar nick para aceitar convite.
- [x] Usuario criado por convite tem `name` persistido a partir do formulario.
- [x] `User.name` e unico.
- [x] `name` nunca e derivado do email no aceite do convite.
- [x] Name/nick invalido ou duplicado bloqueia cadastro sem consumir o convite.
- [x] Fluxo principal esta coberto por testes automatizados.
