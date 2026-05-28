# Subject Field Question Rollup Specification

## Problem Statement

Depois que questoes existirem no dominio, a listagem de grandes areas deve mostrar quantas questoes pertencem a cada area. Alem disso, deletar uma grande area devera remover em cascade suas questoes e as alternativas dessas questoes.

## Goals

- [x] Mostrar a quantidade de questoes em cada grande area na listagem de grandes areas.
- [x] Alterar a relacao `Question.subjectFieldId` para cascade quando uma grande area for removida.
- [x] Garantir que alternativas sejam removidas junto com suas questoes.
- [x] Cobrir o comportamento com testes depois da implementacao principal de questoes.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Criacao/edicao de questoes | Pertence a `.specs/features/questions`. |
| Confirmacao adicional explicando quantidade de questoes antes de deletar grande area | Pode ser adicionado se o produto quiser uma protecao extra, mas nao e requisito agora. |
| Soft delete | O requisito explicito e cascade delete. |

---

## User Stories

### P1: Professor Ve Quantidade de Questoes por Grande Area

**User Story**: As a teacher, I want to see how many questions belong to each subject field so that I can understand coverage while managing the catalog.

**Acceptance Criteria**:

1. WHEN a TEACHER opens `/app/professor/grandes-areas` THEN system SHALL show the question count for each grande area.
2. WHEN a grande area has zero questions THEN system SHALL show count zero.
3. WHEN a question is created or deleted THEN system SHALL show the updated count after refresh.

**Independent Test**: Create a grande area with two questions, open the grandes areas page, and verify count `2`.

---

### P1: Professor Deleta Grande Area com Cascade

**User Story**: As a teacher, I want deleting a subject field to delete its questions and alternatives so that no orphan academic data remains.

**Acceptance Criteria**:

1. WHEN a TEACHER confirms deletion of a grande area THEN system SHALL delete the `SubjectField`.
2. WHEN the deleted grande area has questions THEN system SHALL delete those `Question` rows.
3. WHEN deleted questions have alternatives THEN system SHALL delete those `QuestionAlternative` rows.
4. WHEN the delete fails THEN system SHALL leave data unchanged.

**Independent Test**: Create a grande area with one question and alternatives, delete the grande area, and verify all related rows are gone.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SFR-01 | P1: Professor Ve Quantidade de Questoes por Grande Area | Implemented | Done |
| SFR-02 | P1: Professor Deleta Grande Area com Cascade | Implemented | Done |

**Coverage:** 2 total, 2 implemented, 0 unmapped.

---

## Success Criteria

- [x] Grandes areas list shows a question count.
- [x] Deleting a grande area deletes related questions.
- [x] Deleting related questions deletes related alternatives.
- [x] E2E verifies count and cascade behavior.
