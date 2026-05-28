# Decisao: importacao administrativa de questoes por Markdown estruturado

## Status

Decidido.

## Decisao

A importacao em massa de questoes sera feita por uma rota administrativa da plataforma, usando um unico arquivo Markdown estruturado contendo N questoes.

O Markdown sera o formato autoral principal. A rota administrativa fara o parsing desse arquivo, convertera cada bloco de questao para o contrato interno de `QuestionInput`, validara com Zod e gravara usando os mesmos servicos de dominio usados pelo cadastro individual.

O formato CSV nao sera priorizado nesta fase.

## Motivacao

As questoes podem ter enunciados longos, listas, tabelas, trechos de codigo e explicacoes com formatacao. JSON e CSV funcionam tecnicamente, mas ficam ruins para autoria e revisao manual quando o conteudo principal tambem e Markdown.

Um arquivo Markdown estruturado resolve melhor este caso porque:

- mantem o enunciado em um formato legivel;
- facilita revisar muitas questoes em um unico arquivo;
- permite versionar e comparar alteracoes com clareza;
- evita escaping excessivo de quebras de linha;
- representa melhor o trabalho editorial de questoes;
- ainda pode ser convertido para o contrato interno da aplicacao antes da persistencia.

## Escopo

Esta decisao cobre:

- formato do arquivo Markdown;
- metadados exigidos por questao;
- estrutura de enunciado, alternativas e explicacao;
- comportamento esperado da rota administrativa;
- validacoes minimas;
- deduplicacao obrigatoria;
- regras de erro e preview.

Esta decisao nao cobre:

- upload de imagens;
- revisao/publicacao editorial;
- importacao por CSV;
- importacao por JSON publico;
- deduplicacao semantica perfeita.

## Rota administrativa

A rota sugerida e:

```txt
POST /api/admin/questions/import
```

A rota deve aceitar um payload com o conteudo Markdown e um modo de operacao.

Exemplo de payload:

```json
{
  "mode": "preview",
  "markdown": "...conteudo do arquivo..."
}
```

Modos:

- `preview`: parseia, valida e retorna o relatorio sem gravar;
- `commit`: parseia, valida e grava se o lote estiver valido.

Regra de seguranca:

- a rota deve exigir usuario autenticado;
- inicialmente, apenas `ADMIN` deve poder importar;
- se o fluxo pedagogico exigir autonomia de professores, liberar `TEACHER` depois com decisao explicita;
- o backend deve definir `createdById` a partir do usuario autenticado ou de um campo administrativo validado, nunca de texto livre no Markdown sem checagem.

## Principio de implementacao

O parser de Markdown deve ser apenas uma camada de adaptacao.

Fluxo recomendado:

1. receber Markdown;
2. dividir em blocos de questao;
3. extrair metadados e secoes;
4. transformar em objeto interno;
5. validar com schema de importacao;
6. converter para `QuestionInput`;
7. validar com `questionInputSchema`;
8. resolver grande area;
9. retornar preview ou gravar.

O parser nao deve gravar diretamente no banco.

## Formato oficial do arquivo

O arquivo pode conter um titulo geral opcional e comentarios editoriais fora dos blocos de questao. Apenas blocos iniciados por `--- question` devem ser importados.

Cada questao deve seguir esta estrutura:

```md
--- question
subjectField: Engenharia de Software
difficulty: MEDIUM
source: ENADE
year: 2024
correct: B
externalId: ENADE-2024-Q01
---

## Enunciado

Texto do enunciado em Markdown.

Pode ter multiplos paragrafos, listas, tabelas e blocos de codigo.

## Alternativas

A. Primeira alternativa em Markdown.

B. Segunda alternativa em Markdown.

C. Terceira alternativa em Markdown.

D. Quarta alternativa em Markdown.

E. Quinta alternativa em Markdown.

## Explicacao

Texto opcional explicando a resposta correta.
```

## Separador de questoes

Cada questao comeca com:

```md
--- question
```

E termina implicitamente antes do proximo:

```md
--- question
```

ou no fim do arquivo.

Isso permite que o arquivo contenha N questoes sem precisar fechar cada bloco manualmente.

## Metadados

Os metadados ficam no topo do bloco, entre `--- question` e `---`.

Campos:

- `subjectField`: obrigatorio; titulo da grande area;
- `difficulty`: obrigatorio; `EASY`, `MEDIUM` ou `HARD`;
- `source`: opcional; `ENADE`, `MANUAL`, `ADAPTED` ou `OTHER`;
- `year`: opcional; inteiro entre 1998 e 2100;
- `correct`: obrigatorio; letra da alternativa correta, de `A` ate `H`;
- `externalId`: obrigatorio; identificador editorial para relatorio e deduplicacao dentro do arquivo.

`externalId` nao sera salvo em `Question` nesta fase. Ele existe para tornar preview, erros, revisao do lote e deduplicacao operacional mais claros. A rota deve retornar esse valor nos relatorios, mas a persistencia inicial continua usando apenas o contrato atual de questoes.

Exemplo:

