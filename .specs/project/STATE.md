# State

**Last Updated:** 2026-05-25T00:00:00-03:00
**Current Work:** Codebase mapped; user invitations feature planned

---

## Recent Decisions (Last 60 days)

### AD-001: Base web com Next.js moderno e App Router (2026-05-23)

**Decision:** Manter o projeto em Next.js 16 com React 19, App Router e TypeScript como fundação principal.
**Reason:** A base já está criada nessa stack e ela cobre bem SSR, rotas protegidas e evolução do produto web.
**Trade-off:** Exige cuidado com breaking changes e leitura da documentação específica dessa versão.
**Impact:** Novas features precisam seguir convenções atuais do framework e evitar padrões legados.

### AD-002: Autenticação e autorização centralizadas com Better Auth + Prisma (2026-05-23)

**Decision:** Usar Better Auth integrado ao Prisma para sessões, login por email e senha e controle por role.
**Reason:** A solução já está operacional no repositório e reduz trabalho manual em fluxos sensíveis.
**Trade-off:** Parte do domínio inicial fica acoplada ao modelo de autenticação adotado.
**Impact:** Fluxos protegidos, seeds e testes devem continuar alinhados à modelagem atual de usuários e sessões.

### AD-003: UI reutilizável alinhada ao shadcn/ui (2026-05-23)

**Decision:** Adotar `shadcn/ui` como base preferencial para componentes visuais reutilizáveis.
**Reason:** Mantém consistência visual, reduz divergência entre telas e combina com a stack existente.
**Trade-off:** Customizações devem respeitar o vocabulário do sistema, em vez de introduzir padrões paralelos.
**Impact:** Componentes novos devem nascer em `src/components` seguindo o padrão já existente.

### AD-004: Cadastro de usuários somente por convite (2026-05-25)

**Decision:** Manter signup público desativado e criar novos usuários reais apenas por convite emitido por ADMIN.
**Reason:** O produto precisa controlar acesso de alunos e professores e atrelar cada cadastro a email e role definidos administrativamente.
**Trade-off:** O fluxo de criação fica mais complexo, exigindo token, cancelamento e envio de email.
**Impact:** A feature de convites deve criar contas compatíveis com Better Auth sem reabrir signup público.

### AD-005: Convite sem relação permanente com usuário (2026-05-25)

**Decision:** Não adicionar campos ou relações de convite ao modelo `User`.
**Reason:** O convite só valida o momento do cadastro; depois disso, email e role do usuário são suficientes para o domínio atual.
**Trade-off:** Não haverá trilha direta no banco dizendo qual convite originou qual usuário.
**Impact:** O modelo `Invitation` deve ser standalone e apenas mudar de status quando consumido ou cancelado.

### AD-006: Formulários com react-hook-form e zod (2026-05-25)

**Decision:** Usar `react-hook-form` em formulários novos ou modificados e `zod` para schemas/validações.
**Reason:** Padroniza estado, validação de UI, validação confiável no servidor e feedback de submissão sem introduzir um padrão diferente por tela.
**Trade-off:** Formulários simples precisarão de um pequeno Client Component quando houver gerenciamento interativo de campos.
**Impact:** APIs/controllers server-side continuam responsáveis por autorização e validação confiável com `zod`; `react-hook-form` deve ser tratado como camada de UX integrada aos componentes shadcn, usando `@hookform/resolvers/zod` quando houver validação client-side.

## Active Blockers

Nenhum blocker ativo registrado no momento.

## Lessons Learned

- O projeto já tem uma fundação clara para auth/role, mas novas mutações precisam repetir autorização server-side; o `proxy.ts` é apenas uma proteção otimista.

## Quick Tasks Completed

| #   | Description                         | Date       | Commit | Status  |
| --- | ----------------------------------- | ---------- | ------ | ------- |
| 001 | Inicialização de `.specs/project`   | 2026-05-23 | -      | ✅ Done |

## Deferred Ideas

- [ ] Mapear formalmente o codebase em `.specs/codebase` antes de iniciar features maiores — Captured during: project initialization
- [ ] Definir estratégia de armazenamento de imagens para questões e anexos — Captured during: project initialization
- [ ] Confirmar critérios de sucesso mensuráveis para o MVP com stakeholders do curso — Captured during: project initialization

## Todos

- [x] Criar documentação brownfield de stack, arquitetura, convenções e testes
- [x] Especificar a primeira feature de domínio além de autenticação
- [ ] Revisar o roadmap quando a área administrativa ganhar CRUD real
- [ ] Definir provedor de email para envio real de convites em produção

## Preferences

**Model Guidance Shown:** never
