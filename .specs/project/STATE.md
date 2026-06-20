# State

**Last Updated:** 2026-06-20T00:00:00-03:00

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
**Impact:** APIs server-side continuam responsáveis por autorização e validação confiável com `zod`; `react-hook-form` deve ser tratado como camada de UX integrada aos componentes shadcn, usando `@hookform/resolvers/zod` quando houver validação client-side.

### AD-007: Grandes areas como catalogo compartilhado editavel por professores (2026-05-27)

**Decision:** Professores poderao listar e editar todas as grandes areas existentes; `createdById` fica apenas como auditoria de criacao.
**Reason:** O catalogo de grandes areas e compartilhado entre professores, e qualquer docente deve poder corrigir ou evoluir uma grande area ja cadastrada.
**Trade-off:** Um professor pode alterar uma grande area criada por outro, entao historico/auditoria mais detalhada pode ser necessario em uma fase futura.
**Impact:** O modelo `SubjectField` deve registrar `createdById`, mas servicos e rotas de update devem validar apenas a role `TEACHER`, nao ownership.

### AD-008: Questoes com alternativas filhas e uma correta por booleano (2026-05-27)

**Decision:** Modelar `QuestionAlternative` como entidade filha de `Question`, com `position`, `contentMarkdown` e `isCorrect`; a regra de uma unica correta sera protegida por validacao transacional e indice unico parcial no banco.
**Reason:** Evita relacao circular obrigatoria com `correctAlternativeId`, simplifica criacao/edicao atomica e deixa a leitura futura de simulados direta.
**Trade-off:** A regra "pelo menos uma correta" continua sendo responsabilidade do servico, pois o banco protege melhor "no maximo uma correta" com indice parcial.
**Impact:** A feature de questoes deve substituir alternativas transacionalmente em updates e manter testes cobrindo exatamente uma alternativa correta.

### AD-010: Formulario de questoes inicia com 5 alternativas (2026-05-27)

**Decision:** O formulario de criacao de questoes deve iniciar com 5 alternativas por padrao.
**Reason:** O usuario definiu 5 como quantidade default de alternativas.
**Trade-off:** A validacao pode continuar aceitando uma faixa operacional, mas a experiencia inicial deve refletir o padrao pedagogico esperado.
**Impact:** `QuestionForm` deve montar o estado inicial com 5 alternativas vazias e o E2E deve verificar esse default.

### AD-011: Listagem e criacao de questoes em telas separadas (2026-05-27)

**Decision:** A listagem de questoes ficara em `/app/professor/questoes` e a criacao em `/app/professor/questoes/nova`.
**Reason:** O usuario definiu que criar questao e listar questoes serao duas telas diferentes.
**Trade-off:** O fluxo ganha uma navegacao extra, mas a tela de listagem fica mais limpa e a criacao pode acomodar o editor markdown e alternativas sem competir por espaco.
**Impact:** A page de listagem nao deve renderizar o formulario de criacao; a page de criacao deve buscar grandes areas e retornar para a listagem apos sucesso.

### AD-012: Edicao de questoes em rota dedicada por id (2026-05-27)

**Decision:** A edicao de questoes ficara em `/app/professor/questoes/[id]`.
**Reason:** O usuario definiu uma rota dedicada para editar o conteudo de uma questao existente.
**Trade-off:** A listagem deixa de ter edicao inline, mas a tela dedicada comporta melhor editor markdown, alternativas e validacoes.
**Impact:** `QuestionsList` deve linkar para a rota de edicao; a page `[id]` deve carregar a questao e grandes areas server-side e reutilizar `QuestionForm` em modo edit.

### AD-009: Cascade de grande area sera plano posterior (2026-05-27)

**Decision:** A primeira implementacao de questoes nao mudara imediatamente a delecao de `SubjectField` para cascade; contagem e cascade ficaram em `.specs/features/subject-field-question-rollup`.
**Reason:** O usuario pediu deixar esse side effect por ultimo ou em outro plano posterior.
**Trade-off:** Durante a primeira feature, grandes areas com questoes devem continuar protegidas contra delecao em cascade ate a fase seguinte.
**Impact:** A relacao `Question.subjectFieldId` deve comecar sem cascade para `SubjectField`; a mudanca para cascade sera feita no plano posterior.

### AD-013: Grandes areas deletam questoes em cascade (2026-05-28)