```md
--- question
externalId: ENADE-2024-Q01
subjectField: Engenharia de Software
difficulty: MEDIUM
source: ENADE
year: 2024
correct: C
---
```

## Secao de enunciado

A secao `## Enunciado` e obrigatoria.

Todo conteudo entre `## Enunciado` e `## Alternativas` sera salvo em `descriptionMarkdown`.

Exemplo:

````md
## Enunciado

Considere o seguinte codigo:

```ts
function total(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}
```

Qual alternativa descreve corretamente o comportamento da funcao?
````

No arquivo real de importacao, blocos de codigo Markdown normais sao permitidos.

## Secao de alternativas

A secao `## Alternativas` e obrigatoria.

Cada alternativa deve comecar com uma letra seguida de ponto:

```md
A. Conteudo da alternativa A.
B. Conteudo da alternativa B.
C. Conteudo da alternativa C.
```

Tambem e permitido que uma alternativa tenha varias linhas. A alternativa continua ate a proxima linha que comece com outra letra no formato `A.` a `H.`, ou ate a proxima secao.

Exemplo:

```md
A. A funcao soma todos os valores do array.

B. A funcao altera o array original.

   Esta alternativa tem uma observacao adicional em segunda linha.

C. A funcao retorna sempre zero.
```

Regras:

- minimo de 2 alternativas;
- maximo de 8 alternativas;
- letras aceitas: `A` ate `H`;
- letras nao podem se repetir;
- a ordem das alternativas no arquivo define `position`;
- a alternativa indicada em `correct` deve existir.

## Secao de explicacao

A secao `## Explicacao` e opcional.

Todo conteudo nessa secao sera salvo em `correctAnswerExplanation`.

Se a secao nao existir ou estiver vazia, `correctAnswerExplanation` sera `null`.

## Exemplo completo com duas questoes

````md
# Lote de questoes - Engenharia de Software

Observacoes gerais do lote. Este texto nao sera importado.

--- question
externalId: ES-001
subjectField: Engenharia de Software
difficulty: MEDIUM
source: MANUAL
year: 2026
correct: B
---

## Enunciado

Uma equipe deseja reduzir regressao durante alteracoes frequentes no produto.

Qual pratica contribui diretamente para esse objetivo?

## Alternativas

A. Remover testes antigos para acelerar o desenvolvimento.

B. Manter uma suite automatizada executada continuamente.

C. Concentrar validacao apenas ao final do projeto.

D. Evitar revisao de codigo para reduzir tempo de entrega.

## Explicacao

Uma suite automatizada ajuda a detectar regressao logo apos mudancas no codigo.

--- question
externalId: ES-002
subjectField: Engenharia de Software
difficulty: HARD
source: ENADE
year: 2024
correct: A
---

## Enunciado

Considere o seguinte trecho:

```ts
function total(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}
```

O que a funcao retorna?

## Alternativas

A. A soma de todos os valores do array.

B. O primeiro valor do array.

C. O tamanho do array.

D. Sempre zero.
````

## Resultado interno esperado

Cada bloco valido deve virar um objeto equivalente a:

```json
{
  "descriptionMarkdown": "Uma equipe deseja reduzir regressao...",
  "difficulty": "MEDIUM",
  "source": "MANUAL",
  "year": 2026,
  "subjectFieldId": "id-resolvido-da-grande-area",
  "correctAnswerExplanation": "Uma suite automatizada ajuda...",
  "alternatives": [
    { "contentMarkdown": "Remover testes antigos...", "isCorrect": false },
    { "contentMarkdown": "Manter uma suite automatizada...", "isCorrect": true },
    { "contentMarkdown": "Concentrar validacao...", "isCorrect": false },
    { "contentMarkdown": "Evitar revisao de codigo...", "isCorrect": false }
  ]
}
```

## Resolucao da grande area

O campo `subjectField` deve ser resolvido pelo titulo normalizado da grande area.

Regra:

- normalizar espacos;
- comparar sem diferenciar maiusculas/minusculas;
- exigir correspondencia unica;
- falhar se nao encontrar;
- falhar se houver ambiguidade.

Nesta fase, a importacao nao deve criar grandes areas automaticamente.

## Deduplicacao

Deduplicacao e requisito da primeira versao.

A importacao deve bloquear:

- `externalId` duplicado dentro do mesmo arquivo;
- questoes duplicadas dentro do mesmo arquivo;
- questoes que ja existem no banco com o mesmo `hashContent`.

### Assinatura canonica

Antes da execucao deste plano, o modelo `Question` deve possuir um campo persistido de hash de conteudo, chamado aqui de `hashContent`.

A primeira versao da importacao deve calcular a assinatura canonica de cada questao e usa-la como valor de `hashContent`.

A assinatura deve considerar somente:

- `descriptionMarkdown` normalizado;

Normalizacao minima:

- aplicar `trim`;
- converter quebras de linha Windows para `\n`;
- reduzir sequencias de espacos e tabs para um espaco;
- reduzir tres ou mais quebras de linha consecutivas para duas;
- manter maiusculas/minusculas no texto;
- manter acentos;

Exemplo conceitual da entrada do hash:

