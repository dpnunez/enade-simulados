# ENADE Eng Prod

**Vision:** Construir uma plataforma acadêmica interna de simulados para preparação estilo ENADE, conectando professores e alunos em um fluxo simples de criação, resolução e acompanhamento de desempenho.
**For:** Professores e alunos do curso.
**Solves:** A falta de uma ferramenta centralizada para praticar questões, aplicar simulados e identificar lacunas de aprendizagem por disciplina.

## Goals

- Disponibilizar um MVP utilizável com autenticação por perfil, banco inicial de usuários e navegação protegida para professores e alunos.
- Permitir que professores organizem questões e que alunos realizem simulados com correção automática e histórico básico de desempenho.
- Entregar uma base técnica sustentável, com testes automatizados para autenticação, autorização e fluxos críticos do navegador.

## Tech Stack

**Core:**

- Framework: Next.js 16.2.6 com App Router
- Language: TypeScript 5 + React 19.2.4
- Database: PostgreSQL 17 via Docker Compose
- ORM: Prisma 7
- Auth: Better Auth
- Styling: Tailwind CSS 4

**Key dependencies:**

- `better-auth`
- `@prisma/client`
- `@playwright/test`
- `vitest`
- `shadcn`

## Scope

**v1 includes:**

- Autenticação com email e senha para perfis `ADMIN`, `TEACHER` e `STUDENT`
- Navegação protegida por sessão e por role
- Cadastro e organização de matérias
- Cadastro e manutenção de questões objetivas com alternativas, gabarito, explicação e dificuldade
- Geração e resolução de simulados pelos alunos
- Correção automática e histórico básico de tentativas
- Visão simples de desempenho geral e por disciplina

**Explicitly out of scope:**

- Gamificação, ranking e mecânicas sociais
- Geração inteligente de simulados baseada em IA
- Relatórios avançados e analytics profundos na primeira entrega
- Marketplace, multi-tenant ou suporte para múltiplos cursos independentes

## Constraints

- Technical: O projeto já usa Next.js 16, então mudanças devem respeitar as convenções e breaking changes dessa versão.
- Technical: O vocabulário visual deve permanecer alinhado ao `shadcn/ui`, evitando bibliotecas paralelas sem necessidade clara.
- Technical: Funcionalidades críticas precisam considerar cobertura com Vitest e/ou Playwright conforme o risco do fluxo.
- Resources: O seed determinístico é a fonte oficial de usuários de teste para autenticação e autorização.
- Product: A primeira entrega deve priorizar simplicidade operacional e uso real pelo curso antes de recursos mais avançados.
