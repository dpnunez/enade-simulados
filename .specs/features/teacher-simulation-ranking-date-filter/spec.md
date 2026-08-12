# Teacher Simulation Ranking Date Filter Specification

## Problem Statement

O ranking acumula todas as tentativas finalizadas desde o inicio da plataforma. Professores precisam restringir a analise a um periodo, sem alterar a pontuacao ponderada existente.

## Goals

- [ ] Filtrar o ranking por data inicial e/ou final de conclusao.
- [ ] Calcular linhas, metricas, posicao e paginacao somente com o periodo aplicado.
- [ ] Preservar o ranking historico quando nao houver datas.
- [ ] Manter eficiencia para consultas por periodo.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Data de inicio da tentativa | O resultado se torna definitivo na finalizacao. |
| Filtros por grande area, aluno ou professor | Sao recortes analiticos distintos. |
| Presets de semana/mes/semestre | Campos de data resolvem o escopo atual. |
| Exportacao | Nao pertence a consulta em tela. |
| Alterar pesos ou metricas | Esta mudanca apenas recorta o periodo. |

---

## User Stories

### P1: Filtrar ranking por periodo ⭐ MVP

**User Story**: Como professor, quero informar uma data inicial e/ou final para ver o ranking formado somente pelos simulados concluidos nesse periodo.

**Why P1**: E a entrega solicitada para analises por avaliacao, mes ou janela academica.

**Acceptance Criteria**:

1. WHEN o professor informar uma data inicial e aplicar THEN o sistema SHALL incluir tentativas `COMPLETED` com `completedAt` a partir do inicio desse dia.
2. WHEN o professor informar uma data final e aplicar THEN o sistema SHALL incluir tentativas `COMPLETED` concluidas ate o fim desse dia.
3. WHEN ambas as datas forem aplicadas THEN o sistema SHALL usar a intersecao inclusiva do intervalo.
4. WHEN ambos os campos de data estiverem vazios THEN o sistema SHALL normaliza-los como ausencia de filtro e manter o ranking historico atual.
5. WHEN um intervalo for aplicado THEN o sistema SHALL voltar a primeira pagina, preservar a ordenacao e atualizar linhas, metricas, posicoes e total com o mesmo recorte.

**Independent Test**: Criar tentativas antes, dentro e depois de um intervalo; aplicar o periodo e confirmar que somente dados internos aparecem.

---

### P1: Validar intervalo de datas ⭐ MVP

**User Story**: Como professor, quero receber feedback claro quando o intervalo for invalido para corrigi-lo antes de consultar o ranking.

**Why P1**: Impede resultados silenciosamente incorretos e parametros invalidos na consulta SQL.

**Acceptance Criteria**:

1. WHEN a data inicial for posterior a final THEN a interface SHALL informar o erro e nao solicitar o ranking.
2. WHEN a API receber datas fora de `YYYY-MM-DD` ou intervalo invertido THEN ela SHALL retornar `400` com `VALIDATION_ERROR`.
3. WHEN somente uma extremidade valida for informada THEN a API SHALL aceitar o filtro aberto.

**Independent Test**: Informar inicio posterior ao fim e verificar erro; chamar a API autenticada com intervalo invertido e verificar `400`.

---

### P2: Limpar filtro aplicado

**User Story**: Como professor, quero limpar o periodo aplicado para retornar ao ranking historico.

**Acceptance Criteria**:

1. WHEN houver uma data aplicada e o professor limpar THEN o sistema SHALL remover ambas as datas, voltar a primeira pagina e recarregar sem recorte temporal.
2. WHEN nenhuma data estiver aplicada THEN limpar SHALL ser inofensivo e preservar a ordenacao.

**Independent Test**: Aplicar um periodo que exclua linhas, limpar e verificar o retorno das linhas historicas.

---

## Edge Cases

- WHEN tentativa `COMPLETED` tiver `completedAt` nulo por legado THEN ela SHALL ser excluida de consultas com filtro de data; sem filtros, o comportamento historico e preservado.
- WHEN o professor enviar campos de data vazios THEN o sistema SHALL trata-los como `undefined`, e nao como uma data invalida ou um intervalo vazio.
- WHEN o periodo nao tiver tentativas THEN o sistema SHALL mostrar o estado vazio atual, sem erro.
- WHEN inicio e fim forem a mesma data THEN o sistema SHALL considerar todo aquele dia.
- WHEN pagina, tamanho ou ordenacao mudarem com filtro ativo THEN o sistema SHALL preservar o intervalo em todas as requisicoes.
- WHEN uma resposta anterior terminar depois de um novo filtro THEN a tabela SHALL descarta-la com o `AbortController` existente.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RANK-DATE-01 | P1: Filtrar ranking por periodo | Tasks | Pending |
| RANK-DATE-02 | P1: Filtrar ranking por periodo | Tasks | Pending |
| RANK-DATE-03 | P1: Validar intervalo de datas | Tasks | Pending |
| RANK-DATE-04 | P2: Limpar filtro aplicado | Tasks | Pending |
| RANK-DATE-05 | P1: Filtrar ranking por periodo | Tasks | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] O professor aplica, combina e limpa datas sem perder ordenacao indevidamente.
- [ ] Pontos, metricas, total, paginas e posicao usam exatamente o mesmo intervalo.
- [ ] Consultas invalidas nao chegam ao banco.
- [ ] A consulta filtrada recebe suporte de indice adequado.
- [ ] Testes unitarios e E2E provam limites e fluxo principal.
