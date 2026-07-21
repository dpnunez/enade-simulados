# Student Markdown Rendering Specification

## Problem Statement

O estudante hoje ve enunciados e alternativas de simulados como texto puro, mesmo quando o professor salvou Markdown ou imagens inseridas pelo editor. Como imagens do editor podem estar persistidas como HTML cru (`<img src="" />`), a tela do aluno precisa renderizar Markdown com suporte controlado a HTML seguro, sem transformar conteudo do banco em MDX executavel.

## Goals

- [ ] Renderizar Markdown em enunciados e alternativas na visao do aluno.
- [ ] Renderizar imagens persistidas como tags HTML `<img src="" />`.
- [ ] Sanitizar HTML cru antes de renderizar para reduzir risco de XSS.
- [ ] Reutilizar um componente compartilhado de leitura Markdown em vez de acoplar a tela do aluno a bibliotecas de parsing.
- [ ] Cobrir a renderizacao com testes unitarios/componentes e um fluxo E2E visivel.

## Out of Scope

| Feature | Reason |
| --- | --- |
| MDX executavel com JSX/componentes React no conteudo | Conteudo vem do banco e nao deve executar JavaScript/JSX para esta necessidade. |
| Migrar conteudo existente de `<img>` para `![]()` | Pode ser melhoria posterior; a primeira entrega deve preservar o formato ja salvo. |
| Galeria/gestao de imagens | Ja esta fora do escopo da feature de upload. |
| Proxy privado ou URLs assinadas para imagem | Markdown atual referencia URLs persistentes; privacidade de midia exigiria outra arquitetura. |
| Renderizacao Markdown nas telas de listagem do professor | O foco e a experiencia de estudo do aluno; listagens podem continuar usando preview textual. |

---

## User Stories

### P1: Estudante Ve Enunciado Formatado MVP

**User Story**: Como estudante, quero ver o enunciado do simulado formatado para conseguir estudar questoes com textos, listas, enfases e imagens.

**Why P1**: E o fluxo central: sem renderizacao, imagens anexadas pelo professor nao aparecem durante o estudo.

**Acceptance Criteria**:

1. WHEN o estudante abre uma tentativa em andamento THEN o sistema SHALL renderizar `descriptionMarkdown` como conteudo Markdown formatado.
2. WHEN o enunciado contem `<img src="...">` THEN o sistema SHALL renderizar uma imagem visivel, responsiva e sem quebrar o layout.
3. WHEN o enunciado contem Markdown comum como negrito, listas ou links THEN o sistema SHALL renderizar os elementos HTML correspondentes.
4. WHEN o enunciado contem HTML nao permitido, atributos perigosos ou scripts THEN o sistema SHALL remover esse conteudo antes da renderizacao.

**Independent Test**: Criar uma questao com texto Markdown e `<img src="...">`, gerar simulado como aluno e verificar que o enunciado mostra texto formatado e imagem visivel, sem mostrar a tag literal.

---

### P1: Estudante Ve Alternativas Formatadas

**User Story**: Como estudante, quero que alternativas tambem respeitem Markdown para ler formulas simples, enfases ou imagens quando necessario.

**Why P1**: O modelo ja armazena `contentMarkdown`; renderizar so o enunciado deixaria metade do contrato inconsistente.

**Acceptance Criteria**:

1. WHEN uma alternativa contem Markdown THEN o sistema SHALL renderizar esse Markdown dentro do label da alternativa.
2. WHEN uma alternativa contem `<img src="...">` THEN o sistema SHALL renderizar a imagem sem impedir a selecao da alternativa.
3. WHEN o aluno seleciona uma alternativa renderizada com Markdown ou imagem THEN o sistema SHALL manter o comportamento atual de selecao, salvamento e finalizacao.

**Independent Test**: Criar alternativa com Markdown ou imagem, abrir no simulado e selecionar a alternativa com sucesso.

---

### P1: Renderizacao Segura E Reutilizavel

**User Story**: Como desenvolvedor, quero um componente compartilhado de renderizacao Markdown segura para nao duplicar configuracao de sanitizacao nas telas.

**Why P1**: HTML cru vindo do banco e uma fronteira sensivel; duplicacao aumenta chance de uma tela renderizar sem sanitizacao.

**Acceptance Criteria**:

1. WHEN uma tela precisa renderizar Markdown de leitura THEN ela SHALL usar um componente compartilhado em `src/components/markdown`.
2. WHEN HTML cru e processado THEN o componente SHALL usar uma allowlist sanitizada para tags e atributos permitidos.
3. WHEN links ou imagens usam URL insegura ou protocolo nao permitido THEN o componente SHALL bloquear ou neutralizar a URL.
4. WHEN dependencias de Markdown forem adicionadas THEN elas SHALL ser usadas apenas no componente de renderizacao, nao espalhadas pela view do simulado.

**Independent Test**: Teste de componente passa Markdown com `<script>`, `onerror`, `javascript:` e `<img src="https://...">`; somente a imagem/markup permitido permanece renderizavel.

---

## Edge Cases

- WHEN Markdown esta vazio THEN o componente SHALL renderizar nada ou espaco minimo sem erro.
- WHEN a imagem nao carrega THEN o navegador SHALL mostrar o comportamento nativo sem quebrar a navegacao do simulado.
- WHEN uma imagem e muito larga THEN ela SHALL ficar limitada ao container.
- WHEN um link externo e renderizado THEN ele SHALL abrir de forma segura (`rel` apropriado) se usar nova aba.
- WHEN o simulado esta em andamento THEN a renderizacao SHALL NOT introduzir campos de correcao no payload; a seguranca de respostas corretas continua nos DTOs atuais.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SMR-01 | P1: Estudante Ve Enunciado Formatado | Design | Pending |
| SMR-02 | P1: Estudante Ve Alternativas Formatadas | Design | Pending |
| SMR-03 | P1: Renderizacao Segura E Reutilizavel | Design | Pending |
| SMR-04 | Edge Cases: layout, URLs e HTML inseguro | Design | Pending |

**Coverage:** 4 total, 4 mapped to design/tasks, 0 unmapped.

---

## Success Criteria

- [ ] Tags `<img src="...">` salvas no markdown aparecem como imagem na tela do aluno.
- [ ] Markdown comum nao aparece como sintaxe literal na tela do aluno.
- [ ] HTML perigoso e atributos de evento nao chegam ao DOM renderizado.
- [ ] Fluxo de responder, salvar, finalizar e revisar simulado permanece funcionando.
- [ ] `pnpm test:unit` e o E2E principal de simulados passam.
