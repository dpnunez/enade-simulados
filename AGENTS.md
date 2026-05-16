<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Conceito inicial do projeto

## Contexto

O projeto nasce da necessidade de melhorar o desempenho dos alunos do curso em simulados e avaliações no estilo ENADE, após resultados anteriores considerados insatisfatórios. A ideia é criar uma plataforma interna de estudo e acompanhamento para professores e alunos.

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

Pontos levantados na ideia original que ainda precisam ser validados:

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

## Resumo executivo

Trata-se de uma plataforma acadêmica de simulados para apoiar a preparação dos alunos, centralizando questões criadas por professores e fornecendo feedback de desempenho para orientar estudo e melhoria de resultados do curso.

## Decisões de arquitetura e bibliotecas

- Registrar aqui decisões duráveis sobre stack, arquitetura e bibliotecas relevantes do projeto.
- Formato recomendado: `YYYY-MM-DD — Decisão: <o que foi escolhido>. Contexto/impacto: <por que importa no projeto>`.
- 2026-05-15 — Decisão: usar PostgreSQL em Docker Compose como banco de dados local do projeto. Contexto/impacto: padroniza o ambiente de desenvolvimento e simplifica a subida do banco para o MVP.
- 2026-05-15 — Decisão: usar Prisma como ORM principal. Contexto/impacto: centraliza schema, geração de client e futuras migrações da aplicação.
