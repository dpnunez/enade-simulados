# Project Structure

**Root:** `/Users/porto/Workspace/ufpel/enade-eng-prod`

## Directory Tree

```text
.
├── .specs/
│   ├── codebase/
│   ├── features/
│   └── project/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── scripts/
│   └── e2e/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── app/
│   │   ├── convites/
│   │   └── login/
│   ├── components/
│   │   ├── markdown/
│   │   └── ui/
│   ├── features/
│   │   ├── invitations/
│   │   ├── questions/
│   │   └── subject-fields/
│   ├── infra/
│   │   ├── auth/
│   │   └── db/
│   ├── lib/
│   └── tests/
│       ├── e2e/
│       └── setup/
└── config files
```

## Feature Organization

### App Router

**Purpose:** Pages, layouts, route handlers, and private app shell.
**Location:** `src/app`
**Key files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/app/layout.tsx`, `src/app/api/auth/[...all]/route.ts`

### Admin User Invitations

**Purpose:** Invite users by email/role, list users and pending invitations, cancel pending invitations, accept invite tokens.
**Location:** `src/features/invitations`, `src/app/api/invitations`, `src/app/convites/[token]`, `src/app/app/admin/_components`
**Key files:** `invitation.service.ts`, `invitation.schema.ts`, `invitation-token.service.ts`, `invitation-email.adapter.ts`, `invite-form.tsx`, `accept-invite-form.tsx`

### Subject Fields

**Purpose:** Teacher-managed grandes areas used to categorize questions.
**Location:** `src/features/subject-fields`, `src/app/api/subject-fields`, `src/app/app/professor/grandes-areas`
**Key files:** `subject-field.service.ts`, `subject-field.schema.ts`, `subject-field-form.tsx`, `subject-fields-list.tsx`

### Questions

**Purpose:** Teacher-managed question bank with Markdown descriptions, alternatives, difficulty, source, year, and subject-field relation.
**Location:** `src/features/questions`, `src/app/api/questions`, `src/app/app/professor/questoes`
**Key files:** `question.service.ts`, `question.schema.ts`, `question-form.tsx`, `questions-list.tsx`, `src/components/markdown/markdown-editor.tsx`

### Authentication

**Purpose:** Better Auth configuration, client helpers, session/role helpers.
**Location:** `src/infra/auth`
**Key files:** `src/infra/auth/server.ts`, `src/infra/auth/client.ts`, `src/infra/auth/session.ts`, `src/infra/auth/roles.ts`

### UI Components

**Purpose:** Local shadcn-style primitives.
**Location:** `src/components/ui`
**Key files:** `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `alert.tsx`, `badge.tsx`, `separator.tsx`

### Features

**Purpose:** Product capability code that is not tied to one route and does not belong to shared infrastructure.
**Location:** `src/features`
**Key files:** `src/features/invitations/*`, `src/features/subject-fields/*`, `src/features/questions/*`

### Database

**Purpose:** Prisma schema, migrations, and client singleton.
**Location:** `prisma`, `src/infra/db`
**Key files:** `prisma/schema.prisma`, `src/infra/db/prisma.ts`, `prisma.config.ts`

### Tests

**Purpose:** Unit setup and browser E2E coverage.
**Location:** `src/tests`, colocated unit tests in source folders
**Key files:** `src/infra/auth/session.test.ts`, feature `*.test.ts` files, `src/tests/e2e/login.spec.ts`, `src/tests/e2e/admin-authorization.spec.ts`, `src/tests/e2e/invitations.spec.ts`, `src/tests/e2e/subject-fields.spec.ts`, `src/tests/e2e/global-setup.ts`

### Scripts

**Purpose:** Deterministic users and E2E orchestration.
**Location:** `scripts`
**Key files:** `scripts/seed-users.ts`, `scripts/e2e/prepare-test-db.ts`, `scripts/e2e/start-web-server.ts`

## Where Things Live

**Authentication:**

- UI/Interface: `src/app/login/page.tsx`, `src/app/app/logout-button.tsx`
- Business Logic: `src/infra/auth/session.ts`, `src/infra/auth/server.ts`
- Data Access: Better Auth via Prisma models in `prisma/schema.prisma`
- Configuration: `.env.example`, `.env.test`, `src/app/api/auth/[...all]/route.ts`

**Authorization by Role:**

- UI/Interface: `src/app/app/admin/page.tsx`, `src/app/app/student/page.tsx`, `src/app/app/teacher/page.tsx`
- Business Logic: `requireRole` in `src/infra/auth/session.ts`
- Data Access: `User.role` enum in Prisma
- Tests: `src/infra/auth/session.test.ts`, `src/tests/e2e/admin-authorization.spec.ts`

**Invitations:**

- UI/Interface: `src/app/app/admin/_components/invite-form.tsx`, `src/app/app/admin/_components/invitations-table.tsx`, `src/app/convites/[token]/_components/accept-invite-form.tsx`
- API: `src/app/api/invitations/route.ts`, `src/app/api/invitations/[invitationId]/cancel/route.ts`, `src/app/api/invitations/accept/route.ts`
- Business Logic: `src/features/invitations/invitation.service.ts`
- Data Access: `Invitation` model in `prisma/schema.prisma`
- Tests: `src/features/invitations/*.test.ts`, `src/tests/e2e/invitations.spec.ts`

**Subject Fields and Questions:**

- UI/Interface: `src/app/app/professor/grandes-areas/*`, `src/app/app/professor/questoes/*`
- API: `src/app/api/subject-fields/*`, `src/app/api/questions/*`
- Business Logic: `src/features/subject-fields/*`, `src/features/questions/*`
- Data Access: `SubjectField`, `Question`, and `QuestionAlternative` models in `prisma/schema.prisma`
- Tests: `src/features/subject-fields/*.test.ts`, `src/features/questions/*.test.ts`, `src/tests/e2e/subject-fields.spec.ts`

**Database Setup:**

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Client: `src/infra/db/prisma.ts`
- Local database: `docker-compose.yml`

## Special Directories

**`.specs`:** TLC planning and codebase documentation.

**`src/generated/prisma`:** Generated Prisma client output. It is referenced by aliases but not manually edited.

**`src/tests/e2e/fixtures`:** Deterministic Playwright fixture data, currently seeded users.
