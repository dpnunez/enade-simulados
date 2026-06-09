# Student Simulated Exams Specification

## Problem Statement

Estudantes precisam gerar simulados personalizados a partir das grandes areas disponíveis, responder as questões sorteadas e consultar historicamente seus resultados. O sistema deve persistir tentativas e respostas para permitir revisão questão a questão e preparar o domínio para pontuação/ranking futuro, sem implementar ranking nesta fase.

## Goals

- [x] Permitir que um `STUDENT` gere um simulado informando grandes areas e quantidade de questões.
- [x] Sortear questões somente das grandes areas selecionadas, com distribuição balanceada de dificuldade quando houver banco suficiente.
- [x] Permitir que o estudante responda o simulado e receba correção persistida.
- [x] Permitir consulta de simulados antigos com acertos, erros, alternativa escolhida e alternativa correta.
- [x] Persistir pontuação agregada da tentativa para ranking futuro, sem tela ou regra de ranking neste escopo.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Ranking/leaderboard entre alunos | O usuário marcou explicitamente como fora do escopo desta spec. |
| Tempo cronometrado, limite de duração ou auto-submit | Não foi solicitado no primeiro fluxo. |
| Repetição controlada por desempenho ou recomendação adaptativa | Exige regras pedagógicas adicionais. |
| Snapshot completo de enunciados e alternativas | Primeira versão referencia o catálogo de questões; snapshots mínimos de resposta protegem revisão básica. |
| Simulados públicos criados por professores | Esta feature é de geração individual pelo estudante. |
| Questões discursivas | O modelo atual de questões é de alternativas com uma correta. |

---

## User Stories

### P1: Gerar Simulado Personalizado ⭐ MVP

**User Story**: Como estudante, quero escolher grandes areas e quantidade de questões para gerar um simulado adequado ao que quero estudar.

**Why P1**: É a entrada principal da funcionalidade e define o conjunto de questões da tentativa.

**Acceptance Criteria**:

1. WHEN um estudante acessa a página de geração THEN o sistema SHALL exigir role `STUDENT`.
2. WHEN a página carrega THEN o sistema SHALL listar grandes areas que possuem pelo menos uma questão disponível.
3. WHEN o estudante informa ao menos uma grande area e uma quantidade válida THEN o sistema SHALL criar uma tentativa de simulado com questões sorteadas apenas das grandes areas selecionadas.
4. WHEN não houver questões suficientes para a quantidade solicitada THEN o sistema SHALL bloquear a criação e informar a quantidade disponível para o filtro escolhido.
5. WHEN as questões são sorteadas THEN o sistema SHALL balancear dificuldade entre `EASY`, `MEDIUM` e `HARD` conforme disponibilidade.

**Independent Test**: Logar como `student@enade.local`, selecionar grandes areas, pedir um número válido de questões e ver a tela de resposta criada.

---

### P1: Responder e Finalizar Simulado ⭐ MVP

**User Story**: Como estudante, quero responder cada questão do simulado e finalizar para ver minha correção.

**Why P1**: Sem submissão e correção não existe resultado histórico útil.

**Acceptance Criteria**:

1. WHEN o estudante abre uma tentativa própria em andamento THEN o sistema SHALL mostrar as questões sorteadas com alternativas ordenadas.
2. WHEN o estudante está respondendo uma tentativa THEN o sistema SHALL permitir navegar livremente entre questões, sem exigir resposta na ordem sorteada.
3. WHEN o estudante seleciona alternativas e salva/finaliza THEN o sistema SHALL persistir uma resposta por questão respondida, independentemente da ordem de navegação.
4. WHEN a tentativa é finalizada THEN o sistema SHALL calcular `correctCount`, `wrongCount`, `answeredCount`, `totalQuestions` e `scorePercent`.
5. WHEN uma resposta é corrigida THEN o sistema SHALL comparar a alternativa escolhida com a alternativa correta persistida no catálogo.
6. WHEN a tentativa está em andamento THEN o sistema SHALL NOT enviar ao frontend, incluindo HTML inicial, dados de Server Component, JSON de APIs ou responses de network, qualquer campo que revele alternativa correta (`isCorrect`, `correctAlternativeId`, `correctAnswerExplanation` ou equivalente).
7. WHEN uma tentativa já finalizada recebe nova submissão THEN o sistema SHALL rejeitar a alteração.

**Independent Test**: Responder um simulado conhecido e conferir que o resumo mostra acertos/erros esperados.

---

### P1: Consultar Histórico de Simulados ⭐ MVP

**User Story**: Como estudante, quero consultar simulados antigos para revisar o que acertei e errei.

**Why P1**: O requisito de histórico é explícito e justifica a persistência por resposta.

**Acceptance Criteria**:

