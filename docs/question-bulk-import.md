# Cadastro de questoes em massa

## Contexto atual

O cadastro de questoes hoje parte do formulario individual da area de professor e passa pelo mesmo contrato de dominio em `src/features/questions/question.schema.ts` e `src/features/questions/question.service.ts`.

Cada questao precisa ter:

- enunciado em Markdown;
- dificuldade: `EASY`, `MEDIUM` ou `HARD`;
- grande area existente (`subjectFieldId`);
- fonte opcional: `ENADE`, `MANUAL`, `ADAPTED` ou `OTHER`;
- ano opcional entre 1998 e 2100;
- explicacao opcional da resposta correta;
- de 2 a 8 alternativas;
- exatamente 1 alternativa correta.

Isso significa que qualquer importacao em massa deve reaproveitar o schema atual de questoes, ou uma variacao dele, para evitar regras duplicadas entre formulario, API e importador.

## Problema a resolver

Cadastrar questoes uma a uma e adequado para poucos itens, revisao cuidadosa e ajustes pontuais. Para montar uma base inicial, migrar questoes de outra fonte ou preparar listas grandes de exercicios, o fluxo individual fica lento e sujeito a erro operacional.

O objetivo do bulk import nao deve ser apenas "inserir varias linhas no banco". Ele precisa ajudar em tres momentos:

- preparar os dados em um formato previsivel;
- validar tudo antes de gravar;
- deixar claro quais linhas foram criadas e quais falharam.

## Opcoes consideradas

### 1. Importacao por CSV na plataforma

Nesta opcao, a propria interface permitiria baixar um modelo CSV, preencher as questoes e enviar o arquivo para validacao/importacao.

Exemplo de colunas:

```csv
subjectFieldTitle,difficulty,source,year,descriptionMarkdown,alternativeA,alternativeB,alternativeC,alternativeD,alternativeE,correctAlternative,correctAnswerExplanation
"Engenharia de Software",MEDIUM,ENADE,2024,"Enunciado em Markdown","Alternativa A","Alternativa B","Alternativa C","Alternativa D","Alternativa E",B,"Explicacao"
```

Vantagens:

- acessivel para professores e admins nao tecnicos;
- funciona bem com planilhas;
- reduz dependencia de pessoas com acesso ao ambiente ou ao banco;
- pode oferecer uma pre-visualizacao com erros por linha antes de gravar.

Desvantagens:

- CSV fica ruim para conteudo Markdown longo, quebras de linha, tabelas, codigo e formulas;
- alternativas variaveis exigem convencao de colunas (`alternativeA` ate `alternativeH`);
- exige cuidado com encoding, separador, aspas e quebras de linha;
- precisa de uma boa tela de validacao para nao virar uma experiencia frustrante.

Quando faz sentido:

- quando professores ou equipe pedagogica devem conseguir importar questoes sem suporte tecnico;
- quando a maioria das questoes tem estrutura simples;
- quando o projeto ja quer tratar bulk import como funcionalidade de produto.

### 2. Script interno de importacao

Nesta opcao, o cadastro em massa ficaria fora da interface, por exemplo em `scripts/import-questions.ts`, lendo um arquivo local versionado ou entregue para a equipe tecnica.

O script poderia aceitar CSV, JSON ou Markdown estruturado, validar com Zod e gravar via Prisma usando a mesma regra de criacao.

Vantagens:

- menor custo inicial de implementacao;
- bom para carga inicial, migracoes controladas e dados seed;
- permite logs detalhados e execucao em ambiente controlado;
- evita expor uma superficie nova de upload e autorizacao na plataforma.

Desvantagens:

- depende de alguem tecnico para rodar;
- menos adequado para uso recorrente por professores;
- mais facil gerar divergencia se o script nao reaproveitar os servicos/schemas atuais;
- exige processo claro para revisar o arquivo antes da importacao.

Quando faz sentido:

