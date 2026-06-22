# Admin Access Management Specification

## Problem Statement

A area logada de admin concentra hoje convite, listagem de convites e listagem de usuarios em uma unica tela. Isso dificulta a operacao diaria conforme a base cresce e impede uma experiencia mais clara para dois fluxos diferentes: consultar usuarios cadastrados e gerenciar convites pendentes.

## Goals

- [x] Separar a area admin em telas dedicadas para usuarios e convites.
- [x] Exibir usuarios em uma tabela paginada, user-friendly, usando TanStack Query e TanStack Table.
- [x] Exibir convites em uma tabela paginada, user-friendly, usando TanStack Query e TanStack Table.
- [x] Manter criacao de convite na tela de convites e atualizar a listagem imediatamente apos sucesso.
- [x] Refletir as novas telas na sidebar do perfil ADMIN.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Edicao de usuarios | O pedido atual cobre listagem, nao gestao completa de usuarios. |
| Alteracao de role de usuario | Fluxo sensivel de autorizacao, deve ter especificacao propria. |
| Reenvio de convite | Ja estava fora do MVP original de convites. |
| Convites para ADMIN | Regra atual permite apenas STUDENT e TEACHER. |
| Busca/filtros avancados | Pode ser adicionado depois; esta entrega foca separacao, paginacao e UX basica. |

---

## User Stories

### P1: Admin Lista Usuarios Em Tela Dedicada ⭐ MVP

**User Story**: As an admin, I want a dedicated users page with a paginated table so that I can inspect registered accounts without mixing them with invitation tasks.

**Why P1**: E o primeiro fluxo explicitamente pedido e reduz a confusao da tela admin atual.

**Acceptance Criteria**:

1. WHEN an ADMIN opens `/app/admin/usuarios` THEN system SHALL show a paginated users table with name/nick, email, role, and creation date.
2. WHEN the users table loads THEN system SHALL fetch data through TanStack Query and render rows through TanStack Table.
3. WHEN the API receives users query params THEN system SHALL validate `page`, `pageSize`, and supported sorting before querying the database.
4. WHEN there are no users THEN system SHALL show a friendly empty state instead of a broken or blank table.
5. WHEN a non-admin requests the page or API THEN system SHALL deny access using existing server-side authorization patterns.

**Independent Test**: Login as admin, open `/app/admin/usuarios`, verify seeded users appear in a paginated table, then verify a non-admin cannot access the page/API.

---

### P1: Admin Gerencia Convites Em Tela Dedicada ⭐ MVP

**User Story**: As an admin, I want a dedicated invitations page with a friendly creation form and paginated invitation table so that I can create and monitor access invitations in one focused workflow.

**Why P1**: O formulario de convite e sua listagem pertencem ao mesmo fluxo operacional e precisam de feedback imediato.

**Acceptance Criteria**:

1. WHEN an ADMIN opens `/app/admin/convites` THEN system SHALL show the create-invitation form above a paginated invitations table.
2. WHEN the invitation form is submitted successfully THEN system SHALL clear appropriate form state, show success feedback, and make the new invitation appear in the table immediately.
3. WHEN the invitations table loads THEN system SHALL fetch data through TanStack Query and render rows through TanStack Table.
4. WHEN the API receives invitation query params THEN system SHALL validate `page`, `pageSize`, and supported sorting before querying the database.
5. WHEN an ADMIN cancels a pending invitation THEN system SHALL update or refetch the table so the cancelled invitation is removed or visibly no longer actionable.
6. WHEN there are no pending invitations THEN system SHALL show a friendly empty state.

**Independent Test**: Login as admin, open `/app/admin/convites`, create a teacher invite, verify the invite appears immediately in the table, cancel it, and verify the table updates.

---

### P1: Sidebar Reflete Telas Admin ⭐ MVP

**User Story**: As an admin, I want the sidebar to expose Users and Invitations separately so that I can navigate directly to the workflow I need.

**Why P1**: Sem navegacao explicita, a separacao de telas fica escondida e a experiencia continua ambigua.

**Acceptance Criteria**:

1. WHEN an ADMIN is logged in THEN sidebar SHALL show distinct entries for Usuarios and Convites.
2. WHEN the current admin route matches one of these pages THEN sidebar SHALL mark the matching item active.
3. WHEN existing STUDENT or TEACHER users open the app THEN their sidebar items SHALL remain unchanged.

**Independent Test**: Login as admin and verify sidebar links navigate to `/app/admin/usuarios` and `/app/admin/convites`; login as student/teacher and verify their navigation is unchanged.

---

### P2: Admin Landing Direciona Para Fluxos

**User Story**: As an admin, I want `/app/admin` to remain useful after the split so that old links do not feel broken.

**Why P2**: A rota atual existe e pode estar em favoritos ou testes; ela deve orientar o usuario apos a reorganizacao.

**Acceptance Criteria**:

1. WHEN an ADMIN opens `/app/admin` THEN system SHALL either redirect to `/app/admin/usuarios` or show a compact hub with links to Usuarios and Convites.
2. WHEN a non-admin opens `/app/admin` THEN existing role protection SHALL still deny access.

**Independent Test**: Open `/app/admin` as admin and verify it reaches or links to the new admin flows.

---

## Edge Cases

- WHEN a query requests a page beyond `pageCount` THEN system SHALL return an empty page with valid pagination metadata, not an error.
- WHEN `pageSize` is invalid or too large THEN system SHALL reject or clamp according to the validated schema.
- WHEN table data is loading THEN system SHALL show a stable loading state without layout jump.
- WHEN table fetch fails THEN system SHALL show a destructive alert with a retry path.
- WHEN a newly created invitation lands on a different sorted page THEN system SHALL still make the table reflect fresh data after creation, preferably by resetting/refetching the first page sorted by newest.
- WHEN two admins create or cancel invitations concurrently THEN system SHALL rely on server truth and refetch/invalidate relevant query keys after mutations.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ADM-01 | P1: Admin Lista Usuarios Em Tela Dedicada | Execute | Verified |
| ADM-02 | P1: Admin Lista Usuarios Em Tela Dedicada | Execute | Verified |
| ADM-03 | P1: Admin Gerencia Convites Em Tela Dedicada | Execute | Verified |
| ADM-04 | P1: Admin Gerencia Convites Em Tela Dedicada | Execute | Verified |
| ADM-05 | P1: Sidebar Reflete Telas Admin | Execute | Verified |
| ADM-06 | P2: Admin Landing Direciona Para Fluxos | Execute | Verified |

**Coverage:** 6 total, 6 mapped to draft tasks, 0 unmapped.

---

## Success Criteria

- [x] Admin can navigate directly to Usuarios and Convites from the sidebar.
- [x] `/app/admin/usuarios` lists registered users through a paginated TanStack Query + TanStack Table flow.
- [x] `/app/admin/convites` creates invitations and shows them immediately in the paginated list below.
- [x] Admin API reads remain paginated and authorized server-side.
- [x] The main browser flow is covered by Playwright and supporting schemas/services are covered by unit tests.
