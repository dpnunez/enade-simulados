# Professor Content Organization Specification

## Problem Statement

A area logada do professor hoje concentra criacao e listagem de grandes areas em uma unica tela e usa listagens em cards pouco escalaveis para grandes areas e questoes. O professor precisa de fluxos separados, mais claros e mais eficientes para cadastrar grandes areas, revisar grandes areas existentes, cadastrar questoes e listar questoes, mantendo a logica de dominio atual e sem alterar o ranking.

## Goals

- [ ] Separar criacao e listagem de grandes areas em telas dedicadas.
- [ ] Tornar o formulario de grande area mais amigavel sem trocar as regras de negocio existentes.
- [ ] Migrar a listagem de grandes areas para React Table + React Query com API simples, sem paginacao.
- [ ] Melhorar a UX do formulario de questoes existente mantendo o fluxo de salvar e voltar para a listagem.
- [ ] Melhorar a listagem de questoes com React Table + React Query usando API paginada.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Ranking de professores | Usuario informou que o ranking esta otimo e nao deve ser alterado. |
| Mudancas no modelo Prisma | A logica atual atende; o trabalho deve reorganizar telas, APIs de leitura e UX. |
| Paginacao da listagem de grandes areas | Usuario informou que grandes areas nao precisam de paginacao. |
| Alterar regras de criacao/edicao/delecao | Regras atuais ja atendem; mudancas devem focar apresentacao, navegacao e leitura. |

---

## User Stories

### P1: Criar Grande Area Em Tela Dedicada ⭐ MVP

**User Story**: Como professor, quero uma tela exclusiva para cadastrar grandes areas para preencher o formulario com menos ruido e voltar naturalmente para a listagem depois do cadastro.

**Why P1**: E o principal pedido de organizacao da area logada do professor.

**Acceptance Criteria**:

1. WHEN um professor acessa `/app/professor/grandes-areas/nova` THEN system SHALL exibir somente o formulario de criacao de grande area e a navegacao de retorno.
2. WHEN o professor cria uma grande area com dados validos THEN system SHALL persistir usando a logica atual e redirecionar para `/app/professor/grandes-areas`.
3. WHEN a API retorna erro de validacao ou titulo duplicado THEN system SHALL exibir feedback claro no formulario sem perder os dados digitados.
4. WHEN nao ha permissao de professor THEN system SHALL bloquear a pagina usando a protecao server-side existente.
5. WHEN o cadastro falha ou conclui com sucesso THEN system SHALL comunicar o resultado com `sonner`.

**Independent Test**: Login como `teacher@enade.local`, acessar `/app/professor/grandes-areas/nova`, criar uma area valida e confirmar que a URL final e `/app/professor/grandes-areas` com o novo registro na listagem.

---

### P1: Listar Grandes Areas Com Tabela Simples ⭐ MVP

**User Story**: Como professor, quero listar grandes areas em uma tabela simples para revisar e operar registros sem uma pagina longa de cards.

**Why P1**: A listagem de grandes areas foi explicitamente pedida como tela separada usando React Table + React Query, mas sem necessidade de paginacao.

**Acceptance Criteria**:

1. WHEN um professor acessa `/app/professor/grandes-areas` THEN system SHALL exibir a listagem de grandes areas, sem renderizar o formulario de criacao inline.
2. WHEN a tabela carrega dados THEN system SHALL buscar `/api/subject-fields` por uma API simples de leitura sem paginacao.
3. WHEN o professor ordena ou filtra visualmente os dados THEN system SHALL atualizar a tabela no cliente mantendo estado de carregamento, vazio e erro.
4. WHEN o professor edita ou deleta uma grande area THEN system SHALL manter as mutacoes atuais, atualizar/invalidate a listagem e comunicar sucesso/erro com `sonner`.
5. WHEN nao ha registros THEN system SHALL exibir estado vazio com chamada para criar uma nova grande area.

**Independent Test**: Acessar `/app/professor/grandes-areas`, confirmar tabela, ordenacao/filtro basico quando implementado, estado vazio quando aplicavel e link para criar nova grande area.

---

### P1: Melhorar UX Do Cadastro De Questoes ⭐ MVP

**User Story**: Como professor, quero cadastrar questoes em uma tela mais guiada para entender melhor enunciado, metadados, explicacao e alternativas.

**Why P1**: A tela ja existe, mas o usuario apontou que a UI/UX esta pouco amigavel.

**Acceptance Criteria**:

