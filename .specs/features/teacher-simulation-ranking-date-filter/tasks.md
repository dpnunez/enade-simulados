# Teacher Simulation Ranking Date Filter Tasks

**Design**: `.specs/features/teacher-simulation-ranking-date-filter/design.md`
**Status**: Draft

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4 -> T5
```

Nao ha tarefas paralelas: a cadeia de contrato/servico e direta e o E2E usa um unico PostgreSQL compartilhado.

### T1: Extend ranking date-query schema and unit coverage

**What**: Adicionar limites ISO opcionais e validacao de intervalo ao schema, incluindo contrato reutilizavel pelo formulario.
**Where**: `src/features/simulation-ranking/simulation-ranking.schema.ts`, `src/features/simulation-ranking/simulation-ranking.schema.test.ts`
**Depends on**: None
**Reuses**: Defaults atuais, Zod 4.4.3 e estilo de testes colocados.
**Requirement**: RANK-DATE-01, RANK-DATE-03

**Tools**: filesystem; skills `tlc-spec-driven`, `codenavi`.

**Done when**:

- [ ] Sem datas preserva os defaults atuais.
- [ ] Strings vazias de ambos os campos sao normalizadas para ausencia de filtro, sem erro de validacao.
- [ ] Limites individuais e um intervalo fechado valido fazem parse.
- [ ] Formato invalido e `startDate > endDate` falham antes do banco.
- [ ] Ha pelo menos quatro casos de data novos sem remover os seis casos atuais.
- [ ] `pnpm test:unit` passa.

**Tests**: unit
**Gate**: quick (`pnpm test:unit`)
**Commit**: `feat(ranking): validate date range query`

### T2: Apply one validated period to aggregation and count

**What**: Construir fragmento SQL parametrizado de `completedAt` e reutiliza-lo nas consultas de ranking e `rowCount`.
**Where**: `src/features/simulation-ranking/simulation-ranking.service.ts`, `src/features/simulation-ranking/simulation-ranking.service.test.ts`
**Depends on**: T1
**Reuses**: `rankingBaseSql()`, `Prisma.sql`, score materializado e testes de inspecao SQL.
**Requirement**: RANK-DATE-01, RANK-DATE-02, RANK-DATE-05

**Tools**: filesystem; skills `tlc-spec-driven`, `codenavi`.

**Done when**:

- [ ] Intervalo fechado aparece nas duas consultas.
- [ ] Intervalos abertos usam somente o limite informado.
- [ ] O limite superior e exclusivo no dia posterior, incluindo o ultimo dia solicitado.
- [ ] Chamada sem datas preserva o comportamento historico.
- [ ] Quando os dois limites estiverem ausentes, o fragmento SQL de data nao e incluido.
- [ ] Ha ao menos tres casos unitarios novos sem remover os quatro atuais.
- [ ] `pnpm test:unit` passa.

**Tests**: unit
**Gate**: quick (`pnpm test:unit`)
**Commit**: `feat(ranking): filter aggregates by completion date`

### T3: Add completion-date ranking index migration

**What**: Criar e validar migration nao destrutiva do indice composto usado pelo ranking por periodo.
**Where**: nova `prisma/migrations/*_simulation_ranking_completed_at_index/migration.sql`
**Depends on**: T2
**Reuses**: Migration `SimulationAttempt_status_studentId_idx` e fluxo `e2e:prepare`.
**Requirement**: RANK-DATE-05

**Tools**: filesystem; skills `tlc-spec-driven`, `codenavi`.

**Done when**:

- [ ] A migration somente cria o indice confirmado, sem backfill nem mudanca do modelo Prisma.
- [ ] `EXPLAIN` demonstra elegibilidade do indice para predicado status/data, ou documenta ordenacao melhor comprovada pelo planner.
- [ ] `pnpm e2e:prepare`, `pnpm prisma:generate` e `pnpm build` passam.

**Tests**: build plus E2E database preparation
**Gate**: build (`pnpm build`)
**Commit**: `perf(ranking): index completed attempts by date`

### T4: Add date-filter form and browser coverage

**What**: Adicionar formulario RHF/Zod, aplicar/limpar, integracao de query e fixture/spec E2E deterministicas.
**Where**: `src/app/app/professor/ranking/_components/ranking-table.tsx`, `src/tests/e2e/helpers/simulation-ranking.ts`, `src/tests/e2e/teacher-simulation-ranking.spec.ts`
**Depends on**: T3
**Reuses**: `Input`, `Field`, `Button`, `Alert`, `AbortController`, paginacao e fixture atuais.
**Requirement**: RANK-DATE-01, RANK-DATE-02, RANK-DATE-03, RANK-DATE-04

**Tools**: filesystem; skills `tlc-spec-driven`, `codenavi`, `shadcn`.

**Done when**:

- [ ] Controles possuem labels acessiveis e usam RHF + Zod resolver.
- [ ] Aplicar os dois campos vazios envia o ranking sem parametros de data e mantem o comportamento historico.
- [ ] Intervalo invertido mostra erro e nao chama fetch.
- [ ] Aplicar volta a pagina um, preserva sort e propaga datas em paginacao/ordenacao.
- [ ] Limpar restaura o historico e preserva sort.
- [ ] Fixture cria tentativas antes/dentro/depois; E2E prova o recorte, limites na URL e limpar.
- [ ] A spec cresce de dois para pelo menos tres casos sem perder autorizacao.
- [ ] `pnpm test:e2e` passa.

**Tests**: E2E
**Gate**: E2E (`pnpm test:e2e`)
**Commit**: `feat(ranking): filter by completion date`

### T5: Run final regression gate

**What**: Executar os gates completos e corrigir apenas regressao comprovadamente ligada a feature.
**Where**: Nenhum arquivo esperado, salvo correcao de regressao escopada.
**Depends on**: T4
**Reuses**: Scripts de testes e banco E2E deterministico.
**Requirement**: RANK-DATE-01, RANK-DATE-02, RANK-DATE-03, RANK-DATE-04, RANK-DATE-05

**Tools**: filesystem; skill `tlc-spec-driven`.

**Done when**:

- [ ] `pnpm test` passa sem excluir testes de data.
- [ ] `pnpm build` passa, ou o bloqueio conhecido de `next/font` e registrado de modo isolado.
- [ ] Cobertura existente de autorizacao e paginacao continua presente.

**Tests**: full
**Gate**: full (`pnpm test`)
**Commit**: nenhum, exceto correcao escopada

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Um contrato de schema + testes colocados | ✅ Granular |
| T2 | Um comportamento de service + testes colocados | ✅ Granular |
| T3 | Uma migration | ✅ Granular |
| T4 | Uma interacao de rota com fixture/spec E2E indispensaveis | ✅ Coesa |
| T5 | Um gate de regressao | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Entrada | ✅ Match |
| T2 | T1 | `T1 -> T2` | ✅ Match |
| T3 | T2 | `T2 -> T3` | ✅ Match |
| T4 | T3 | `T3 -> T4` | ✅ Match |
| T5 | T4 | `T4 -> T5` | ✅ Match |

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Feature schema | Unit | Unit | ✅ OK |
| T2 | Feature service | Unit | Unit | ✅ OK |
| T3 | Prisma migration | Build + E2E prep | Build + E2E prep | ✅ OK |
| T4 | Visible App Router behavior | E2E | E2E | ✅ OK |
| T5 | Integrated feature | Full | Full | ✅ OK |

## Tools for Execution

Usar filesystem/terminal, `codenavi` para navegacao precisa, `shadcn` para as convencoes do formulario e `tlc-spec-driven` para rastrear a execucao. Nenhum MCP ou plugin externo e necessario.
