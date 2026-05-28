# Questions Specification

## Problem Statement

Professores precisam cadastrar questoes objetivas associadas obrigatoriamente a uma grande area para formar o banco pedagogico que alimentara simulados futuros. A questao deve guardar enunciado em markdown, metadados academicos, explicacao opcional da resposta correta e alternativas de multipla escolha com exatamente uma resposta correta.

## Goals

- [ ] Permitir que professores criem questoes vinculadas a uma grande area existente.
- [ ] Persistir todos os nomes de entidades, campos e enums em ingles no banco de dados.
- [ ] Usar `@mdxeditor/editor` para editar o enunciado markdown da questao.
- [ ] Modelar alternativas como entidade propria, ordenada, com exatamente uma alternativa correta por questao.
- [ ] Permitir que professores vejam, editem e removam questoes cadastradas em um fluxo operacional.
- [ ] Garantir validacao server-side para questao, alternativas, grande area, dificuldade, fonte e ano.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Contador de questoes na listagem de grandes areas | Sera planejado como feature posterior para nao misturar rollup com o primeiro CRUD de questoes. |
| Cascade delete de grande area para questoes/alternativas | Sera planejado como feature posterior, depois que o modelo `Question` existir. |
| Cadastro de materias/disciplinas | O relacionamento solicitado agora e diretamente com grande area. |
| Anexos e upload de imagens | Ja e ideia futura registrada; exigiria decisao sobre storage. |
| Renderizacao de questoes para alunos ou simulados | Pertence ao milestone de simulados. |
| Importacao em lote de questoes ENADE | Pode surgir depois, mas o primeiro corte e cadastro manual. |
| Fonte textual livre detalhada | O MVP usa enum opcional; detalhes bibliograficos podem ser adicionados depois se necessario. |

---

## User Stories

### P1: Professor Cria Questao MVP

**User Story**: As a teacher, I want to create a multiple-choice question linked to a subject field so that the academic question bank can start feeding future exams.

**Why P1**: Este e o fluxo central solicitado e desbloqueia todo o dominio posterior de simulados.

**Acceptance Criteria**:

1. WHEN an authenticated TEACHER opens the create question page THEN system SHALL show a question creation flow.
2. WHEN the teacher submits a valid markdown description, difficulty, subject field, and alternatives THEN system SHALL create one `Question` linked to the selected `SubjectField`.
3. WHEN the teacher submits alternatives THEN system SHALL create ordered `QuestionAlternative` rows linked to the created question.
4. WHEN the teacher opens a blank question form THEN system SHALL initialize it with 5 alternatives.
5. WHEN exactly one submitted alternative is marked correct THEN system SHALL persist that single correct alternative.
6. WHEN no subject field exists THEN system SHALL prevent creation and show guidance to create a grande area first.
7. WHEN a non-teacher calls the mutation boundary THEN system SHALL reject the request and create no data.

**Independent Test**: Login as `teacher@enade.local`, open `/app/professor/questoes/nova`, create a question for an existing grande area with five alternatives and one correct option, and verify the app navigates back to the list where the question appears.

---

### P1: Professor Valida Dados da Questao

**User Story**: As a teacher, I want clear validation feedback so that incomplete or inconsistent questions do not enter the question bank.

**Why P1**: Questoes invalidas comprometem correcao automatica e simulados futuros.

**Acceptance Criteria**:

1. WHEN description markdown is empty after trimming THEN system SHALL reject the submission.
2. WHEN difficulty is not `EASY`, `MEDIUM`, or `HARD` THEN system SHALL reject the submission.
3. WHEN source is provided and is not `ENADE`, `MANUAL`, `ADAPTED`, or `OTHER` THEN system SHALL reject the submission.
4. WHEN year is provided and is not a reasonable integer year THEN system SHALL reject the submission.
5. WHEN subject field id does not exist THEN system SHALL reject the submission with a not-found error.
6. WHEN fewer than two alternatives are submitted THEN system SHALL reject the submission.
7. WHEN zero or more than one alternatives are marked correct THEN system SHALL reject the submission.
8. WHEN any alternative content is empty after trimming THEN system SHALL reject the submission.

**Independent Test**: Submit a question with two correct alternatives and verify that the UI shows a validation error and no question is persisted.

---

### P1: Professor Lista Questoes

**User Story**: As a teacher, I want to list existing questions with their main metadata so that I can manage the question bank.

**Why P1**: Cadastro sem listagem nao e operacional para professores.

**Acceptance Criteria**:

1. WHEN a TEACHER opens the questions list page THEN system SHALL list existing questions ordered by most recently updated first.
2. WHEN a listed question has a subject field THEN system SHALL show the subject field title.
3. WHEN a listed question has difficulty THEN system SHALL show a Portuguese label for that enum.
4. WHEN source or year are present THEN system SHALL show them as secondary metadata.
5. WHEN no questions exist THEN system SHALL show an empty state.
6. WHEN a STUDENT opens the list or create page THEN system SHALL deny or redirect access through server-side role protection.
7. WHEN a TEACHER opens the list page THEN system SHALL see a navigation action to create a new question on a separate page.