**Decision:** A relacao `Question.subjectFieldId` agora usa `onDelete: Cascade`, e a listagem de grandes areas mostra `_count.questions`.
**Reason:** A feature `.specs/features/subject-field-question-rollup` foi implementada apos a entrega principal de questoes.
**Trade-off:** Deletar uma grande area remove questoes e alternativas relacionadas sem confirmacao extra especifica para esse impacto.
**Impact:** Testes e rotinas de limpeza que removem grandes areas devem considerar que questoes vinculadas e alternativas tambem serao removidas pelo banco.

### AD-014: Upload de imagens markdown via abstracao de storage (2026-06-04)

**Decision:** Planejar upload de imagens do `MarkdownEditor` usando um handler generico no componente, uma rota autenticada da aplicacao e um adapter Supabase Storage separado em infra.
**Reason:** O usuario pediu Supabase Storage como provider, mas explicitamente exigiu que o componente nao soubesse nada sobre Supabase.
**Trade-off:** O fluxo ganha camadas extras de contrato/adapter, mas preserva testabilidade e permite trocar provider sem alterar o editor.
**Impact:** `MarkdownEditor` deve receber uma funcao de upload provider-agnostica; credenciais Supabase ficam apenas no servidor; testes devem mockar o contrato de storage.

### AD-015: Simulados individuais persistem tentativa normalizada (2026-06-09)

**Decision:** Modelar simulados do estudante com `SimulationAttempt`, filtros de grandes areas, questoes selecionadas e uma resposta por questao, mantendo agregados de pontuacao na tentativa.
**Reason:** A normalizacao preserva historico, isolamento por estudante, revisao questao a questao e prepara ranking futuro sem duplicar enunciados/alternativas.
**Trade-off:** Questoes e alternativas referenciadas por tentativas passam a bloquear delecao fisica do catalogo ate existir uma estrategia de arquivamento/snapshot.
**Impact:** Rotinas de limpeza E2E e futuras telas de catalogo precisam remover tentativas relacionadas antes de apagar questoes usadas em simulados.

### AD-016: Reset de senha como fluxo first-party compatível com Better Auth (2026-06-09)

**Decision:** Planejar recuperacao de senha como feature propria em `.specs/features/password-reset`, usando tokens hashados, rotas em portugues e atualizacao de senha compativel com Better Auth em vez dos endpoints nativos de reset como contrato principal.
**Reason:** O produto ja controla criacao de conta por convites first-party com signup publico desativado; reset de senha deve seguir o mesmo dominio de UI, email adapter, testes e mensagens sem enumeracao.
**Trade-off:** A feature tera mais codigo e testes do que configurar `emailAndPassword.sendResetPassword`, mas evita acoplar UX e token lifecycle a rotas geradas da lib.
**Impact:** Implementacao deve reutilizar `hashPassword`/tabelas `Account` e `Session`, mas possuir modelo/servico de token proprio.

### AD-017: Reset de senha entregue com email console/log-file e SMTP diferido (2026-06-10)

**Decision:** Implementar reset de senha com adapter console/log-file deterministico e envs `PASSWORD_RESET_EMAIL_*`; manter `smtp` como modo que falha explicitamente ate existir provider real.
**Reason:** O fluxo precisava de cobertura E2E deterministica agora, enquanto a escolha de provider transacional real ainda nao foi tomada.
**Trade-off:** Producao ainda exige configurar um adapter SMTP/provider antes de usar envio real.
**Impact:** Proximas features de email transacional podem extrair um helper compartilhado quando convites e reset convergirem em um provider real.

### AD-018: Ranking de simulados usa pontuacao ponderada materializada (2026-06-10)

**Decision:** Persistir `SimulationAttempt.weightedScore` na finalizacao do simulado e usar essa coluna no ranking de estudantes para professores; pesos: facil 1, media/sem dificuldade 2, dificil 3; erros nao descontam pontos.
**Reason:** Reduz custo do ranking paginado e evita recalcular pontuacao ponderada por resposta a cada leitura.
**Trade-off:** A finalizacao do simulado ganha um agregado a mais e dados legados precisam de backfill por migration.
**Impact:** Ranking soma `weightedScore` por tentativa `COMPLETED`; migrations devem preservar backfill e fixtures/testes que inserem tentativas finalizadas diretamente devem informar o score quando precisarem de pontuacao real.

### AD-019: Gmail SMTP como provedor inicial de email transacional (2026-06-20)

