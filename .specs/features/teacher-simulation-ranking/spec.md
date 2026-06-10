# Teacher Simulation Ranking Specification

## Problem Statement

Professores precisam visualizar quais estudantes tiveram melhor desempenho nos simulados para acompanhar engajamento e resultado agregado. Hoje os simulados persistem tentativas, respostas e percentual simples, mas ainda nao ha uma tela de ranking, paginacao backend nem pontuacao ponderada por dificuldade.

## Goals

- [x] Permitir que um `TEACHER` visualize ranking paginado de estudantes por pontuacao acumulada em simulados finalizados.
- [x] Calcular pontos apenas por acertos, usando pesos por dificuldade: facil = 1, media = 2, dificil = 3, sem dificuldade = media.
- [x] Mostrar metricas extras por estudante: quantidade de formularios/simulados feitos, percentual de acerto global, acertos, erros e total de questoes.
- [x] Manter paginacao, ordenacao base e agregacao no backend, com `react-table` controlando estado e renderizacao da tabela no frontend.
- [x] Garantir que apenas professores acessem a tela e a API.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Ranking por turma, periodo, professor ou grande area | Nao ha modelo de turma/periodo no dominio atual; pode ser filtro futuro. |
| Ranking em tempo real com websocket | Ranking paginado por requisicao e suficiente para o primeiro uso. |
| Gamificacao, medalhas ou recompensas | O pedido atual e relatorio em tabela. |
| Exportacao CSV/PDF | Util, mas nao necessaria para validar a feature. |
| Ranking de tentativas em andamento | Somente simulados `COMPLETED` devem contar para desempenho. |
| Regras de desconto por erro | O usuario definiu explicitamente que erro nao desconta nada. |

---

## User Stories

### P1: Visualizar Ranking Paginado ⭐ MVP

**User Story**: Como professor, quero ver uma tabela paginada dos estudantes com maior pontuacao em simulados para identificar desempenho agregado.

**Why P1**: E a entrega principal solicitada e precisa funcionar com bases maiores sem carregar todos os estudantes no navegador.

**Acceptance Criteria**:

1. WHEN um professor acessa `/app/professor/ranking` THEN o sistema SHALL exigir role `TEACHER`.
2. WHEN a pagina carrega THEN o sistema SHALL buscar a primeira pagina do ranking no backend.
3. WHEN a tabela renderiza THEN o sistema SHALL mostrar posicao global, estudante, pontos, formularios feitos, acertos, erros, questoes respondidas e percentual de acerto global.
4. WHEN o professor muda pagina ou tamanho de pagina THEN o sistema SHALL requisitar somente a pagina correspondente ao backend.
5. WHEN nao houver simulados finalizados THEN o sistema SHALL mostrar estado vazio sem erro.

**Independent Test**: Logar como `teacher@enade.local`, abrir o ranking e ver uma tabela ordenada por pontos com controles de pagina.

---

### P1: Calcular Pontuacao Ponderada ⭐ MVP

**User Story**: Como professor, quero que o ranking favoreca acertos em perguntas mais dificeis para refletir melhor o desempenho dos alunos.

**Why P1**: A regra de pontos foi definida pelo usuario e determina a ordenacao principal.

**Acceptance Criteria**:

1. WHEN uma resposta correta pertence a questao `EASY` THEN o sistema SHALL somar 1 ponto.
2. WHEN uma resposta correta pertence a questao `MEDIUM` THEN o sistema SHALL somar 2 pontos.
3. WHEN uma resposta correta pertence a questao `HARD` THEN o sistema SHALL somar 3 pontos.
4. WHEN uma questao nao possuir dificuldade por compatibilidade futura ou dado legado THEN o sistema SHALL trata-la como `MEDIUM` e somar 2 pontos.
5. WHEN uma resposta estiver incorreta, nula ou sem correcao THEN o sistema SHALL somar 0 ponto e nao descontar pontos.
6. WHEN duas ou mais linhas empatarem em pontos THEN o sistema SHALL ordenar por percentual de acerto desc, formularios feitos desc e nome/email asc para resultado estavel.

**Independent Test**: Criar dados deterministico com acertos facil, medio e dificil e verificar soma 1 + 2 + 3, sem desconto por erro.

---

### P1: Proteger API De Ranking ⭐ MVP

**User Story**: Como sistema, quero proteger a consulta do ranking para que apenas professores autenticados vejam desempenho agregado dos estudantes.

**Why P1**: O ranking expõe dados educacionais agregados por aluno.

**Acceptance Criteria**:

1. WHEN usuario sem sessao chama a API de ranking THEN o sistema SHALL retornar `401`.
2. WHEN usuario autenticado sem role `TEACHER` chama a API de ranking THEN o sistema SHALL retornar `401` ou erro de autorizacao equivalente usado pelo projeto.
3. WHEN professor chama a API com parametros invalidos THEN o sistema SHALL validar `page`, `pageSize` e retornar erro estavel sem executar consulta perigosa.
4. WHEN professor chama a API com parametros validos THEN o sistema SHALL retornar apenas dados necessarios para a tabela.

**Independent Test**: Chamar a API como `student@enade.local` e confirmar que nao recebe dados do ranking.

---

### P2: Ordenacao Controlada

**User Story**: Como professor, quero alternar ordenacao entre colunas principais para analisar desempenho por pontos, percentual ou quantidade de simulados.

**Why P2**: Ajuda analise, mas o MVP ja e util com ordenacao padrao por pontos.

**Acceptance Criteria**:

1. WHEN o professor muda a ordenacao em uma coluna permitida THEN o sistema SHALL enviar o sort ao backend.
2. WHEN o sort nao for permitido THEN o sistema SHALL voltar para ordenacao padrao.
3. WHEN a ordenacao muda THEN a tabela SHALL retornar para a primeira pagina.

**Independent Test**: Ordenar por percentual e confirmar que a URL/API e a tabela refletem a nova ordenacao.

---

## Edge Cases

- WHEN um estudante nunca finalizou simulado THEN o MVP SHALL exclui-lo do ranking, mantendo escopo em desempenho real.
- WHEN um estudante finalizou simulado sem respostas corretas THEN o sistema SHALL mostrar 0 pontos e 0% de acerto.
- WHEN uma tentativa finalizada tiver questoes nao respondidas THEN elas SHALL contar no total de questoes da tentativa e como erro para percentual global.
- WHEN `answeredCount` for menor que `totalQuestions` THEN percentual global SHALL usar `correctCount / totalQuestions`, nao apenas respondidas.
- WHEN dados antigos tiverem `SimulationAnswer.isCorrect = null` THEN essas respostas SHALL contar como 0 ponto.
- WHEN `page` exceder o total de paginas THEN o backend SHALL retornar lista vazia com `rowCount` correto.
- WHEN `pageSize` exceder o limite operacional THEN o schema SHALL limitar ou rejeitar conforme decisao de implementacao documentada no design.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RANK-01 | Visualizar Ranking Paginado | Execute | Done |
| RANK-02 | Visualizar Ranking Paginado | Execute | Done |
| RANK-03 | Calcular Pontuacao Ponderada | Execute | Done |
| RANK-04 | Calcular Pontuacao Ponderada | Execute | Done |
| RANK-05 | Proteger API De Ranking | Execute | Done |
| RANK-06 | Proteger API De Ranking | Execute | Done |
| RANK-07 | Ordenacao Controlada | Execute | Done |
| RANK-08 | Estados vazios e parametros de pagina | Execute | Done |

**Coverage:** 8 total, 8 implemented and verified.

---

## Implemented Decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Unidade exibida como "formularios feitos" | Usar quantidade de `SimulationAttempt` com status `COMPLETED`. | No dominio atual, cada simulado finalizado equivale ao formulario feito pelo estudante. |
| Base do percentual global | `sum(correctCount) / sum(totalQuestions) * 100`. | Mantem questoes nao respondidas como incorretas, igual ao fluxo atual de finalizacao. |
| Estudantes sem tentativa finalizada | Excluir do ranking MVP. | Ranking mede desempenho observado; incluir todos exigiria left join e regras de posicao com zero atividade. |
| Dificuldade ausente | Peso medio 2. | O enum atual exige dificuldade, mas a regra do usuario cita "sem dificuldade"; a spec preserva compatibilidade futura/legado. |
| Biblioteca "react-table" | Usar `@tanstack/react-table` v8. | E o pacote atual do React Table/TanStack Table e suporta paginacao manual no servidor. |

## Success Criteria

- [x] Professor acessa ranking em `/app/professor/ranking` e ve tabela paginada.
- [x] Ranking ordena estudantes por pontos ponderados desc com desempate estavel.
- [x] Backend pagina com `page`, `pageSize`, `rowCount` e nao retorna todos os estudantes.
- [x] Frontend usa `@tanstack/react-table` com paginacao manual.
- [x] Testes unitarios cobrem pesos, percentuais e parametros de consulta.
- [x] E2E cobre acesso do professor, tabela preenchida e bloqueio para estudante.