**Independent Test**: Login as teacher, open `/app/professor/questoes`, and verify the page shows the question list or empty state plus a link to `/app/professor/questoes/nova`.

---

### P1: Professor Edita Questao

**User Story**: As a teacher, I want to edit a question and its alternatives so that I can correct content before the question is used in exams.

**Why P1**: O banco de questoes precisa ser mantido e corrigido continuamente.

**Acceptance Criteria**:

1. WHEN a TEACHER clicks edit from the question list THEN system SHALL navigate to `/app/professor/questoes/[id]`.
2. WHEN a TEACHER opens `/app/professor/questoes/[id]` for an existing question THEN system SHALL load a form prefilled with that question and its alternatives.
3. WHEN a TEACHER edits question fields with valid values THEN system SHALL update description, difficulty, source, year, subject field, and explanation.
4. WHEN a TEACHER edits alternatives THEN system SHALL update the ordered set of alternatives for that question.
5. WHEN the edited alternatives contain exactly one correct option THEN system SHALL persist that correct option.
6. WHEN validation fails during edit THEN system SHALL keep the existing question unchanged.
7. WHEN the question no longer exists during edit page load or submit THEN system SHALL return a not-found state/error and leave the list reloadable.
8. WHEN a non-teacher opens the edit page or calls the edit boundary THEN system SHALL reject the request and preserve the original data.

**Independent Test**: Login as teacher, open an existing question through `/app/professor/questoes/[id]`, edit its difficulty and correct alternative, refresh, and verify the updated values remain.

---

### P1: Professor Remove Questao

**User Story**: As a teacher, I want to delete a question with confirmation so that mistaken records can be removed from the bank.

**Why P1**: Questoes de teste ou incorretas nao devem permanecer no catalogo.

**Acceptance Criteria**:

1. WHEN a TEACHER sees a listed question THEN system SHALL show a delete control.
2. WHEN the teacher clicks delete THEN system SHALL require explicit confirmation before mutation.
3. WHEN the teacher confirms deletion THEN system SHALL delete the question and its alternatives.
4. WHEN the teacher cancels deletion THEN system SHALL preserve the question.
5. WHEN the question no longer exists during delete THEN system SHALL return a not-found error.
6. WHEN a non-teacher calls the delete boundary THEN system SHALL reject the request and preserve data.

**Independent Test**: Login as teacher, create a temporary question, delete it with confirmation, and verify it no longer appears after refresh.

---

## Edge Cases

- WHEN the markdown editor emits only whitespace or empty markdown THEN system SHALL reject it as empty.
- WHEN markdown is very long THEN system SHALL enforce a max length to protect UI and database ergonomics.
- WHEN optional source is omitted THEN system SHALL store `null`.
- WHEN optional year is omitted THEN system SHALL store `null`.
- WHEN year is provided as a string from the form THEN system SHALL coerce only valid integer input and reject invalid text.
- WHEN alternatives are reordered THEN system SHALL persist stable `position` values beginning at zero.
- WHEN a new create form is initialized THEN system SHALL start with 5 empty alternatives by default.
- WHEN alternatives are replaced during update THEN system SHALL perform the operation transactionally so the question never ends with partial alternatives.
- WHEN two requests update the same question concurrently THEN system SHALL preserve database consistency and return the latest committed state on reload.
- WHEN a subject field is deleted in a future phase THEN cascade behavior SHALL be handled by the separate rollup/cascade plan.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| QST-01 | P1: Professor Cria Questao | Design | Pending |
| QST-02 | P1: Professor Cria Questao | Design | Pending |
| QST-03 | P1: Professor Valida Dados da Questao | Design | Pending |
| QST-04 | P1: Professor Lista Questoes | Design | Pending |
| QST-05 | P1: Professor Edita Questao | Design | Pending |
| QST-06 | P1: Professor Remove Questao | Design | Pending |
| QST-07 | Edge Cases: transacoes, markdown, alternativas e concorrencia | Design | Pending |

**Coverage:** 7 total, 7 mapped to draft tasks, 0 unmapped.

---

## Success Criteria

- [ ] `teacher@enade.local` can create a question from `/app/professor/questoes/nova`.
- [ ] `teacher@enade.local` can list questions from `/app/professor/questoes`.
- [ ] `teacher@enade.local` can edit a question from `/app/professor/questoes/[id]`.
- [ ] Every question is linked to exactly one `SubjectField`.
- [ ] Every question has at least two alternatives and exactly one correct alternative.
- [ ] The blank creation form starts with 5 alternatives by default.
- [ ] The markdown description is edited through `@mdxeditor/editor` and stored as markdown text.
- [ ] The list shows question metadata and subject field title.
- [ ] Teacher can edit and delete questions without corrupting alternatives.
- [ ] Students cannot access or mutate questions.
- [ ] Validation/service rules have unit coverage and the main browser flow has E2E coverage.
