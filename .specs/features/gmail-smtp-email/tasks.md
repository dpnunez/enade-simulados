# Gmail SMTP Email Tasks

**Design**: `.specs/features/gmail-smtp-email/design.md`
**Status**: In Progress

---

## Execution Plan

### Phase 1: External Gmail Setup (Sequential)

```
T1 -> T2
```

### Phase 2: Implementation (Sequential)

```
T3 -> T4 -> T5 -> T6
```

### Phase 3: Verification and Deploy (Sequential)

```
T7 -> T8
```

---

## Task Breakdown

### T1: Prepare Gmail Account

**What**: Preparar a conta Gmail/Google que sera usada como remetente SMTP.
**Where**: Google Account / Gmail, fora do repositorio.
**Depends on**: None
**Reuses**: Google Account Help app passwords docs.
**Requirement**: EMAIL-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Conta remetente definida.
- [ ] 2-Step Verification habilitado.
- [ ] App password criada em `https://myaccount.google.com/apppasswords`.
- [ ] Senha de app armazenada em gerenciador seguro, nao no repositorio.
- [ ] Se a conta nao exibir app passwords, politica da conta/organizacao foi resolvida ou alternativa aprovada.

**Tests**: manual external
**Gate**: manual

---

### T2: Configure Runtime Secrets

**What**: Configurar variaveis de ambiente para Gmail SMTP no ambiente alvo.
**Where**: Vercel/host/local secure env; `.env.example` apenas como documentacao sem segredos.
**Depends on**: T1
**Reuses**: `.env.example`, `src/infra/env.ts`
**Requirement**: EMAIL-03, EMAIL-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=465`
- [ ] `SMTP_SECURE=true`
- [ ] `SMTP_USER=<email completo>`
- [ ] `SMTP_PASSWORD=<senha de app>`
- [ ] `INVITATION_EMAIL_DELIVERY=smtp`
- [ ] `PASSWORD_RESET_EMAIL_DELIVERY=smtp`
- [ ] `INVITATION_EMAIL_FROM` e `PASSWORD_RESET_EMAIL_FROM` usam remetente autorizado.
- [ ] `NEXT_PUBLIC_URL` aponta para a URL publica correta.

**Tests**: manual config review
**Gate**: manual

---

### T3: Add SMTP Dependency and Shared Helper

**What**: Adicionar biblioteca SMTP e criar helper server-only de envio.
**Where**: `package.json`, `pnpm-lock.yaml`, `src/infra/email/smtp-mailer.ts`
**Depends on**: None for code; T1/T2 for real delivery.
**Reuses**: `src/infra/env.ts`
**Requirement**: EMAIL-01, EMAIL-02, EMAIL-05

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Dependencia SMTP instalada.
- [x] Helper valida `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
- [x] Helper converte porta para numero.
- [x] Helper rejeita combinacoes invalidas conhecidas ou documenta comportamento.
- [x] Helper envia `from`, `to`, `subject`, `text`, `html`.
- [x] Nenhum segredo e logado.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(email): add smtp mailer helper`

**Result**: Complete in commit `fe46a7d`; `pnpm test:unit` passed with 179 tests.

---

### T4: Wire Invitation Adapter to SMTP

**What**: Implementar envio SMTP real para convites, mantendo console/log-file.
**Where**: `src/features/invitations/invitation-email.adapter.ts`, `src/features/invitations/invitation-email.adapter.test.ts`
**Depends on**: T3
**Reuses**: `buildInvitationUrl()`, branch `console` atual.
**Requirement**: EMAIL-01, EMAIL-04

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Branch `smtp` chama `sendSmtpEmail()`.
- [x] Email contem assunto claro e link `/convites/[token]`.
- [x] Teste cobre envio SMTP mockado.
- [x] Teste existente de `console` continua passando.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(email): send invitations through smtp`

**Result**: Complete in commit `ad66ba5`; `pnpm test:unit` passed with 180 tests.

---

### T5: Wire Password Reset Adapter to SMTP

**What**: Implementar envio SMTP real para reset de senha, mantendo console/log-file.
**Where**: `src/features/password-reset/password-reset-email.adapter.ts`, `src/features/password-reset/password-reset-email.adapter.test.ts`
**Depends on**: T4
**Reuses**: `buildPasswordResetUrl()`, branch `console` atual.
**Requirement**: EMAIL-02, EMAIL-04

**Tools**:

- MCP: filesystem
- Skill: codenavi

**Done when**:

- [x] Branch `smtp` chama `sendSmtpEmail()`.
- [x] Email contem assunto claro e link `/redefinir-senha/[token]`.
- [x] Teste cobre envio SMTP mockado.
- [x] Teste existente de `console` continua passando.
- [x] Gate check passes: `pnpm test:unit`.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(email): send password resets through smtp`

**Result**: Complete in commit `f6021b6`; `pnpm test:unit` passed with 181 tests.

---

### T6: Update Env Documentation

**What**: Atualizar exemplos e documentacao operacional de SMTP/Gmail.
**Where**: `.env.example`, `README.md` or `.specs/features/gmail-smtp-email/spec.md`
**Depends on**: T5
**Reuses**: External Gmail setup requirements from spec.
**Requirement**: EMAIL-03, EMAIL-05, EMAIL-06

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [x] `.env.example` informa valores Gmail recomendados sem segredos reais.
- [x] Documentacao explica app password e 2-Step Verification.
- [x] Documentacao diferencia porta 465 SSL de porta 587 STARTTLS.
- [x] Gate check passes: `pnpm build`.

**Tests**: build
**Gate**: build

**Commit**: `docs(email): document gmail smtp setup`

**Result**: Complete in commit `408c70f`; `pnpm build` passed.

---

### T7: Run Automated Verification

**What**: Rodar gates automatizados apos implementacao.
**Where**: workspace.
**Depends on**: T4, T5, T6
**Reuses**: `.specs/codebase/TESTING.md`
**Requirement**: EMAIL-01, EMAIL-02, EMAIL-04, EMAIL-05

**Tools**:

- MCP: filesystem
- Skill: NONE

**Done when**:

- [x] `pnpm test:unit` passa.
- [x] `pnpm build` passa.
- [ ] `pnpm test:e2e` passa mantendo `console`/log-file.
- [x] Nenhum teste foi removido para fazer gate passar.

**Tests**: unit, e2e, build
**Gate**: full/build

**Result**: Partial. `pnpm test:unit` passed with 181 tests and `pnpm build` passed. `pnpm test:e2e` did not reach browser tests because PostgreSQL on `localhost:5432` refused connection; `pnpm db:up` also failed because the Docker daemon/socket was unavailable.

---

### T8: Perform Real Gmail Smoke Test

**What**: Validar entrega real com Gmail SMTP em ambiente seguro.
**Where**: staging/producao controlada + caixa de email destinataria.
**Depends on**: T1, T2, T7
**Reuses**: UI/API existentes de convite e reset.
**Requirement**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-06

**Tools**:

- MCP: browser if available
- Skill: NONE

**Done when**:

- [ ] Criar convite para email controlado.
- [ ] Confirmar recebimento do email.
- [ ] Abrir link e confirmar que tela `/convites/[token]` carrega.
- [ ] Solicitar reset para usuario controlado.
- [ ] Confirmar recebimento do email.
- [ ] Abrir link e confirmar que tela `/redefinir-senha/[token]` carrega.
- [ ] Confirmar que tokens/senha de app nao aparecem em logs publicos.

**Tests**: manual smoke
**Gate**: manual

---

## Parallel Execution Map

As tarefas sao majoritariamente sequenciais porque T3 cria o helper compartilhado usado por T4/T5, e T1/T2 bloqueiam apenas a validacao real externa. T4 e T5 poderiam ser paralelas depois de T3 se executadas por agentes diferentes, mas compartilham padrao e testes dos adapters; preferir sequencial para reduzir conflito.

```
External:
  T1 -> T2 ------------------------┐
                                   ├-> T8
Code:
  T3 -> T4 -> T5 -> T6 -> T7 ------┘
```

---

## Pre-Approval Validation

### Diagram-Definition Cross-Check

| Task | Depends on | Diagram match | Status |
| --- | --- | --- | --- |
| T1 | None | External starts first | OK |
| T2 | T1 | `T1 -> T2` | OK |
| T3 | None | Code starts independently | OK |
| T4 | T3 | `T3 -> T4` | OK |
| T5 | T4 | `T4 -> T5` | OK |
| T6 | T5 | `T5 -> T6` | OK |
| T7 | T4, T5, T6 | `T6 -> T7` after implementation docs | OK |
| T8 | T1, T2, T7 | External + code converge | OK |

### Test Co-Location Validation

| Task | Code Layer | Required Test Type | Included in Task | Status |
| --- | --- | --- | --- | --- |
| T1 | External config | manual | manual external | OK |
| T2 | Runtime config | manual | manual config review | OK |
| T3 | Infra helper | unit | helper tests with mocked SMTP | OK |
| T4 | Feature adapter | unit | adapter test updated | OK |
| T5 | Feature adapter | unit | adapter test updated | OK |
| T6 | Env/docs | build | build gate | OK |
| T7 | Cross-feature verification | unit/e2e/build | automated gates | OK |
| T8 | Real provider integration | manual smoke | manual smoke | OK |

### Tooling Question Before Execution

Before implementing, confirm whether to use only the built-in filesystem/shell tools or also delegate independent tasks to sub-agents. Recommended: keep implementation in the main agent because the code changes are small and tightly related.
