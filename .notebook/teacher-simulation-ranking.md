# Teacher Simulation Ranking
> Ranking paginado para professores com pontuacao ponderada por dificuldade

Entry points:
- Page: `src/app/app/professor/ranking/page.tsx`
- API: `src/app/api/teacher/simulation-ranking/route.ts`
- Client table: `src/app/app/professor/ranking/_components/ranking-table.tsx`

Domain flow:
- `src/features/simulation-ranking/simulation-ranking.schema.ts` valida `page`, `pageSize`, `sort` e `direction`.
- `src/features/simulation-ranking/simulation-ranking.service.ts:listTeacherSimulationRanking()` agrega apenas `SimulationAttempt.status = COMPLETED`.
- `SimulationAttempt.weightedScore` materializa a pontuacao na finalizacao do simulado.
- A pontuacao de cada tentativa vem de respostas corretas em `SimulationAnswer.isCorrect`, usando `SimulationAttemptQuestion.difficulty`: `EASY` 1, `MEDIUM`/nulo 2, `HARD` 3.
- `src/features/simulation-ranking/simulation-ranking.service.ts:listTeacherSimulationRanking()` soma `SimulationAttempt.weightedScore`, evitando join com questoes/respostas no ranking.

Security notes:
- Page e API exigem `TEACHER`.
- O layout privado mostra o link de ranking apenas para `TEACHER`, mas a autorizacao real fica server-side.

E2E:
- `src/tests/e2e/helpers/simulation-ranking.ts` cria questoes EASY/MEDIUM/HARD, tentativas finalizadas e estudantes extras sem conta de login.
- `src/tests/e2e/teacher-simulation-ranking.spec.ts` cobre ranking preenchido, paginacao backend e bloqueio para estudante.

Gotcha:
- O percentual agregado vindo de SQL numeric pode chegar como objeto numerico via Prisma/Postgres; `numberFromDb()` precisa aceitar `toString()`, alem de `number`, `string` e `bigint`.
- A migration `20260610150000_simulation_attempt_weighted_score` faz backfill de `weightedScore` para tentativas finalizadas existentes.

Updated: 2026-06-10
