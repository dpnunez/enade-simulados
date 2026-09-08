# Summary: Exibir explicacao da resposta ao aluno

## Result

A revisao do simulado agora mostra a explicacao da resposta abaixo das alternativas para questoes acertadas e erradas. O conteudo reutiliza o renderer Markdown seguro existente e o bloco e omitido quando nao ha explicacao cadastrada.

## Verification

- Teste de componente: 2 cenarios aprovados, um correto e um incorreto.
- Suite unitaria: 235 testes aprovados.
- Lint direcionado: aprovado nos arquivos da hotfix.
- Build de producao: aprovado.
- E2E direcionado: nao executado porque o Docker Desktop estava inativo e o PostgreSQL de teste recusou conexao em `localhost:5432`; o cenario recebeu as assercoes da hotfix.
- Lint global: bloqueado por artefatos preexistentes em `playwright-report/`, fora do escopo da hotfix.

## Commit

`fix(simulados): exibir explicacao na revisao do aluno`
