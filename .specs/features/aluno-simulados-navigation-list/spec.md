# Organização das Telas de Aluno e Lista de Simulados

## Problem Statement

As telas logadas do estudante ainda usam o segmento `/app/student`, enquanto o restante da aplicação já usa vocabulário em português para papéis visíveis, como `/app/professor`. A tela atual de histórico também mistura conceito de revisão com listagem simples, sem paginação, sem tabela e sem ação clara para retomar simulados em andamento.

## Goals

- [x] Tornar `/app/aluno` o prefixo canônico das telas logadas do estudante sem quebrar links antigos.
- [x] Renomear a tela de histórico para "Lista de simulados" e disponibilizá-la em `/app/aluno/lista-simulados`.
- [x] Fazer a listagem com React Query e TanStack React Table, consumindo uma API paginada.
- [x] Mostrar datas/horários de início e finalização, status, progresso e ação clara para retomar simulados em andamento.
- [x] Melhorar a tela de geração de simulado com ajustes leves de ergonomia, sem ampliar o domínio.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Renomear role `STUDENT` no banco/auth | O pedido é sobre telas/rotas logadas, não autorização interna. |
| Recriar fluxo de resposta/correção | O fluxo já existe, tem DTOs seguros e testes E2E. |
| Filtros avançados por área, score ou período | Não foi pedido; pode vir depois sobre a tabela paginada. |
| Migração completa das APIs `/api/student/*` para `/api/aluno/*` | O pedido menciona prefixo das telas. Manter API atual reduz risco; pode-se criar alias depois se virar requisito. |

---

## User Stories

### P1: Navegação de Aluno em Português ⭐ MVP

**User Story**: Como aluno, quero acessar minha área logada por URLs em português para que a aplicação tenha vocabulário consistente.

**Why P1**: É o requisito base e afeta sidebar, redirects, testes e links internos.

**Acceptance Criteria**:

1. WHEN um aluno autenticado acessa `/app/aluno` THEN o sistema SHALL exibir a página inicial do aluno.
2. WHEN um aluno autenticado usa a sidebar THEN os links de aluno SHALL apontar para `/app/aluno/...`.
3. WHEN alguém acessa uma URL antiga `/app/student...` THEN o sistema SHALL redirecionar para a URL equivalente em `/app/aluno...`.
4. WHEN professor ou admin tenta acessar telas de aluno THEN o sistema SHALL manter o bloqueio por `STUDENT` e redirecionar para o home correto.

**Independent Test**: Logar como `student@enade.local`, navegar pela sidebar e confirmar URLs `/app/aluno/...`; acessar `/app/student/simulados` e ver redirect para `/app/aluno/lista-simulados`.

---

### P1: Lista de Simulados Paginada ⭐ MVP

**User Story**: Como aluno, quero uma lista paginada dos meus simulados para encontrar tentativas recentes e retomar as pendentes com clareza.

**Why P1**: Substitui o histórico atual e atende a exigência de React Query + React Table.

**Acceptance Criteria**:

1. WHEN o aluno acessa `/app/aluno/lista-simulados` THEN o sistema SHALL renderizar uma tela chamada "Lista de simulados".
2. WHEN a tabela carrega THEN o sistema SHALL buscar dados via React Query em uma API `GET` paginada.
3. WHEN a API recebe `page` e `pageSize` THEN o sistema SHALL retornar `rows`, `rowCount`, `page`, `pageSize` e `pageCount`.
4. WHEN a tabela renderiza THEN o sistema SHALL usar TanStack React Table com `manualPagination`.
5. WHEN uma tentativa aparece na lista THEN o sistema SHALL mostrar início com data e horário, finalização com data e horário ou vazio textual para em andamento, status, questões/progresso, áreas e resultado quando houver.
6. WHEN uma tentativa está `IN_PROGRESS` THEN a linha SHALL exibir um botão de ação claro para retornar e finalizar o simulado.
7. WHEN uma tentativa está `COMPLETED` THEN a linha SHALL exibir ação de revisar resultado.
8. WHEN o aluno não tem simulados THEN o sistema SHALL mostrar estado vazio com ação para gerar novo simulado.

**Independent Test**: Criar tentativa em andamento e tentativa finalizada, acessar `/app/aluno/lista-simulados`, validar colunas, paginação e botão "Retomar e finalizar".