- quando a necessidade principal e popular a base uma vez ou poucas vezes;
- quando ainda nao esta claro se bulk import sera fluxo frequente;
- quando os dados precisam passar por curadoria tecnica antes de entrar no sistema.

### 3. JSON estruturado

Nesta opcao, o arquivo de entrada seria um array de objetos parecido com o contrato atual da API.

Exemplo:

```json
[
  {
    "subjectFieldTitle": "Engenharia de Software",
    "descriptionMarkdown": "Enunciado em Markdown",
    "difficulty": "MEDIUM",
    "source": "ENADE",
    "year": 2024,
    "correctAnswerExplanation": "Explicacao",
    "alternatives": [
      { "contentMarkdown": "Alternativa A", "isCorrect": false },
      { "contentMarkdown": "Alternativa B", "isCorrect": true },
      { "contentMarkdown": "Alternativa C", "isCorrect": false }
    ]
  }
]
```

Vantagens:

- representa melhor listas de alternativas variaveis;
- evita varias ambiguidades do CSV;
- fica mais proximo do schema atual da aplicacao;
- e mais facil validar e transformar programaticamente.

Desvantagens:

- menos amigavel para usuarios nao tecnicos;
- edicao manual em grande volume e mais chata que planilha;
- erros de sintaxe podem bloquear o arquivo inteiro se a ferramenta nao ajudar.

Quando faz sentido:

- quando a importacao sera operada por pessoas tecnicas;
- quando as questoes tem Markdown mais complexo;
- quando queremos primeiro construir um importador robusto antes de investir em UI.

#### Como o JSON suporta descricao em Markdown

Markdown e texto. No JSON, ele entra como uma string comum em `descriptionMarkdown`, `contentMarkdown` ou `correctAnswerExplanation`.

Para textos curtos, isso fica simples:

```json
{
  "descriptionMarkdown": "Analise a afirmacao: **testes automatizados reduzem regressao**.",
  "alternatives": [
    { "contentMarkdown": "Apenas a afirmacao I esta correta.", "isCorrect": false },
    { "contentMarkdown": "As afirmacoes I e II estao corretas.", "isCorrect": true }
  ]
}
```

Para textos com paragrafos, listas ou blocos de codigo, o JSON precisa escapar quebras de linha com `\n`:

```json
{
  "descriptionMarkdown": "Considere o trecho abaixo:\n\n```ts\nfunction soma(a: number, b: number) {\n  return a + b;\n}\n```\n\nQual alternativa descreve corretamente a funcao?",
  "alternatives": [
    { "contentMarkdown": "Ela retorna a soma dos parametros.", "isCorrect": true },
    { "contentMarkdown": "Ela altera os parametros recebidos.", "isCorrect": false }
  ]
}
```

Isso funciona tecnicamente, mas nao e tao confortavel para edicao manual. Se o volume tiver muito Markdown longo, ha tres alternativas melhores:

- gerar o JSON a partir de uma planilha, ferramenta ou script auxiliar;
- usar arquivos `.md` separados e o JSON apenas referencia-los, por exemplo `"descriptionMarkdownFile": "./questoes/q001.md"`;
- adotar Markdown estruturado como formato autoral e converter para o mesmo contrato interno antes de importar.

Minha preferencia: manter JSON como formato canonico da maquina, mas nao necessariamente como formato final de autoria para humanos.

### 4. Markdown estruturado

Outra possibilidade e um arquivo `.md` com convencoes explicitas por questao.

Exemplo:

```md
---
subjectFieldTitle: Engenharia de Software
difficulty: MEDIUM
source: ENADE
year: 2024
correctAlternative: B
---

# Questao

Enunciado em Markdown.

## Alternativas

A. Alternativa A
B. Alternativa B
C. Alternativa C

## Explicacao

Explicacao da resposta correta.
```

Vantagens:

- excelente para enunciados longos em Markdown;
- legivel em revisao de texto;
- bom para versionar e revisar em pull request;
- mais natural para conteudo pedagogico do que CSV.

Desvantagens:

- parser proprio tende a ser mais trabalhoso;
- precisa de convencoes muito claras para separar questoes;
- menos familiar para quem prefere planilha;
- pode virar fonte de bugs se a gramatica crescer demais.

Quando faz sentido:

- quando as questoes possuem enunciados ricos, imagens futuras, blocos de codigo ou tabelas;
- quando a equipe trabalha bem com arquivos versionados;
- quando revisao editorial importa mais que edicao em planilha.

## Plataforma versus script

A decisao principal nao e apenas "CSV ou nao". E decidir quem vai operar o bulk import e com que frequencia.

Se o fluxo for recorrente e parte da rotina de professores, ele deve estar na plataforma. Nesse caso, a experiencia minima deveria ter:

- botao para baixar modelo;
- upload do arquivo;
- validacao sem gravar;
- tabela de pre-visualizacao com status por linha;
- mensagens de erro acionaveis;
- importacao final somente das linhas validas ou bloqueio total ate corrigir tudo;
- permissao restrita a `TEACHER` ou talvez apenas `ADMIN`, dependendo da regra pedagogica.

Se o fluxo for carga inicial, migracao ou operacao rara, um script interno e mais seguro e barato. Nesse caso, a experiencia minima deveria ter:

- modo `dry-run`;
- relatorio de erros por item;
- resolucao de grande area por titulo normalizado ou id;
- contador de criadas, ignoradas e invalidas;
- opcao de falhar tudo ao primeiro erro ou validar o lote inteiro antes de gravar.

## Recomendacao

Eu seguiria uma abordagem em fases.

### Fase 1: importador interno com contrato compartilhado

Criar um script de importacao, preferencialmente aceitando JSON estruturado primeiro. O JSON representa melhor o modelo atual e evita a complexidade inicial de CSV com Markdown longo.

O script deve:

- ler um arquivo de entrada;
- validar cada questao com Zod;
- resolver `subjectFieldTitle` para `subjectFieldId`;
- fazer `dry-run` por padrao;
- gravar somente quando receber uma flag explicita;
- retornar um relatorio com erros por indice/linha;
- usar transacao para garantir consistencia do lote, ou pelo menos registrar claramente o modo parcial.

Essa fase entrega valor rapido e cria a camada de importacao que a UI pode reaproveitar depois.

### Fase 2: suporte a CSV como adaptador

Depois que o contrato interno estiver estavel, adicionar um conversor CSV -> JSON interno.

O CSV nao deveria ser o modelo central. Ele deveria ser apenas um formato de entrada amigavel que vira o mesmo objeto validado pelo importador.

Para CSV, eu usaria uma convencao simples:

- uma linha por questao;
- colunas fixas para `alternativeA` ate `alternativeH`;
- coluna `correctAlternative` com letras `A` a `H`;
- campos vazios ignorados nas alternativas;
- `subjectFieldTitle` como forma principal para humanos;
- `subjectFieldId` opcional para operacoes tecnicas.

### Fase 3: UI de importacao na plataforma

Se o uso se provar recorrente, criar uma tela em `app/professor/questoes/importar`.

A tela deve primeiro validar e pre-visualizar. A importacao final deve ser uma acao consciente, com resumo do impacto.

Nesse ponto, a API de bulk import pode reaproveitar a mesma logica do script. A diferenca passa a ser o transporte: arquivo via UI em vez de arquivo local.

## Decisoes de produto pendentes

Antes de implementar a UI, vale decidir:

- professores podem importar questoes diretamente ou apenas admins?
- questoes importadas entram publicadas imediatamente ou precisam de revisao?
- importacao parcial e aceitavel ou o lote inteiro deve falhar se houver qualquer erro?
- como lidar com duplicatas?
- a grande area sera identificada por titulo, id ou ambos?
- queremos guardar historico do arquivo importado?
- ha necessidade de anexos/imagens nas questoes em curto prazo?

## Riscos principais

### Duplicatas

