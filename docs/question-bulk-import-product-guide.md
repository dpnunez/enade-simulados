# Guia para importacao em massa de questoes

## O que foi decidido

A importacao em massa de questoes sera feita por um arquivo Markdown estruturado.

Em vez de cadastrar cada questao manualmente na plataforma, o time de produto podera montar um unico arquivo `.md` com varias questoes. Esse arquivo sera enviado em uma area administrativa da plataforma, que primeiro fara uma validacao e mostrara um preview. As questoes so serao importadas se o arquivo inteiro estiver correto.

CSV e planilhas nao serao o formato principal nesta fase. A decisao por Markdown foi tomada porque o conteudo das questoes costuma ter textos longos, listas, tabelas, trechos de codigo e explicacoes. Markdown e mais facil de revisar e manter para esse tipo de conteudo.

## Como a importacao vai funcionar

O fluxo esperado sera:

1. O time monta um arquivo Markdown seguindo o formato deste guia.
2. Um usuario administrador envia o arquivo na area administrativa.
3. A plataforma valida todas as questoes.
4. A plataforma mostra um preview com questoes validas e erros encontrados.
5. Se houver qualquer erro, nenhuma questao sera importada.
6. Depois dos ajustes, o arquivo pode ser enviado novamente.
7. Quando tudo estiver valido, o administrador confirma a importacao.

Na primeira versao, nao havera importacao parcial. Ou o lote inteiro entra, ou nada entra.

## Estrutura geral do arquivo

O arquivo pode ter um titulo geral e observacoes internas.

Somente blocos que comecam com `--- question` serao lidos como questoes.

Exemplo de estrutura:

```md
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

Texto do enunciado.

## Alternativas

A. Alternativa A.

B. Alternativa B.

C. Alternativa C.

D. Alternativa D.

## Explicacao

Explicacao da alternativa correta.

--- question
externalId: ES-002
subjectField: Engenharia de Software
difficulty: EASY
source: MANUAL
year: 2026
correct: A
---

## Enunciado

Texto da segunda questao.

## Alternativas

A. Alternativa correta.

B. Alternativa incorreta.
```

## Campos obrigatorios de cada questao

Cada questao precisa comecar com metadados entre `--- question` e `---`.

Campos obrigatorios:

- `externalId`: codigo interno da questao no arquivo;
- `subjectField`: grande area da questao;
- `difficulty`: dificuldade;
- `correct`: letra da alternativa correta.

Campos opcionais:

- `source`: origem da questao;
- `year`: ano da questao.

Exemplo:

```md
--- question
externalId: ES-001
subjectField: Engenharia de Software
difficulty: MEDIUM
source: ENADE
year: 2024
correct: C
---
```

## externalId

`externalId` e uma referencia obrigatoria da questao dentro do arquivo.

Ele serve para:

- localizar erros no preview;
- conversar sobre uma questao especifica durante revisao;
- evitar codigos repetidos dentro do mesmo arquivo;
- facilitar ajustes quando o lote for reenviado.

Ele nao precisa seguir um padrao unico global, mas deve ser claro e nao pode repetir dentro do mesmo arquivo.

Bons exemplos:

- `ES-001`;
- `ES-2026-001`;
- `ENADE-2024-Q12`;
- `LOTE-01-Q003`.

Evite:

- `1`, `2`, `3` em lotes grandes sem contexto;
- nomes genericos como `questao`;
- codigos repetidos.

## Grande area

Use `subjectField` para informar a grande area.

O valor deve bater com uma grande area ja cadastrada na plataforma.

Exemplo:

```md
subjectField: Engenharia de Software
```

A importacao nao criara grandes areas automaticamente. Se a grande area ainda nao existir, ela deve ser cadastrada antes.

## Dificuldade

Use `difficulty` com um destes valores:

- `EASY`;
- `MEDIUM`;
- `HARD`.

Exemplo:

```md
difficulty: MEDIUM
```

## Origem

Use `source` quando fizer sentido informar a origem da questao.

Valores aceitos:

- `ENADE`;
- `MANUAL`;
- `ADAPTED`;
- `OTHER`.

Exemplo:

```md
source: ENADE
```

Se nao houver origem definida, o campo pode ser omitido.

## Ano

Use `year` para informar o ano da questao.

Exemplo:

```md
year: 2024
```

Se nao houver ano definido, o campo pode ser omitido.

## Alternativa correta

Use `correct` para informar a letra da alternativa correta.

Exemplo:

```md
correct: B
```

A letra informada precisa existir na lista de alternativas.

## Enunciado

Cada questao precisa ter uma secao `## Enunciado`.

Tudo que estiver nessa secao sera usado como texto principal da questao.

Exemplo:

```md
## Enunciado

Uma equipe deseja reduzir regressao durante alteracoes frequentes no produto.

Qual pratica contribui diretamente para esse objetivo?
```

O enunciado pode usar Markdown normal:

- negrito;
- italico;
- listas;
- tabelas;
- links;
- blocos de codigo;
- multiplos paragrafos.

## Alternativas

Cada questao precisa ter uma secao `## Alternativas`.

As alternativas devem ser escritas com letras de `A` ate `H`, seguidas de ponto.

Exemplo:

```md
## Alternativas

A. Remover testes antigos para acelerar o desenvolvimento.

B. Manter uma suite automatizada executada continuamente.

C. Concentrar validacao apenas ao final do projeto.

D. Evitar revisao de codigo para reduzir tempo de entrega.
```

Regras:

- cada questao deve ter pelo menos 2 alternativas;
- cada questao pode ter no maximo 8 alternativas;
- as letras nao podem repetir;
- a ordem das alternativas no arquivo sera a ordem exibida na plataforma;
- a alternativa indicada em `correct` precisa existir.

Alternativas com mais de um paragrafo tambem sao permitidas:

```md
A. A funcao soma todos os valores do array.

B. A funcao altera o array original.

   Esta alternativa tem uma observacao adicional.

C. A funcao retorna sempre zero.
```

## Explicacao

A secao `## Explicacao` e opcional.

Use essa secao para explicar por que a alternativa correta esta correta.

Exemplo:

```md
## Explicacao

Uma suite automatizada ajuda a detectar regressao logo apos mudancas no codigo.
```

Se a questao ainda nao tiver explicacao, a secao pode ser omitida.

## Exemplo completo

````md
# Lote de questoes - Engenharia de Software

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

## Duplicatas

A plataforma bloqueara questoes duplicadas.

Isso vale para:

- `externalId` repetido dentro do arquivo;
- questoes repetidas dentro do mesmo arquivo;
- questoes que ja existem na plataforma.

Na pratica, evite cadastrar duas questoes com o mesmo enunciado. A plataforma considerara duplicata qualquer questao com o mesmo texto de enunciado, mesmo que as alternativas, resposta correta ou grande area sejam diferentes.

## Checklist antes de enviar

Antes de importar, revise:

- cada questao comeca com `--- question`;
- cada questao tem `externalId`;
- nenhum `externalId` esta repetido;
- `subjectField` ja existe na plataforma;
- `difficulty` usa `EASY`, `MEDIUM` ou `HARD`;
- `correct` aponta para uma alternativa existente;
- existe uma secao `## Enunciado`;
- existe uma secao `## Alternativas`;
- cada questao tem de 2 a 8 alternativas;
- o arquivo nao contem questoes duplicadas.

## Erros comuns

### Esquecer o fechamento dos metadados

Incorreto:

```md
--- question
externalId: ES-001
subjectField: Engenharia de Software
difficulty: MEDIUM
correct: B

## Enunciado
```

Correto:

```md
--- question
externalId: ES-001
subjectField: Engenharia de Software
difficulty: MEDIUM
correct: B
---

## Enunciado
```

### Usar alternativa correta inexistente

Incorreto:

```md
correct: E

## Alternativas

A. Alternativa A.
B. Alternativa B.
C. Alternativa C.
D. Alternativa D.
```

Nesse caso, `E` nao existe.

### Repetir externalId

Incorreto:

```md
--- question
externalId: ES-001
---

--- question
externalId: ES-001
---
```

Cada questao precisa ter um `externalId` unico dentro do arquivo.

## Resumo

O time de produto deve preparar um arquivo Markdown unico, com uma ou mais questoes no formato `--- question`.

Cada questao precisa ter metadados, enunciado e alternativas. A explicacao e opcional. O arquivo sera validado antes da importacao, e qualquer erro bloqueia o lote inteiro ate ser corrigido.