1. WHEN o estudante acessa a página de histórico THEN o sistema SHALL listar apenas simulados do próprio estudante.
2. WHEN o estudante abre um simulado finalizado THEN o sistema SHALL mostrar questão a questão, alternativa escolhida, alternativa correta e status de acerto/erro.
3. WHEN o estudante não respondeu uma questão antes de finalizar THEN o sistema SHALL mostrá-la como não respondida/incorreta.
4. WHEN outro estudante tenta acessar uma tentativa que não é dele THEN o sistema SHALL negar acesso.

**Independent Test**: Finalizar um simulado e abrir a página de detalhes no histórico, verificando acerto e erro por questão.

---

### P2: Continuar Tentativa em Andamento

**User Story**: Como estudante, quero voltar a uma tentativa ainda não finalizada para terminar depois.

**Why P2**: É útil, mas não precisa bloquear o MVP se o fluxo inicial optar por finalizar em uma sessão.

**Acceptance Criteria**:

1. WHEN uma tentativa está `IN_PROGRESS` THEN o sistema SHALL permitir reabrir a tentativa pelo histórico.
2. WHEN respostas parciais são salvas THEN o sistema SHALL preservar escolhas já feitas.

**Independent Test**: Criar uma tentativa, salvar respostas parciais, sair e voltar vendo as escolhas preservadas.

---

## Edge Cases

- WHEN a quantidade solicitada for menor que 1 THEN o sistema SHALL exibir erro de validação.
- WHEN a quantidade solicitada exceder o limite operacional configurado THEN o sistema SHALL exibir erro de validação.
- WHEN nenhuma grande area for selecionada THEN o sistema SHALL exibir erro de validação.
- WHEN uma grande area selecionada for removida ou ficar sem questões antes da criação THEN o sistema SHALL revalidar no servidor e bloquear a tentativa.
- WHEN uma questão sorteada for removida após a tentativa THEN o sistema SHALL preservar a relação histórica da tentativa; a revisão pode sinalizar questão indisponível se o catálogo não puder ser carregado.
- WHEN uma alternativa escolhida não pertencer à questão da tentativa THEN o sistema SHALL rejeitar a submissão.
- WHEN houver empate ou falta de questões em uma dificuldade THEN o sistema SHALL redistribuir as vagas restantes entre dificuldades disponíveis.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SIM-01 | Gerar Simulado Personalizado | Implementation | Verified |
| SIM-02 | Gerar Simulado Personalizado | Implementation | Verified |
| SIM-03 | Gerar Simulado Personalizado | Implementation | Verified |
| SIM-04 | Responder e Finalizar Simulado | Implementation | Verified |
| SIM-05 | Responder e Finalizar Simulado | Implementation | Verified |
| SIM-06 | Consultar Histórico de Simulados | Implementation | Verified |
| SIM-07 | Consultar Histórico de Simulados | Implementation | Verified |
| SIM-08 | Continuar Tentativa em Andamento | Implementation | Verified |
| SIM-09 | Autorização e isolamento por estudante | Implementation | Verified |
| SIM-10 | Pontuação agregada para ranking futuro | Implementation | Verified |
| SIM-11 | Navegação livre entre questões da tentativa | Implementation | Verified |
| SIM-12 | Não vazar resposta correta antes da finalização | Implementation | Verified |

**Coverage:** 12 total, 12 verified in implementation, 0 unmapped.

---

## Assumed Decisions for Draft

| Topic | Draft Decision | Why |
| --- | --- | --- |
| Attempt persistence | Criar tentativa no momento da geração, antes de responder. | Garante histórico do sorteio e permite retomar tentativa. |
| Answer persistence | Persistir uma linha por questão respondida. | É a forma relacional normal para histórico auditável, correção e ranking futuro. |
| Question selection | Referenciar `Question.id` em vez de copiar enunciado/alternativas completas. | Evita duplicação pesada; snapshots mínimos podem ser adicionados depois se auditoria imutável for exigida. |
| Scoring | Percentual simples por acertos: `correctCount / totalQuestions * 100`. | Suficiente para ranking futuro, sem criar ranking agora. |
| Max questions | Limite operacional inicial de 100 por simulado. | Evita payloads/telas gigantes; pode ser ajustado. |

## Success Criteria

- [x] Estudante gera um simulado com filtros válidos em menos de 1 minuto.
- [x] Sistema nunca sorteia questão fora das grandes areas selecionadas.
- [x] Finalização calcula e persiste acertos, erros e percentual.
- [x] Tentativas em andamento nunca expõem resposta correta no HTML, Server Component payload, JSON de API ou responses de network.
- [x] Histórico mostra apenas simulados do estudante autenticado.
- [x] Testes cobrem sorteio balanceado, autorização, submissão e revisão histórica.
