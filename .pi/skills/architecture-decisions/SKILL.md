---
name: architecture-decisions
description: Registra decisões novas de arquitetura, stack ou bibliotecas no AGENTS.md do projeto. Use sempre que escolher, trocar ou consolidar tecnologias, padrões estruturais ou dependências relevantes.
---

# Architecture Decisions

Use esta skill sempre que houver uma nova decisão relevante sobre arquitetura ou bibliotecas do projeto.

## O que conta como decisão relevante

Atualize `./AGENTS.md` quando houver definição, troca ou descarte de itens como:
- framework principal;
- biblioteca de UI relevante;
- autenticação/autorização;
- ORM, banco de dados e migrações;
- armazenamento de arquivos;
- bibliotecas de formulários/validação;
- estratégia de testes;
- mensageria, filas, cache;
- hospedagem/deploy/observabilidade;
- convenções estruturais que afetem o projeto.

## Procedimento

1. Leia `./AGENTS.md` antes de editar.
2. Procure a seção `## Decisões de arquitetura e bibliotecas`.
3. Se não existir, crie a seção perto do final do arquivo.
4. Adicione ou atualize entradas curtas e objetivas.
5. Registre apenas decisões já tomadas, não hipóteses soltas.
6. Se a decisão ainda estiver incerta, marque explicitamente como `Em avaliação`.

## Formato recomendado

Use bullets com este padrão:

```md
- YYYY-MM-DD — Decisão: <o que foi escolhido>. Contexto/impacto: <por que importa no projeto>.
```

Se houver comparação importante, acrescente uma sub-bullet curta:

```md
  - Alternativas consideradas: <lista curta>.
```

## Regras

- Seja conciso.
- Não transforme `AGENTS.md` em changelog completo.
- Prefira registrar decisões duráveis, não detalhes triviais de implementação.
- Ao substituir uma decisão anterior, atualize a entrada antiga ou acrescente uma nova deixando a substituição explícita.
- Preserve as demais instruções existentes no `AGENTS.md`.

## Exemplo

```md
## Decisões de arquitetura e bibliotecas
- 2026-05-15 — Decisão: usar Next.js como framework web principal. Contexto/impacto: centraliza frontend e rotas do MVP em uma única aplicação.
- 2026-05-15 — Decisão: usar Prisma com PostgreSQL. Contexto/impacto: simplifica modelagem inicial de usuários, matérias, questões e tentativas.
  - Alternativas consideradas: Drizzle, Sequelize.
```
