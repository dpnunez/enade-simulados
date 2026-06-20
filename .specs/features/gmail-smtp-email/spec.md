# Gmail SMTP Email Specification

## Problem Statement

Convites e redefinicao de senha ja possuem tokens, rotas, UI e adapters de email, mas o modo `smtp` ainda falha explicitamente. Para usar esses fluxos em producao, a aplicacao precisa enviar emails reais via SMTP do Gmail sem quebrar o modo `console` usado em desenvolvimento e E2E.

## Goals

- [ ] Enviar emails reais de convite e reset de senha via Gmail SMTP quando `*_EMAIL_DELIVERY=smtp`.
- [ ] Manter entrega `console`/log-file para desenvolvimento local e testes E2E deterministicos.
- [ ] Documentar e validar os passos externos necessarios no Gmail antes do deploy.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Trocar para OAuth/Gmail API | O pedido atual e usar SMTP do Gmail; OAuth pode virar hardening futuro. |
| Criar templates visuais complexos de email | O MVP precisa entregar links funcionais; HTML simples basta. |
| Fila/retry/background jobs | O volume esperado e baixo; envio sincrono existente sera mantido inicialmente. |
| Email de notificacao apos reset concluido | Ja esta em ideias diferidas e nao e necessario para convite/reset funcionarem. |

---

## User Stories

### P1: Envio real de convite via Gmail SMTP - MVP

**User Story**: Como ADMIN, quero enviar um convite e o usuario receber um email real com o link para cadastro, para que alunos e professores possam entrar no sistema sem depender de logs internos.

**Why P1**: Convite e o unico caminho de cadastro do produto.

**Acceptance Criteria**:

1. WHEN `INVITATION_EMAIL_DELIVERY=smtp` e as credenciais SMTP estao validas THEN system SHALL enviar email para o destinatario com link `/convites/[token]`.
2. WHEN qualquer env SMTP obrigatoria estiver ausente THEN system SHALL falhar com erro claro sem registrar segredo em log.
3. WHEN `INVITATION_EMAIL_DELIVERY=console` THEN system SHALL manter o comportamento atual de console/log-file.

**Independent Test**: Criar convite como ADMIN em ambiente configurado com Gmail SMTP e confirmar recebimento do email com link funcional.

---

### P1: Envio real de reset de senha via Gmail SMTP - MVP

**User Story**: Como usuario cadastrado, quero receber um email real de redefinicao de senha, para recuperar acesso sem ajuda manual do administrador.

**Why P1**: Reset e fluxo critico de autenticacao.

**Acceptance Criteria**:

1. WHEN `PASSWORD_RESET_EMAIL_DELIVERY=smtp` e as credenciais SMTP estao validas THEN system SHALL enviar email para o usuario com link `/redefinir-senha/[token]`.
2. WHEN email nao existir ou nao tiver conta `credential` THEN system SHALL manter resposta publica generica e nao enviar email.
3. WHEN envio SMTP falhar THEN API SHALL retornar erro de entrega sem expor detalhes sensiveis ao usuario.

**Independent Test**: Solicitar reset para `student@enade.local` ou usuario real em ambiente SMTP e confirmar recebimento do link funcional.

---

### P1: Configuracao externa segura no Gmail - MVP

**User Story**: Como mantenedor do sistema, quero preparar a conta Gmail corretamente, para que a aplicacao envie emails sem usar a senha principal da conta.

**Why P1**: Gmail SMTP exige autenticacao valida; usar senha principal nao deve ser o caminho.

**Acceptance Criteria**:

1. WHEN a conta Gmail nao tiver 2-Step Verification habilitado THEN maintainer SHALL habilitar antes de gerar senha de app.
2. WHEN a senha de app for gerada THEN maintainer SHALL armazenar somente em variavel secreta do ambiente, nunca no repositorio.
3. WHEN a conta nao permitir app passwords THEN maintainer SHALL resolver a politica da conta ou escolher alternativa aprovada antes de habilitar `smtp`.

