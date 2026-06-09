# Simulation Answer Drafts Specification

## Problem Statement

Estudantes precisam salvar respostas de uma tentativa de simulado em andamento sem finalizar o simulado nem receber avaliacao. Hoje a tela consegue reidratar respostas ja persistidas, mas a unica mutacao disponivel tambem corrige e marca a tentativa como `COMPLETED`, acoplando persistencia parcial a avaliacao final.

## Goals

- [ ] Permitir que um `STUDENT` salve escolhas parciais em uma tentativa `IN_PROGRESS`.
- [ ] Manter a tentativa em andamento apos salvar respostas.
- [ ] Garantir que salvar respostas nao calcule acertos, erros, percentual nem exponha resposta correta.
- [ ] Permitir que respostas salvas sejam reabertas pelo estudante e usadas posteriormente na finalizacao.
- [ ] Cobrir o fluxo com testes de service/schema e E2E do navegador.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Autosave em tempo real com debounce | Pode ser adicionado depois; o primeiro incremento deve priorizar contrato seguro e persistencia confiavel. |
| Respostas discursivas | O dominio atual de questoes e alternativas objetivas. |
| Timer, expiracao ou auto-submit | Nao faz parte do requisito de salvar rascunho. |
| Sincronizacao offline/localStorage | Exige uma estrategia separada de conflitos e recuperacao local. |
| Revisao/correcao antes de finalizar | Contraria o objetivo principal de salvar sem avaliar. |

---

## User Stories

### P1: Salvar Respostas Sem Finalizar ⭐ MVP

**User Story**: Como estudante, quero salvar as respostas que ja marquei em um simulado em andamento para continuar depois sem finalizar minha avaliacao.

**Why P1**: E o requisito central: persistencia parcial sem submissao para correcao.

**Acceptance Criteria**:

1. WHEN o estudante seleciona uma ou mais alternativas em uma tentativa `IN_PROGRESS` e aciona salvar THEN o sistema SHALL persistir uma resposta por questao respondida.
2. WHEN respostas sao salvas THEN o sistema SHALL manter `SimulationAttempt.status` como `IN_PROGRESS`.
3. WHEN respostas sao salvas THEN o sistema SHALL atualizar `answeredCount` para refletir a quantidade de questoes respondidas salvas.
4. WHEN respostas sao salvas THEN o sistema SHALL NOT preencher ou retornar resultado de avaliacao, incluindo `correctCount`, `wrongCount`, `scorePercent`, `isCorrect`, `correctAlternativeId` ou explicacao da resposta correta.
5. WHEN o estudante reabre a tentativa THEN o sistema SHALL marcar novamente as alternativas previamente salvas.

**Independent Test**: Logar como `student@enade.local`, gerar um simulado, marcar respostas, salvar, voltar ao historico, reabrir a tentativa e ver as escolhas preservadas com status "Em andamento".

---

### P1: Finalizar Usando Respostas Salvas ⭐ MVP

**User Story**: Como estudante, quero finalizar depois um simulado que ja tinha respostas salvas para receber a correcao final considerando minhas escolhas atuais.

**Why P1**: O rascunho so e util se alimentar corretamente o fluxo existente de finalizacao.

**Acceptance Criteria**:

1. WHEN uma tentativa possui respostas salvas e o estudante aciona finalizar THEN o sistema SHALL corrigir as respostas atuais da tentativa.
2. WHEN a finalizacao recebe respostas no payload THEN o sistema SHALL usar esse payload como estado final da tentativa.
3. WHEN a finalizacao recebe payload vazio ou incompleto THEN o sistema SHALL preservar/corrigir respostas ja salvas para questoes ausentes no payload.
4. WHEN a tentativa e finalizada THEN o sistema SHALL preencher `correctAlternativeId`, `isCorrect`, `correctCount`, `wrongCount`, `scorePercent`, `answeredCount` e `completedAt`.
5. WHEN a tentativa ja esta `COMPLETED` THEN o sistema SHALL rejeitar qualquer tentativa de salvar rascunho ou alterar respostas.

