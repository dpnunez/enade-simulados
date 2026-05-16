# ENADE Eng Prod

Plataforma acadêmica de simulados para apoiar a preparação dos alunos do curso, centralizando questões criadas por professores e fornecendo feedback de desempenho para orientar estudo e melhoria de resultados.

## Contexto

O projeto nasce da necessidade de melhorar o desempenho dos alunos do curso em simulados e avaliações no estilo ENADE, após resultados anteriores considerados insatisfatórios. A proposta é oferecer uma plataforma interna de estudo e acompanhamento para professores e alunos.

## Objetivo

Construir uma plataforma web de simulados onde:

- professores cadastram e organizam questões por matéria;
- alunos resolvem simulados com base nessas questões;
- o sistema acompanha desempenho por disciplina, respostas e evolução.

## Perfis de acesso

### Professor

O professor deve conseguir:

- fazer login em área administrativa;
- visualizar matérias e banco de questões;
- cadastrar, editar e remover questões;
- definir enunciado, alternativas, resposta correta, explicação e dificuldade;
- anexar imagens ou outros apoios visuais quando necessário.

### Aluno

O aluno deve conseguir:

- fazer login em área de estudante;
- acessar simulados gerados a partir das questões cadastradas;
- responder questões e visualizar correção;
- acompanhar desempenho geral e por matéria;
- entender em quais disciplinas está indo melhor ou pior.

## Funcionalidades centrais do MVP

- autenticação com dois perfis: professor e aluno;
- cadastro de matérias;
- cadastro de questões objetivas;
- suporte a imagens nas questões;
- geração e realização de simulados;
- correção automática;
- histórico de tentativas;
- visão simples de desempenho por disciplina.

## Estrutura inicial do domínio

Entidades principais previstas:

- usuários;
- perfis/permissões;
- matérias;
- questões;
- alternativas;
- tentativas de simulado;
- respostas dos alunos;
- métricas de desempenho.

## Dúvidas e viabilidade

Pontos ainda a validar:

- viabilidade técnica de implantação;
- modelagem do banco de dados;
- armazenamento de imagens e arquivos;
- segurança de login e controle de acesso;
- custo de hospedagem e operação;
- esforço necessário para entregar uma versão utilizável.

## Direção recomendada

A primeira entrega deve priorizar simplicidade e uso real pelo curso:

1. login de professor e aluno;
2. cadastro manual de matérias e questões;
3. resolução de simulados;
4. painel básico de desempenho.

Recursos mais avançados podem ficar para fases futuras, como:

- relatórios mais completos;
- filtros por dificuldade;
- geração inteligente de simulados;
- ranking, gamificação ou trilhas de estudo.

## Como rodar localmente

```bash
pnpm install
pnpm db:up
pnpm dev
```

A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

## Scripts úteis

- `pnpm dev` — sobe a aplicação em desenvolvimento
- `pnpm build` — gera build de produção
- `pnpm start` — inicia a build de produção
- `pnpm lint` — executa o lint
- `pnpm db:up` — sobe o PostgreSQL no Docker Compose
- `pnpm db:down` — derruba o PostgreSQL
- `pnpm prisma:generate` — gera o client do Prisma
- `pnpm prisma:migrate` — executa migrações locais
- `pnpm prisma:studio` — abre o Prisma Studio
