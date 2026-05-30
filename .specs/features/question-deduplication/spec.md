# Question Deduplication Specification

## Problem Statement

Professores podem cadastrar a mesma questao mais de uma vez quando o enunciado markdown e repetido ou importado de fontes equivalentes. Isso prejudica a qualidade do banco pedagogico, aumenta retrabalho de curadoria e pode contaminar simulados futuros com itens redundantes.

## Goals

- [x] Impedir criacao de duas questoes com o mesmo conteudo canonicalizado.
- [x] Impedir edicao de uma questao para um conteudo que ja pertence a outra questao.
- [x] Manter `Question.id` estavel e independente do conteudo da questao.
- [x] Usar SHA-256 como assinatura deterministica de deduplicacao.
- [x] Garantir protecao no banco via indice unico para suportar concorrencia.
- [x] Exibir erro claro para professores quando uma questao duplicada for detectada.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Usar hash como chave primaria da questao | Edicoes de enunciado mudariam a identidade da entidade e afetariam relacionamentos futuros. |
| Similaridade fuzzy entre questoes parecidas | E util para curadoria, mas exige heuristicas e UI de revisao fora do corte atual. |
| Deduplicacao por alternativas | O corte atual usa `descriptionMarkdown` porque foi a decisao solicitada para uma solucao simples. |
| Merge automatico de questoes duplicadas existentes | Pode apagar ou misturar dados pedagogicos sem revisao humana. |
| Deduplicacao entre ambientes | O hash e local ao banco atual; sincronizacao entre ambientes nao sera tratada agora. |

---

## User Stories

### P1: Professor Nao Cria Questao Duplicada MVP

**User Story**: As a teacher, I want the system to reject a question with an already registered statement so that the question bank does not accumulate duplicate items.

**Why P1**: Este e o objetivo central e deve funcionar mesmo com duas requisicoes concorrentes.

**Acceptance Criteria**:

1. WHEN a teacher submits a question whose normalized `descriptionMarkdown` already exists THEN system SHALL reject creation and create no question or alternatives.
2. WHEN two equivalent create requests arrive concurrently THEN system SHALL persist at most one question.
3. WHEN duplication is detected THEN system SHALL return a stable domain error code for API/UI handling.
4. WHEN duplication is detected from the form THEN system SHALL show a clear Portuguese message without clearing the teacher input.

**Independent Test**: Login as `teacher@enade.local`, create a question, submit another question with equivalent markdown text, and verify the second submission shows a duplicate message while only one record exists.

---

### P1: Professor Nao Edita Questao Para Conteudo Duplicado

**User Story**: As a teacher, I want edits to respect the same duplicate protection so that a valid existing question cannot become a duplicate of another one.

**Why P1**: Criacao protegida nao basta se edicao puder contornar a regra.

**Acceptance Criteria**:

1. WHEN a teacher edits a question without changing its normalized `descriptionMarkdown` THEN system SHALL allow the update.
2. WHEN a teacher edits a question to a normalized `descriptionMarkdown` used by another question THEN system SHALL reject the update and preserve the original question.
3. WHEN update duplication is detected THEN system SHALL return the same stable duplicate error code used by create.
4. WHEN update duplication is detected from the form THEN system SHALL show a clear Portuguese message without discarding the edited draft.

**Independent Test**: Create two different questions, open the edit page for one of them, change its enunciado to match the other, submit, and verify the app reports duplication and the original persisted content remains unchanged.

---

### P2: Sistema Migra Dados Existentes Com Seguranca

**User Story**: As a maintainer, I want existing questions to receive deduplication hashes safely so that the unique constraint can be added without corrupting data.

**Why P2**: A migracao precisa considerar dados ja cadastrados no banco local/teste.

**Acceptance Criteria**:

1. WHEN the migration adds the hash column THEN system SHALL backfill hashes for existing questions.
2. WHEN existing duplicate hashes are found during migration planning or backfill THEN system SHALL fail explicitly or require manual cleanup before adding the unique index.
3. WHEN Prisma client is regenerated THEN TypeScript code SHALL use the new field consistently.

**Independent Test**: Run Prisma migration/generation on the current database and verify `pnpm build` succeeds with `Question.contentHash` available.

---

## Edge Cases

- WHEN markdown differs only by leading/trailing whitespace THEN system SHALL treat it as duplicate.
- WHEN markdown differs only by repeated whitespace and line endings THEN system SHALL treat it as duplicate if canonicalization collapses those differences.
- WHEN markdown differs by meaningful characters or words THEN system SHALL allow a distinct question.
- WHEN `descriptionMarkdown` is empty THEN existing validation SHALL reject before hashing.
- WHEN a duplicate is detected by the database unique constraint THEN service SHALL map it to `QUESTION_DUPLICATE_CONTENT`.
- WHEN a hash collision hypothetically occurs THEN system SHALL treat it as duplicate because SHA-256 collision risk is negligible for this domain.
- WHEN a question is deleted THEN its hash SHALL be released for future creation of the same content.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| QDUP-01 | P1: Professor Nao Cria Questao Duplicada MVP | Complete | Complete |
| QDUP-02 | P1: Professor Nao Cria Questao Duplicada MVP | Complete | Complete |
| QDUP-03 | P1: Professor Nao Edita Questao Para Conteudo Duplicado | Complete | Complete |
| QDUP-04 | P2: Sistema Migra Dados Existentes Com Seguranca | Complete | Complete |
| QDUP-05 | Edge Cases: canonicalizacao, constraint e concorrencia | Complete | Complete |

**Coverage:** 5 total, 5 mapped to completed tasks, 0 unmapped.

---

## Success Criteria

- [x] `Question` has a persisted unique `contentHash` derived from normalized `descriptionMarkdown`.
- [x] `Question.id` remains a generated stable identifier and does not depend on content.
- [x] Create and update flows compute the same hash for equivalent markdown.
- [x] Duplicate create/update requests return `QUESTION_DUPLICATE_CONTENT`.
- [x] The question form displays a Portuguese duplicate-content message and preserves input.
- [x] Unit tests cover hash normalization and service duplicate mapping.
- [x] E2E coverage verifies duplicate prevention through the browser flow.