**Independent Test**: Salvar uma resposta parcial, recarregar a pagina, finalizar e verificar que a revisao mostra a alternativa salva e a pontuacao esperada.

---

### P2: Feedback De Salvamento

**User Story**: Como estudante, quero saber quando minhas respostas foram salvas para confiar que posso sair e voltar depois.

**Why P2**: Melhora a confianca do fluxo, mas nao deve complicar o contrato de dominio.

**Acceptance Criteria**:

1. WHEN o salvamento termina com sucesso THEN a UI SHALL mostrar um estado discreto de sucesso ou timestamp textual curto.
2. WHEN o salvamento falha THEN a UI SHALL manter selecoes locais e mostrar uma mensagem de erro acionavel.
3. WHEN o estudante muda uma resposta apos salvar THEN a UI SHALL indicar que ha alteracoes ainda nao salvas.

**Independent Test**: Marcar resposta, salvar, ver feedback de sucesso; alterar resposta, ver estado pendente; simular erro de API em teste unitario/componente se houver cobertura local.

---

## Edge Cases

- WHEN uma alternativa salva nao pertence a questao da tentativa THEN o sistema SHALL rejeitar a mutacao com `SIMULATION_INVALID_ANSWER`.
- WHEN uma questao informada nao pertence a tentativa THEN o sistema SHALL rejeitar a mutacao com `SIMULATION_INVALID_ANSWER`.
- WHEN o estudante remove uma resposta local antes de salvar THEN o contrato MVP SHALL decidir entre ignorar ausencia ou suportar remocao explicita; este plano assume ausencia como "nao alterar" e deixa remocao explicita fora do MVP.
- WHEN outro estudante tenta salvar respostas de uma tentativa que nao e dele THEN o sistema SHALL retornar tentativa nao encontrada/nao autorizada sem vazar existencia.
- WHEN usuario sem role `STUDENT` chama a API THEN o sistema SHALL retornar `401` e nao mutar dados.
- WHEN o payload contem respostas duplicadas para a mesma questao THEN o schema SHALL rejeitar a entrada.
- WHEN uma tentativa `COMPLETED` recebe salvamento parcial THEN o sistema SHALL rejeitar com erro de tentativa ja finalizada.
- WHEN a tentativa esta `IN_PROGRESS` THEN qualquer HTML, Server Component payload, JSON de API ou network response SHALL continuar sem campos de resposta correta.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DRAFT-01 | Salvar Respostas Sem Finalizar | Tasks | Pending |
| DRAFT-02 | Salvar Respostas Sem Finalizar | Tasks | Pending |
| DRAFT-03 | Salvar Respostas Sem Finalizar | Tasks | Pending |
| DRAFT-04 | Salvar Respostas Sem Finalizar | Tasks | Pending |
| DRAFT-05 | Finalizar Usando Respostas Salvas | Tasks | Pending |
| DRAFT-06 | Finalizar Usando Respostas Salvas | Tasks | Pending |
| DRAFT-07 | Feedback De Salvamento | Tasks | Pending |
| DRAFT-08 | Autorizacao e isolamento por estudante | Tasks | Pending |
| DRAFT-09 | Validacao de respostas e alternativas | Tasks | Pending |
| DRAFT-10 | Bloqueio de edicao apos finalizacao | Tasks | Pending |

**Coverage:** 10 total, 10 mapped to tasks, 10 pending.

---

## Success Criteria

- [ ] Estudante consegue salvar respostas em uma tentativa em andamento e sair da pagina sem finalizar.
- [ ] Reabrir a tentativa mostra as respostas salvas e mantem o status "Em andamento".
- [ ] Salvar respostas nao revela campos de correcao em HTML, Server Component payload, JSON de API ou responses de network.
- [ ] Finalizar depois de salvar calcula a correcao com as respostas salvas/atuais.
- [ ] Testes unitarios e E2E cobrem salvamento parcial, bloqueio apos finalizacao e ausencia de vazamento de resposta correta.
