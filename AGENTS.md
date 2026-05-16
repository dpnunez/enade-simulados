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
- Better Auth para AuthN e AuthZ

## Componentes shadcn

- O shadcn/ui é a principal fonte de componentes do projeto.
- Sempre que precisarmos de UI reutilizável, a preferência deve ser usar um componente do shadcn existente ou criar um novo componente seguindo o padrão dele.
- Se houver necessidade de abstração local, use a pasta `src/components` para componentes específicos do app e mantenha esse conteúdo alinhado ao vocabulário visual do shadcn.
- Evite introduzir componentes visuais paralelos ou bibliotecas alternativas sem necessidade clara.

## Stack de testes

- Vitest para testes unitários e de integração leves, com `jsdom` como ambiente padrão quando houver renderização de React.
- `@testing-library/react` e `@testing-library/jest-dom` para validar comportamento de componentes e helpers com semântica de usuário.
- Playwright para testes E2E no navegador real.
- Banco de teste isolado via PostgreSQL no mesmo container do `docker-compose`, usando outro database e `.env.test`.
- Seed determinístico como fonte oficial de usuários de teste, reaproveitando os usuários `admin@enade.local`, `student@enade.local` e `teacher@enade.local`.

## Estrutura dos testes

- Testes unitários e de integração próximos da lógica que estão cobrindo, ou em diretórios dedicados quando fizer mais sentido.
- Testes E2E em `tests/e2e`.
- Fixtures e dados compartilhados em `tests/e2e/fixtures`.
- Helpers de fluxo E2E em `tests/e2e/helpers`.
- Preparação do banco E2E em `scripts/e2e/prepare-test-db.ts`.
- Configuração do Vitest em `vitest.config.ts`.
- Configuração do Playwright em `playwright.config.ts`.

## Política de cobertura

- Sempre que uma funcionalidade principal for adicionada, avaliar a necessidade de testes de unidade e/ou integração para as regras puras, helpers e contratos críticos.
- Sempre que a funcionalidade tiver impacto visível no navegador, avaliar a adição de pelo menos um teste E2E cobrindo o fluxo principal.
- A decisão final entre unit/integration e E2E deve usar julgamento técnico da LLM, priorizando risco, criticidade do fluxo e custo de manutenção.
- Fluxos de autenticação, autorização, navegação protegida, seed, banco e regras centrais devem receber cobertura por padrão.
- Preferir testes determinísticos, com dados fixos e sem dependência do banco de desenvolvimento.

## Decisões de arquitetura e bibliotecas

- Registrar aqui decisões duráveis sobre stack, arquitetura e bibliotecas relevantes do projeto.
- Formato recomendado: `YYYY-MM-DD — Decisão: <o que foi escolhido>. Contexto/impacto: <por que importa no projeto>`.
- 2026-05-15 — Decisão: usar PostgreSQL em Docker Compose como banco de dados local do projeto. Contexto/impacto: padroniza o ambiente de desenvolvimento e simplifica a subida do banco para o MVP.
- 2026-05-15 — Decisão: usar Prisma como ORM principal. Contexto/impacto: centraliza schema, geração de client e futuras migrações da aplicação.
- 2026-05-15 — Decisão: usar Next.js 16 com React 19 e TypeScript como base da aplicação. Contexto/impacto: define o framework principal do frontend/server e orienta convenções de desenvolvimento do projeto.
- 2026-05-15 — Decisão: usar Tailwind CSS 4 para estilização. Contexto/impacto: padroniza a camada visual com utilitários e reduz custo inicial de implementação de interface.
- 2026-05-16 — Decisão: usar shadcn/ui como base de componentes reutilizáveis, com `components.json`, `lucide-react`, `tw-animate-css` e helper `cn` em `src/lib/utils.ts`. Contexto/impacto: padroniza a biblioteca de UI do projeto e facilita a geração de componentes consistentes sobre Tailwind CSS 4.