1. WHEN o professor acessa `/app/professor/questoes/nova` THEN system SHALL exibir uma organizacao visual mais clara do formulario sem mudar o payload esperado pela API.
2. WHEN ha campos com erro THEN system SHALL indicar a secao/campo problematica com mensagens proximas ao controle.
3. WHEN o professor manipula alternativas THEN system SHALL deixar claro qual alternativa esta marcada como correta e preservar as regras de minimo, maximo e reordenacao atuais.
4. WHEN a questao e salva com sucesso THEN system SHALL comunicar o sucesso com `sonner` e redirecionar para `/app/professor/questoes`.
5. WHEN nao ha grandes areas THEN system SHALL orientar o professor a criar uma grande area antes de criar questoes.
6. WHEN a API retorna erro de validacao, duplicidade ou relacionamento THEN system SHALL comunicar o erro com `sonner` sem perder os dados digitados.

**Independent Test**: Criar uma questao completa, verificar feedback de validacao em campos obrigatorios e confirmar retorno para a listagem apos sucesso.

---

### P1: Listar Questoes Com Tabela Paginada ⭐ MVP

**User Story**: Como professor, quero listar questoes em uma tabela paginada para revisar o banco de questoes com boa performance e acessar edicao/delecao.

**Why P1**: A listagem existe, mas foi apontada como mal feita; o usuario esclareceu que questoes devem ser paginadas na API.

**Acceptance Criteria**:

1. WHEN um professor acessa `/app/professor/questoes` THEN system SHALL carregar questoes via React Query a partir de uma API paginada.
2. WHEN a API retorna questoes THEN system SHALL renderizar React Table com grande area, preview do enunciado, dificuldade, fonte, ano, alternativas, correta e atualizado em.
3. WHEN o professor altera pagina, tamanho de pagina ou ordenacao THEN system SHALL atualizar a query e a tabela mantendo estado de carregamento, vazio e erro.
4. WHEN o professor clica em editar THEN system SHALL navegar para `/app/professor/questoes/[id]`.
5. WHEN o professor deleta uma questao THEN system SHALL confirmar a acao, chamar a API atual de delete, atualizar a query e comunicar sucesso/erro com `sonner`.
6. WHEN nao ha questoes THEN system SHALL exibir estado vazio com chamada para criar questao.

**Independent Test**: Acessar `/app/professor/questoes`, confirmar tabela, editar via link, deletar com confirmacao e estado vazio quando aplicavel.

---

## Edge Cases

- WHEN `/api/questions` recebe parametros de paginacao invalidos THEN system SHALL normalizar para valores padrao ou retornar erro estruturado sem quebrar a UI.
- WHEN React Query recebe erro de rede THEN system SHALL exibir mensagem amigavel na tela quando o estado impede renderizar dados e usar `sonner` para erros de acoes do usuario.
- WHEN uma grande area e deletada THEN system SHALL lembrar que questoes relacionadas sao removidas em cascade conforme decisao existente AD-013.
- WHEN um professor abre uma tela protegida sem sessao valida THEN system SHALL manter o comportamento de redirect/protecao existente.
- WHEN `@tanstack/react-query` ainda nao esta instalado THEN implementation SHALL adicionar a dependencia antes de criar os hooks/client providers.
- WHEN uma submissao ou mutacao de UI retorna sucesso/erro THEN system SHALL usar `sonner` como mecanismo padrao de feedback transiente.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PCO-01 | P1: Criar Grande Area Em Tela Dedicada | Design | Pending |
| PCO-02 | P1: Criar Grande Area Em Tela Dedicada | Design | Pending |
| PCO-03 | P1: Listar Grandes Areas Com Tabela Simples | Design | Pending |
| PCO-04 | P1: Listar Grandes Areas Com Tabela Simples | Design | Pending |
| PCO-05 | P1: Melhorar UX Do Cadastro De Questoes | Design | Pending |
| PCO-06 | P1: Listar Questoes Com Tabela Paginada | Design | Pending |
| PCO-07 | P1: Listar Questoes Com Tabela Paginada | Design | Pending |
| PCO-08 | Edge cases: auth/error/loading/empty states | Design | Pending |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Professor consegue criar grande area em tela dedicada e retorna automaticamente para a listagem.
- [ ] `/app/professor/grandes-areas` contem apenas listagem/tabela e acoes relacionadas.
- [ ] Listagem de grandes areas usa React Table + React Query e API simples sem paginacao.
- [ ] Formulario de questoes fica mais escaneavel, com controles e feedback mais claros.
- [ ] Listagem de questoes usa React Table + React Query com API paginada.
- [ ] Fluxos existentes de ranking permanecem sem alteracoes de arquivo ou comportamento.
