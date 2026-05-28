# Roadmap

**Current Milestone:** Fundacao autenticada do produto
**Status:** In Progress

---

## Milestone 1: Fundacao autenticada do produto

**Goal:** Entregar a base técnica navegável com autenticação, autorização por role, seed de usuários e experiência inicial coerente para evolução do produto.
**Target:** Considerado concluído quando login, logout, proteção de rotas e smoke tests E2E estiverem estáveis.

### Features

**Autenticação por email e senha** - COMPLETE

- Login com usuários seed determinísticos
- Sessão persistida com Better Auth
- Integração com Prisma e PostgreSQL

**Autorização por role** - COMPLETE

- Perfis `ADMIN`, `TEACHER` e `STUDENT`
- Rotas privadas protegidas
- Restrições básicas para áreas administrativas

**Base visual do MVP** - COMPLETE

- Home pública inicial
- Tela de login
- Layout privado reutilizável com `shadcn/ui`

**Convites e gestão inicial de usuários** - COMPLETE

- Admins criam convites para alunos e professores
- Cadastro público permanece desativado; novos usuários entram apenas por convite
- Admins listam usuários, acompanham convites pendentes e cancelam convites

---

## Milestone 2: Banco acadêmico e operação do professor

**Goal:** Permitir que professores mantenham a base pedagógica mínima para os simulados.

### Features

**Gestão de grandes áreas** - PLANNED

- Criar, listar e editar grandes áreas como agrupadores de matérias
- Registrar título, descrição, cor hexadecimal e professor criador
- Preparar base para a futura relação entre grandes áreas e matérias

**Gestão de matérias** - PLANNED

- Criar, listar, editar e remover matérias
- Estruturar relação entre matérias e questões

**Gestão de questões** - PLANNED

- Criar questões objetivas com alternativas
- Definir resposta correta, explicação e dificuldade
- Associar cada questão a uma grande área
- Editar enunciado markdown com `@mdxeditor/editor`
- Suportar anexos/imagens quando necessário em fase futura

**Rollup de questões em grandes áreas** - PLANNED

- Mostrar quantidade de questões por grande área
- Deletar grande área com cascade para questões e alternativas
- Implementar somente após a gestão de questões

**Experiência administrativa inicial** - PLANNED

- Navegação clara para professores e administradores
- Feedbacks de formulário e estados vazios

---

## Milestone 3: Simulados e desempenho do aluno

**Goal:** Viabilizar o fluxo principal de estudo do aluno, do início do simulado até a visualização do resultado.

### Features

**Realização de simulados** - PLANNED

- Montagem e entrega de simulados a partir das questões cadastradas
- Fluxo de resposta no navegador

**Correção automática** - PLANNED

- Validação de respostas
- Exibição de acertos, erros e explicações

**Histórico e desempenho** - PLANNED

- Registro de tentativas
- Visão simples de desempenho geral e por disciplina

---

## Future Considerations

- Relatórios acadêmicos mais completos
- Filtros por dificuldade e cobertura por tema
- Geração inteligente de simulados
- Gamificação, ranking e trilhas de estudo