Hoje o modelo nao tem uma chave natural de duplicidade para questoes. Uma importacao pode criar o mesmo enunciado varias vezes.

Mitigacoes possiveis:

- gerar hash normalizado de `descriptionMarkdown` + alternativas;
- alertar duplicatas dentro do proprio arquivo;
- alertar possiveis duplicatas contra o banco;
- inicialmente apenas reportar, sem bloquear.

### Grande area inexistente

Como `Question.subjectFieldId` e obrigatorio, todo importador precisa resolver a grande area antes de gravar.

Mitigacao recomendada:

- aceitar `subjectFieldTitle` para uso humano;
- normalizar titulo como o fluxo de grandes areas ja faz;
- mostrar erro claro quando nao encontrar correspondencia;
- nunca criar grande area automaticamente durante importacao de questoes, a menos que isso vire uma decisao explicita de produto.

### CSV com Markdown complexo

CSV suporta texto longo, mas a experiencia e fragil quando ha quebras de linha, aspas, tabelas e listas.

Mitigacao recomendada:

- manter JSON como formato canonico tecnico;
- oferecer CSV apenas para casos simples;
- documentar escaping e disponibilizar modelo;
- validar e pre-visualizar antes de gravar.

### Importacoes grandes

Uploads grandes podem estourar tempo de request ou gerar falhas parciais dificeis de entender.

Mitigacoes possiveis:

- limitar tamanho do lote na UI;
- processar em chunks;
- usar job assincrono se o volume crescer;
- comecar com limite pequeno e previsivel, por exemplo 100 ou 500 questoes por arquivo.

## Modelo de implementacao sugerido

A melhor arquitetura e separar importacao de transporte.

Camadas sugeridas:

- `question.schema.ts`: continua validando uma questao individual;
- `question-import.schema.ts`: valida o item bruto de importacao;
- `question-import.service.ts`: resolve grandes areas, valida lote, detecta duplicatas e cria relatorio;
- `scripts/import-questions.ts`: interface de linha de comando;
- `app/api/questions/import/route.ts`: futura interface HTTP;
- `app/app/professor/questoes/importar/page.tsx`: futura UI.

Assim, script e plataforma usam a mesma regra de dominio.

## Execucao em producao

Rodar um script de importacao em producao e possivel, mas ele deve ser tratado como operacao administrativa sensivel, nao como comando casual.

O script deveria ser criado para ser seguro por padrao:

- `dry-run` como comportamento padrao;
- gravacao somente com flag explicita, por exemplo `--apply`;
- exigencia de um ator, por exemplo `--actor-email professor@...` ou `--actor-id ...`;
- relatorio antes de gravar;
- validacao do lote inteiro antes da primeira escrita;
- opcao de transacao unica para cargas pequenas;
- protecao extra em producao, por exemplo exigir `IMPORT_CONFIRM_PRODUCTION=import-questions`;
- logs com totais de validas, invalidas, duplicadas e criadas.

Exemplo de comando local contra ambiente configurado:

```bash
pnpm exec tsx scripts/import-questions.ts data/questions.json --dry-run
pnpm exec tsx scripts/import-questions.ts data/questions.json --apply --actor-email teacher@enade.local
```

Para producao, eu consideraria tres caminhos.

### Caminho A: executar dentro do servidor/container de producao

Entrar no mesmo ambiente onde a aplicacao roda, com `DATABASE_URL` de producao ja configurado, copiar ou montar o arquivo de importacao e executar o script.

Exemplo conceitual:

```bash
IMPORT_CONFIRM_PRODUCTION=import-questions pnpm exec tsx scripts/import-questions.ts /tmp/questions.json --apply --actor-email professor@enade.local
```

Vantagens:

- usa a mesma rede e variaveis da aplicacao;
- evita expor o banco para a maquina local;
- e simples para uma VPS ou container com shell administrativo.

Cuidados:

- garantir que o artefato de producao tenha o script disponivel;
- garantir que `tsx` esteja instalado ou que o script seja compilado para JS;
- remover arquivos sensiveis depois da execucao.