**Decision:** Planejar envio real de convites e reset de senha via SMTP do Gmail, usando app password e mantendo `console`/log-file para desenvolvimento local e E2E.
**Reason:** O usuario definiu Gmail SMTP como provedor inicial, e os fluxos de convite/reset ja possuem adapters preparados para trocar o branch `smtp` por entrega real.
**Trade-off:** Gmail SMTP e simples para MVP, mas depende de politica da conta Google, limites do Gmail e credenciais de app password; volumes maiores podem exigir provedor transacional dedicado.
**Impact:** A feature `.specs/features/gmail-smtp-email` deve implementar helper SMTP compartilhado, atualizar adapters e documentar passos externos no Gmail antes do deploy.

## Active Blockers

Nenhum blocker ativo registrado no momento.

## Lessons Learned

- O projeto já tem uma fundação clara para auth/role, mas novas mutações precisam repetir autorização server-side; o `proxy.ts` é apenas uma proteção otimista.

### L-001: Validar emails com espaços antes da normalização em Zod

**Context:** Implementação da fase 1 de `user-invitations`, nos schemas de validação.
**Problem:** `z.email().trim()` valida o email antes de remover espaços, então entradas como `"  Teacher@Enade.Local  "` falham.
**Solution:** Usar `z.string().trim().email().transform(...)` para aparar espaços antes da validação e então normalizar casing.
**Prevents:** Falhas indevidas em formulários quando o usuário cola emails com espaços acidentais.

## Quick Tasks Completed

| #   | Description                       | Date       | Commit | Status  |
| --- | --------------------------------- | ---------- | ------ | ------- |
| 001 | Inicialização de `.specs/project` | 2026-05-23 | -      | ✅ Done |

## Deferred Ideas

- [ ] Mapear formalmente o codebase em `.specs/codebase` antes de iniciar features maiores — Captured during: project initialization
- [x] Definir estratégia de armazenamento de imagens para questões e anexos — Planned in `.specs/features/markdown-image-upload`
- [ ] Definir limpeza de imagens orfas apos falha no salvamento ou remocao de referencias markdown — Deferred from markdown image upload planning
- [x] Definir provedor de email para envio real de convites e reset de senha em produção — Planned in `.specs/features/gmail-smtp-email`
- [ ] Implementar provider real de email transacional para convites e reset de senha — Planned in `.specs/features/gmail-smtp-email`
- [ ] Avaliar email de notificacao de seguranca apos reset de senha bem-sucedido — Deferred from password reset implementation
- [ ] Confirmar critérios de sucesso mensuráveis para o MVP com stakeholders do curso — Captured during: project initialization

## Todos

- [x] Criar documentação brownfield de stack, arquitetura, convenções e testes
- [x] Especificar a primeira feature de domínio além de autenticação
- [x] Completar `user-invitations` T1-T11: convites, aceite, cancelamento, UI admin, E2E e gates finais
- [x] Implementar `.specs/features/grandes-areas/tasks.md`: CRUD de grandes areas para professores, E2E e gates finais
- [x] Planejar `.specs/features/questions`: cadastro de questoes com alternativas e editor markdown
- [x] Planejar `.specs/features/subject-field-question-rollup`: contagem e cascade posterior em grandes areas
- [x] Implementar `.specs/features/subject-field-question-rollup`: contagem de questoes e cascade SubjectField -> Question -> QuestionAlternative
- [x] Planejar `.specs/features/markdown-image-upload`: upload de imagens no editor markdown com Supabase Storage abstraido
- [x] Planejar `.specs/features/typed-envs`: envs tipadas com `@t3-oss/env-nextjs`
- [x] Planejar `.specs/features/student-simulated-exams`: geracao, resposta, historico e pontuacao agregada de simulados do estudante
- [x] Implementar `.specs/features/student-simulated-exams`: persistencia, APIs, UI de estudante, historico, correcao e cobertura E2E
- [x] Planejar `.specs/features/password-reset`: recuperacao de senha first-party compativel com Better Auth
- [ ] Implementar `.specs/features/simulation-answer-drafts`: salvar respostas de simulado em andamento sem finalizar/corrigir
- [x] Implementar `.specs/features/password-reset`: tokens, email adapter, UI publica, APIs e cobertura E2E
- [x] Planejar `.specs/features/teacher-simulation-ranking`: ranking paginado de estudantes para professores com pontuacao ponderada
- [x] Implementar `.specs/features/teacher-simulation-ranking`: service/API/page, React Table, fixtures E2E e gates completos
- [ ] Revisar o roadmap quando a área administrativa ganhar CRUD real
- [x] Definir provedor de email para envio real de convites e reset de senha em produção
- [ ] Implementar `.specs/features/gmail-smtp-email`: Gmail SMTP para convites e reset de senha

## Preferences

**Model Guidance Shown:** never