```txt
normalizedDescription
```

Essa assinatura nao tenta detectar equivalencia semantica. Ela bloqueia duplicatas operacionais claras com o mesmo enunciado normalizado.

O hash deve ser deterministico. O mesmo enunciado, com diferencas irrelevantes de espaco conforme a normalizacao acima, deve gerar o mesmo `hashContent`.

### Deduplicacao dentro do arquivo

Durante o preview, o importador deve calcular a assinatura de cada questao valida o suficiente para comparacao.

Se duas questoes tiverem a mesma assinatura, ambas devem aparecer no relatorio com erro de duplicidade, citando seus `externalId`.

Exemplo de erro:

```json
{
  "externalId": "ES-014",
  "code": "DUPLICATE_IN_FILE",
  "message": "Questao duplicada no arquivo. Tambem encontrada em ES-003."
}
```

### Deduplicacao contra o banco

Antes do `commit`, a rota deve comparar as questoes do arquivo contra questoes existentes no banco usando `hashContent`.

Estrategia:

1. calcular `hashContent` para cada questao parseada;
2. consultar o banco por `hashContent in (...)`;
3. bloquear o lote se qualquer hash ja existir;
4. retornar quais `externalId` conflitam com quais questoes existentes.

Essa consulta deve ser feita antes de gravar e a criacao deve depender de uma restricao unica no banco para evitar corrida entre duas importacoes concorrentes.

### Requisito de modelo

O modelo deve conter um campo equivalente a:

```txt
Question.hashContent String @unique
```

Nome final pode variar, mas a semantica deve ser: hash deterministico do conteudo canonico usado para deduplicacao.

Se o campo for obrigatorio, o cadastro individual tambem deve calcular e salvar `hashContent`. Se for opcional durante migracao, a importacao deve exigir `hashContent` preenchido nas novas questoes e a deduplicacao contra registros antigos sem hash deve ser tratada por uma migracao/backfill antes de liberar o fluxo em producao.

## Validacoes

O preview deve reportar erros por questao.

Validacoes de estrutura:

- bloco sem metadados;
- metadados malformados;
- ausencia de `## Enunciado`;
- ausencia de `## Alternativas`;
- alternativa fora do formato esperado;
- alternativa duplicada;
- alternativa correta inexistente.

Validacoes de dominio:

- grande area inexistente;
- dificuldade invalida;
- fonte invalida;
- ano invalido;
- enunciado vazio;
- alternativa vazia;
- menos de 2 alternativas;
- mais de 8 alternativas;
- mais de uma alternativa correta apos transformacao;
- limites de tamanho do schema atual.

Validacoes de lote:

- ausencia de `externalId`;
- `externalId` duplicado no mesmo arquivo;
- assinatura canonica duplicada dentro do arquivo;
- `hashContent` ja existente no banco;
- quantidade maxima de questoes por importacao.

## Comportamento do preview

O modo `preview` deve retornar:

- quantidade total de blocos encontrados;
- quantidade de questoes validas;
- quantidade de questoes invalidas;
- lista de erros por questao;
- metadados extraidos por questao;
- resumo das alternativas;
- indicacao da alternativa correta;
- erros de duplicidade por `externalId`.

Nenhuma escrita no banco deve ocorrer no modo `preview`.

## Comportamento do commit

O modo `commit` deve gravar somente se o lote inteiro estiver valido.

Decisao: nao fazer importacao parcial nesta fase.

Motivos:

- reduz surpresa operacional;
- evita lote meio importado;
- simplifica rollback mental;
- obriga corrigir erros antes de gravar.

Para lotes muito grandes, essa decisao pode ser revista no futuro com suporte a chunks e historico de importacao.

## Limites iniciais

Limites sugeridos para a primeira versao:

- ate 100 questoes por arquivo;
- ate 10.000 caracteres por enunciado;
- ate 5.000 caracteres por alternativa;
- ate 5.000 caracteres na explicacao;
- ate 8 alternativas por questao.

Os limites de texto devem seguir o schema atual de questoes.

## Auditoria

A importacao deve registrar, no minimo:

- usuario que executou;
- data/hora;
- modo executado;
- quantidade de questoes criadas;
- quantidade de questoes rejeitadas no preview;
- hash do conteudo importado;
- nome original do arquivo, se houver upload.

Mesmo que a primeira versao nao tenha tabela propria de historico, a rota deve ser desenhada pensando nessa evolucao.

## Decisoes adiadas

Ficam adiadas:

- suporte a imagens/anexos;
- importacao parcial;
- fila assincrona;
- tela de historico de importacoes;
- permissao para `TEACHER`;
- suporte a CSV.

## Resumo da decisao

O formato oficial de autoria para bulk import sera Markdown estruturado. A plataforma tera uma rota administrativa que recebe esse Markdown, faz preview, valida o lote inteiro, bloqueia duplicatas e so grava em modo `commit` quando nao houver erros.

Essa escolha favorece legibilidade, revisao editorial e manutencao de questoes ricas em Markdown, mantendo a seguranca de converter tudo para o contrato interno validado antes de persistir.
