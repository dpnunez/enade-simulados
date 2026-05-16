<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Contexto técnico do projeto

## Stack atual

- Next.js 16 com React 19 e TypeScript.
- App Router (`app/`) como base da aplicação web.
- Tailwind CSS 4 para estilos.
- Prisma 7 como ORM principal.
- PostgreSQL 17 em Docker Compose para ambiente local.

## Decisões de arquitetura e bibliotecas

- Registrar aqui decisões duráveis sobre stack, arquitetura e bibliotecas relevantes do projeto.
- Formato recomendado: `YYYY-MM-DD — Decisão: <o que foi escolhido>. Contexto/impacto: <por que importa no projeto>`.
- 2026-05-15 — Decisão: usar PostgreSQL em Docker Compose como banco de dados local do projeto. Contexto/impacto: padroniza o ambiente de desenvolvimento e simplifica a subida do banco para o MVP.
- 2026-05-15 — Decisão: usar Prisma como ORM principal. Contexto/impacto: centraliza schema, geração de client e futuras migrações da aplicação.
- 2026-05-15 — Decisão: usar Next.js 16 com React 19 e TypeScript como base da aplicação. Contexto/impacto: define o framework principal do frontend/server e orienta convenções de desenvolvimento do projeto.
- 2026-05-15 — Decisão: usar Tailwind CSS 4 para estilização. Contexto/impacto: padroniza a camada visual com utilitários e reduz custo inicial de implementação de interface.
