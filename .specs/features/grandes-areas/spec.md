# Grandes Areas Specification

## Problem Statement

Professores precisam organizar o futuro banco de materias e questoes em agrupadores pedagogicos mais amplos. A grande area funciona como um guarda-chuva de materias relacionadas, por exemplo "Calculo" agrupando Calculo 1, 2, 3, A e B, e esta entrega deve cobrir cadastro, edicao, listagem e delecao da grande area.

## Goals

- [x] Permitir que professores criem grandes areas com titulo, descricao e cor hexadecimal.
- [x] Permitir que professores vejam as grandes areas existentes em uma tela unica.
- [x] Permitir que qualquer professor edite titulo, descricao e cor de qualquer grande area.
- [x] Permitir que qualquer professor delete uma grande area apos confirmacao explicita.
- [x] Garantir que titulos de grandes areas sejam unicos no catalogo inteiro.
- [x] Preparar o modelo de dados para futura associacao de materias sem implementar materias agora.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cadastro de materias | O objetivo atual e somente cadastrar a grande area. |
| Relacao materia-grande area | Depende da feature futura de materias. |
| Permissoes para ADMIN gerenciar grandes areas | A responsabilidade da feature foi definida para professores. |
| Paleta predefinida obrigatoria | A regra solicitada e aceitar uma cor hexadecimal atribuida a area. |

---

## User Stories

### P1: Professor Cria Grande Area MVP

**User Story**: As a teacher, I want to create a grande area with title, description, and hex color so that I can start organizing academic content into broad subject groups.

**Why P1**: E o fluxo principal solicitado e cria a base para materias e questoes futuras.

**Acceptance Criteria**:

1. WHEN an authenticated TEACHER opens the page THEN system SHALL show the page title "Gerenciar grandes areas".
2. WHEN an authenticated TEACHER submits a valid title, description, and hex color THEN system SHALL create a grande area linked to that teacher.
3. WHEN a non-teacher attempts to create a grande area through the mutation boundary THEN system SHALL reject the request and not create data.
4. WHEN the title is empty, description is empty, or color is not a valid `#RRGGBB` hexadecimal value THEN system SHALL reject the submission with validation feedback.
5. WHEN a grande area with the same normalized title already exists THEN system SHALL reject duplicate creation with a form-friendly error.
6. WHEN the submitted title differs only by casing or extra spaces from an existing title THEN system SHALL treat it as the same title and reject it.

**Independent Test**: Login as `teacher@enade.local`, open the management page, submit "Calculo" with a description and `#2563EB`, and verify it appears in the list.

---

### P1: Professor Lista Grandes Areas MVP

**User Story**: As a teacher, I want to see existing grandes areas on the same screen as the creation form so that I can avoid duplicates and understand the current catalog.

**Why P1**: A listagem na mesma tela foi requisito explicito e torna o cadastro operacional.

**Acceptance Criteria**:

1. WHEN an authenticated TEACHER opens the management page THEN system SHALL list existing grandes areas ordered by most recently updated first.
2. WHEN no grandes areas exist THEN system SHALL show an empty state instead of a broken list.
3. WHEN a grande area has a hex color THEN system SHALL show a visual color swatch and the hex value.
4. WHEN a STUDENT attempts to access the management UI THEN system SHALL redirect or deny access through server-side role protection.

**Independent Test**: Login as teacher, open `/app/professor/grandes-areas`, and verify the form plus either the existing list or empty state are visible.

---

### P1: Professor Edita Qualquer Grande Area MVP

**User Story**: As a teacher, I want to edit any grande area so that I can correct titles, descriptions, or colors as the shared catalog evolves.

**Why P1**: O usuario pediu cadastro, edicao e listagem; edicao fecha o CRUD minimo sem remocao.

**Acceptance Criteria**:

1. WHEN an authenticated TEACHER edits title, description, or color with valid values THEN system SHALL update the grande area, regardless of which teacher created it.
2. WHEN a non-teacher attempts to edit a grande area through the mutation boundary THEN system SHALL reject the request and preserve the original data.
3. WHEN an edit would create a duplicate normalized title THEN system SHALL reject the update with a form-friendly error.
4. WHEN an edit keeps the same grande area title unchanged after normalization THEN system SHALL allow the update of description or color.
5. WHEN validation fails during edit THEN system SHALL keep the existing grande area unchanged and show validation feedback.

**Independent Test**: Login as teacher, create "Calculo", edit its color, and verify the updated color appears after refresh.

---

### P1: Professor Deleta Grande Area MVP

**User Story**: As a teacher, I want to delete any grande area with confirmation so that I can remove catalog entries created by mistake.

**Why P1**: O usuario pediu explicitamente delecao ao lado do botao de editar, com confirmacao antes da mutacao destrutiva.

**Acceptance Criteria**:

1. WHEN an authenticated TEACHER sees a listed grande area THEN system SHALL show a delete control beside the edit control.
2. WHEN the teacher clicks delete THEN system SHALL ask for confirmation before calling the mutation boundary.
3. WHEN the teacher cancels confirmation THEN system SHALL preserve the existing grande area.
4. WHEN the teacher confirms deletion THEN system SHALL delete the grande area and remove it from the list.
5. WHEN a non-teacher attempts to delete a grande area through the mutation boundary THEN system SHALL reject the request and preserve the data.
6. WHEN the grande area no longer exists during delete THEN system SHALL return a not-found error and leave the list reloadable.

**Independent Test**: Login as teacher, create "Calculo Temporario", delete it with confirmation, and verify it no longer appears in the list after refresh.

---

## Edge Cases

- WHEN title has leading/trailing or repeated internal spaces THEN system SHALL normalize it for duplicate checks while preserving a clean display title.
- WHEN titles differ only by uppercase/lowercase or repeated whitespace THEN system SHALL treat them as duplicates.
- WHEN color is submitted without `#`, with shorthand `#FFF`, or with invalid characters THEN system SHALL reject it and request `#RRGGBB`.
- WHEN two create requests submit the same title concurrently THEN system SHALL allow at most one record.
- WHEN a grande area no longer exists during edit THEN system SHALL return a not-found error and leave the list reloadable.
- WHEN a grande area no longer exists during delete THEN system SHALL return a not-found error and leave the list reloadable.
- WHEN a user has a stale session cookie THEN system SHALL still enforce real server-side authorization before rendering or mutating data.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| GA-01 | P1: Professor Cria Grande Area | Execute | Done |
| GA-02 | P1: Professor Cria Grande Area | Execute | Done |
| GA-03 | P1: Professor Lista Grandes Areas | Execute | Done |
| GA-04 | P1: Professor Lista Grandes Areas | Execute | Done |
| GA-05 | P1: Professor Edita Qualquer Grande Area | Execute | Done |
| GA-06 | Edge Cases: validacao, duplicidade e concorrencia | Execute | Done |
| GA-07 | P1: Professor Deleta Grande Area | Execute | Done |

**Coverage:** 7 total, 7 mapped to draft tasks, 0 unmapped.

---

## Success Criteria

- [x] `teacher@enade.local` can create a grande area from the page titled "Gerenciar grandes areas".
- [x] The creation form and list are visible on the same page.
- [x] Created grandes areas show title, description, hex color, color swatch, and creator metadata.
- [x] Any teacher can edit an existing grande area without leaving the management flow.
- [x] Any teacher can delete an existing grande area only after confirming the destructive action.
- [x] The database and service reject duplicate grande area titles across the whole catalog.
- [x] Students cannot access or mutate grandes areas.
- [x] Core validation/service rules have unit coverage and the main browser flow has E2E coverage.