---

### P1: API de Listagem Segura e Paginada ⭐ MVP

**User Story**: Como sistema, quero listar simulados por aluno no backend para evitar carregar todo o histórico no navegador e manter isolamento por usuário.

**Why P1**: A tabela precisa de dados paginados e a segurança deve continuar no servidor.

**Acceptance Criteria**:

1. WHEN a API de listagem é chamada sem sessão `STUDENT` THEN o sistema SHALL retornar `401`.
2. WHEN a API de listagem é chamada por aluno autenticado THEN o sistema SHALL retornar apenas tentativas desse aluno.
3. WHEN `page` ou `pageSize` são inválidos THEN o sistema SHALL retornar `400` com `VALIDATION_ERROR`.
4. WHEN existem muitas tentativas THEN o sistema SHALL usar `skip/take` ou equivalente no banco, não paginação em memória.
5. WHEN a resposta inclui tentativas em andamento THEN o sistema SHALL NOT incluir alternativas, respostas corretas ou payload de questões.

**Independent Test**: Teste unitário do service valida paginação/contagem; E2E valida isolamento e tela consumindo os dados.

---

### P2: Geração de Simulado Mais Amigável

**User Story**: Como aluno, quero configurar um simulado com feedback mais claro para entender quantas questões posso pedir e o que já selecionei.

**Why P2**: O usuário disse que a tela está legal, então a melhoria é desejável mas não deve bloquear a troca da listagem.

**Acceptance Criteria**:

1. WHEN o aluno seleciona grandes áreas THEN o sistema SHALL mostrar um resumo da quantidade disponível para a seleção.
2. WHEN o aluno informa uma quantidade acima do disponível estimado THEN a UI SHOULD orientar antes da submissão, mantendo validação confiável no servidor.
3. WHEN o aluno conclui geração THEN os redirects SHALL levar à nova URL canônica `/app/aluno/simulados/[attemptId]`.
4. WHEN o aluno quer voltar da geração THEN o link SHALL apontar para `/app/aluno/lista-simulados`.

**Independent Test**: Logar como aluno, selecionar área, ver resumo de disponibilidade e gerar simulado que abre em `/app/aluno/simulados/[attemptId]`.

---

## Edge Cases

- WHEN URL antiga `/app/student/simulados/novo` é acessada THEN redirect SHALL ir para `/app/aluno/simulados/novo`.
- WHEN URL antiga `/app/student/simulados/[attemptId]` é acessada THEN redirect SHALL preservar `attemptId`.
- WHEN URL antiga `/app/student/simulados` é acessada THEN redirect SHALL ir para `/app/aluno/lista-simulados`.
- WHEN uma página além de `pageCount` é pedida THEN API SHALL retornar lista vazia e metadados consistentes.
- WHEN `completedAt` é `null` THEN tabela SHALL mostrar "Ainda em andamento" ou equivalente, sem data falsa.
- WHEN uma tentativa em andamento já tem respostas salvas THEN ação SHALL indicar retomada, não revisão finalizada.
- WHEN React Query falha ao carregar THEN tela SHALL mostrar feedback de erro e permitir tentar novamente.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ALUNO-SIM-01 | Navegação de Aluno em Português | Execute | Done |
| ALUNO-SIM-02 | Navegação de Aluno em Português | Execute | Done |
| ALUNO-SIM-03 | Lista de Simulados Paginada | Execute | Done |
| ALUNO-SIM-04 | Lista de Simulados Paginada | Execute | Done |
| ALUNO-SIM-05 | API de Listagem Segura e Paginada | Execute | Done |
| ALUNO-SIM-06 | API de Listagem Segura e Paginada | Execute | Done |
| ALUNO-SIM-07 | Geração de Simulado Mais Amigável | Execute | Done |

**Coverage:** 7 total, 7 mapped to design/tasks, 0 unmapped.

## Success Criteria

- [x] Nenhum link da sidebar de aluno usa `/app/student`.
- [x] URLs antigas de aluno redirecionam para equivalentes em `/app/aluno`.
- [x] `/app/aluno/lista-simulados` usa React Query + TanStack React Table com paginação manual.
- [x] API de listagem pagina no banco e retorna somente simulados do aluno autenticado.
- [x] E2E principal de simulados passa atualizado para as novas rotas.