### Caminho B: job manual no CI/CD

Criar um workflow manual, por exemplo no GitHub Actions, que recebe o arquivo ou usa um arquivo versionado/aprovado e roda o importador com secrets de producao.

Vantagens:

- deixa trilha de auditoria;
- reduz acesso direto ao servidor;
- permite aprovar/revisar antes de rodar.

Cuidados:

- nao colocar questoes sensiveis em logs;
- proteger o workflow com permissao restrita;
- separar `dry-run` e `apply`.

### Caminho C: API administrativa interna

Criar um endpoint protegido para importacao e acionar pela UI ou por uma ferramenta interna.

Vantagens:

- melhor experiencia para usuarios autorizados;
- reaproveita autenticacao e autorizacao da aplicacao;
- permite historico de importacoes.

Cuidados:

- aumenta superficie de upload;
- exige limites de tamanho, validacao, autorizacao e talvez processamento assincrono;
- so vale a pena se importacao for recorrente.

Minha recomendacao operacional: para as primeiras cargas reais, usar `Caminho A` se houver acesso administrativo ao servidor/container, ou `Caminho B` se o deploy ja for bem amarrado por CI/CD. Eu evitaria rodar da maquina local apontando para o banco de producao, a menos que seja uma emergencia bem controlada, porque isso mistura credenciais, rede e arquivos locais de um jeito mais arriscado.

### Considerando Vercel + Supabase

Se a aplicacao estiver na Vercel e o banco no Supabase, o `Caminho A` muda bastante. Na Vercel nao ha um servidor tradicional para acessar por SSH e executar um script persistente dentro da maquina de producao. A aplicacao roda em deployments imutaveis e funcoes serverless. Portanto, as opcoes viaveis passam a ser estas.

#### Opcao 1: GitHub Actions manual

Criar um workflow manual (`workflow_dispatch`) que roda o importador com `DATABASE_URL` de producao vindo dos secrets do GitHub.

Fluxo:

- subir o arquivo de questoes como artefato, arquivo versionado privado ou parametro controlado;
- rodar `pnpm install`;
- rodar `pnpm prisma:generate`;
- rodar `pnpm exec tsx scripts/import-questions.ts ... --dry-run`;
- rodar com `--apply` somente quando confirmado.

E a opcao que eu mais recomendaria para as primeiras importacoes em producao.

Vantagens:

- tem trilha de auditoria;
- nao depende de shell na Vercel;
- evita rodar da maquina pessoal;
- usa secrets do CI;
- combina bem com `dry-run` e aprovacao manual.

Cuidados:

- proteger quem pode disparar o workflow;
- evitar imprimir conteudo completo das questoes nos logs;
- usar a connection string adequada do Supabase;
- manter `--apply` separado do `dry-run`.

#### Opcao 2: rodar localmente contra Supabase

Rodar o script da maquina de alguem autorizado apontando `DATABASE_URL` para o Supabase de producao.

Fluxo:

```bash
DATABASE_URL="postgresql://..." pnpm exec tsx scripts/import-questions.ts data/questions.json --dry-run
IMPORT_CONFIRM_PRODUCTION=import-questions DATABASE_URL="postgresql://..." pnpm exec tsx scripts/import-questions.ts data/questions.json --apply --actor-email professor@enade.local
```

Vantagens:

- simples;
- bom para uma emergencia ou carga muito pontual;
- nao exige criar workflow.

Desvantagens:

- pior auditoria;
- risco maior de credencial de producao em maquina local;
- depende da rede local e permissoes de conexao;
- mais facil executar contra o ambiente errado se o script nao tiver protecoes.

Eu deixaria como alternativa possivel, mas nao como caminho principal.

#### Opcao 3: endpoint administrativo na Vercel

Criar uma rota protegida, por exemplo `POST /api/questions/import`, que recebe o arquivo ou JSON, valida e importa.

Fluxo:

- usuario autorizado acessa tela de importacao;
- faz upload;
- servidor valida e retorna preview;
- usuario confirma;
- servidor grava.

Vantagens:

- melhor experiencia de produto;
- usa Better Auth/autorizacao da propria aplicacao;
- professores/admins nao precisam de acesso tecnico;
- permite guardar historico de importacoes no banco.

Cuidados:

- funcoes da Vercel tem limites de duracao e tamanho;
- precisa limitar tamanho do arquivo;
- para lotes grandes, pode precisar de processamento assincrono;
- aumenta superficie de upload;
- precisa ser muito bem protegido por permissao.

Eu usaria essa opcao se importacao virar fluxo frequente. Para comecar, ela e mais cara que o script.

#### Opcao 4: job externo dedicado

Usar um ambiente proprio para jobs, como um runner de CI, container temporario, Railway, Fly.io, Render ou outro worker, apenas para executar tarefas administrativas contra o Supabase.

Vantagens:

- melhor para importacoes grandes;
- nao fica preso aos limites de duracao das funcoes da Vercel;
- pode rodar scripts Node/Prisma normalmente;
- separa app web de operacoes administrativas.

Desvantagens:

- mais uma peca de infraestrutura;
- precisa gerenciar secrets e acesso;
- provavelmente e excesso para o inicio do projeto.

#### Opcao 5: importacao direta pelo Supabase/Postgres

Importar dados direto no Supabase usando SQL, `psql`, staging table ou `COPY`, depois transformar para `Question` e `QuestionAlternative`.

Vantagens:

- muito eficiente para volume grande;
- bom para migracao unica;
- permite transacoes SQL fortes.

Desvantagens:

- bypassa Zod e servicos de dominio;
- mais facil quebrar invariantes da aplicacao;
- exige SQL cuidadoso para alternativas, posicoes e relacoes;
- pior experiencia para validar erros pedagogicos por questao.

Eu so escolheria isso para migracao grande e bem revisada, nao para fluxo normal.

#### Opcao 6: Vercel Cron

Vercel Cron aciona uma rota HTTP agendada. Pode servir para processar uma fila de importacao ou continuar um job em partes.

Para este caso, nao parece a primeira escolha, porque cadastro em massa e uma acao manual, nao uma rotina agendada. Pode fazer sentido depois se a UI gravar um lote pendente e o cron processar chunks.

#### Recomendacao para Vercel + Supabase

Ordem que eu seguiria:

1. GitHub Actions manual rodando o script com `dry-run` e `--apply`.
2. Endpoint/UI na Vercel se a importacao virar rotina de professores/admins.
3. Worker externo apenas se os lotes forem grandes demais para uma funcao da Vercel.
4. SQL direto no Supabase somente para migracao excepcional.

Para o Supabase, o ponto importante e usar a connection string correta. A aplicacao serverless normalmente se beneficia de connection pooling. Scripts e migracoes podem precisar de direct connection ou session pooler, dependendo da operacao e da rede disponivel. Essa escolha deve ser testada em homologacao antes de apontar para producao.

## Minha decisao recomendada

Decisao atualizada: para este projeto, a importacao em massa sera feita por rota administrativa usando Markdown estruturado como formato autoral principal.

A decisao oficial e o formato proposto estao em `docs/question-bulk-import-markdown-format.md`.

Historicamente, este documento recomendava comecar com script interno + JSON estruturado. Essa alternativa continua tecnicamente viavel, mas deixou de ser a direcao escolhida.

Motivos da decisao atual:

- o conteudo principal das questoes ja e Markdown;
- um arquivo Markdown grande e mais legivel para autoria e revisao;
- evita escaping excessivo de quebras de linha em JSON;
- a rota administrativa combina melhor com Vercel + Supabase do que executar scripts em producao;
- a aplicacao ainda pode converter o Markdown estruturado para o mesmo `QuestionInput` validado por Zod.

CSV e JSON podem continuar existindo como formatos internos ou futuros adaptadores, mas nao sao prioridade para a primeira versao.
