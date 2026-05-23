# State

**Last Updated:** 2026-05-23T00:00:00-03:00
**Current Work:** Project initialization - base spec and roadmap

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

## Active Blockers

Nenhum blocker ativo registrado no momento.

## Lessons Learned

Nenhuma lição registrada ainda.

## Quick Tasks Completed

| #   | Description                         | Date       | Commit | Status  |
| --- | ----------------------------------- | ---------- | ------ | ------- |
| 001 | Inicialização de `.specs/project`   | 2026-05-23 | -      | ✅ Done |

## Deferred Ideas

- [ ] Mapear formalmente o codebase em `.specs/codebase` antes de iniciar features maiores — Captured during: project initialization
- [ ] Definir estratégia de armazenamento de imagens para questões e anexos — Captured during: project initialization
- [ ] Confirmar critérios de sucesso mensuráveis para o MVP com stakeholders do curso — Captured during: project initialization

## Todos

- [ ] Criar documentação brownfield de stack, arquitetura, convenções e testes
- [ ] Especificar a primeira feature de domínio além de autenticação
- [ ] Revisar o roadmap quando a área administrativa ganhar CRUD real

## Preferences

**Model Guidance Shown:** never