**Independent Test**: Validar credenciais com um envio real em ambiente de staging/local seguro antes de producao.

---

## Edge Cases

- WHEN `SMTP_SECURE=true` e `SMTP_PORT=587` THEN system SHALL falhar em teste/config review, pois TLS explicito deve usar porta 465; porta 587 deve usar STARTTLS com `secure=false`.
- WHEN `NEXT_PUBLIC_URL` estiver errado THEN emails SHALL conter links errados; configuracao de deploy deve validar a URL canonica antes do teste real.
- WHEN Gmail bloquear login por politica da conta THEN feature SHALL permanecer em `console` ate credenciais validas serem providas.
- WHEN senha da conta Google mudar THEN app passwords podem ser revogadas e a variavel `SMTP_PASSWORD` deve ser rotacionada.
- WHEN o envio real funcionar mas emails cairem em spam THEN maintainer SHALL revisar remetente, assunto e politicas de dominio antes de considerar a feature concluida em producao.

---

## External Gmail Setup Requirements

Fonte consultada: Google Account Help, "Sign in with app passwords" (`https://support.google.com/accounts/answer/185833`), e Google Workspace Help, "Send email from a printer, scanner, or app" (`https://support.google.com/a/answer/176600`).

1. Acessar a conta Gmail/Google que sera remetente dos emails transacionais.
2. Habilitar 2-Step Verification na conta, se ainda nao estiver habilitado.
3. Abrir "Create and manage your app passwords" em `https://myaccount.google.com/apppasswords`.
4. Criar uma app password para a aplicacao, por exemplo `ENADE Eng Prod`.
5. Copiar a senha de app de 16 digitos no momento da criacao; ela nao deve ser commitada.
6. Configurar as envs do ambiente:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_SECURE=true`
   - `SMTP_USER=<email completo da conta Gmail>`
   - `SMTP_PASSWORD=<senha de app>`
   - `INVITATION_EMAIL_DELIVERY=smtp`
   - `PASSWORD_RESET_EMAIL_DELIVERY=smtp`
   - `INVITATION_EMAIL_FROM="ENADE Engenharia <mesmo-email-ou-alias-autorizado>"`
   - `PASSWORD_RESET_EMAIL_FROM="ENADE Engenharia <mesmo-email-ou-alias-autorizado>"`
7. Configurar `NEXT_PUBLIC_URL` com a URL publica canonica do deploy.
8. Enviar um convite e solicitar um reset em staging/producao controlada.
9. Confirmar recebimento, links corretos, e ausencia de vazamento de token em logs publicos.

Observacao: a documentacao do Google tambem lista porta `587` com TLS. Se essa porta for escolhida, usar `SMTP_SECURE=false` para STARTTLS.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| EMAIL-01 | P1: Envio real de convite via Gmail SMTP | Execute | Code implemented; real Gmail smoke pending |
| EMAIL-02 | P1: Envio real de reset de senha via Gmail SMTP | Execute | Code implemented; real Gmail smoke pending |
| EMAIL-03 | P1: Configuracao externa segura no Gmail | Execute | Documented; external setup pending |
| EMAIL-04 | Edge: manter console/log-file para dev/E2E | Execute | Unit and E2E verified |
| EMAIL-05 | Edge: validar envs e combinacao porta/secure | Execute | Implemented and unit verified |
| EMAIL-06 | Edge: documentar deploy e verificacao manual | Execute | Documented; manual smoke pending |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Admin cria convite e destinatario recebe email real com link funcional.
- [ ] Usuario solicita reset e recebe email real com link funcional.
- [x] Testes unitarios dos adapters passam cobrindo `console`, validacao SMTP e envio SMTP mockado.
- [x] `pnpm build` passa com a nova dependencia e env parsing.
- [ ] Checklist Gmail/deploy concluido sem segredos versionados.

**Automated Verification Note:** `pnpm test:unit` passou com 181 testes, `pnpm build` passou, e `pnpm test:e2e` passou com 18 testes depois que Docker/PostgreSQL ficou disponivel.
