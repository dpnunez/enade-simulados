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
│   │   └── login/
│   ├── auth/
│   ├── components/
│   │   └── ui/
│   ├── infra/
│   │   └── db/
│   ├── lib/
│   └── tests/
│       ├── e2e/
│       └── setup/
└── config files
```

## Module Organization

### App Router

**Purpose:** Pages, layouts, route handlers, and private app shell.
**Location:** `src/app`
**Key files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/app/layout.tsx`, `src/app/api/auth/[...all]/route.ts`

### Authentication

**Purpose:** Better Auth configuration, client helpers, session/role helpers.
**Location:** `src/auth`
**Key files:** `src/auth/auth.ts`, `src/auth/auth-client.ts`, `src/auth/session.ts`, `src/auth/roles.ts`

### UI Components

**Purpose:** Local shadcn-style primitives.
**Location:** `src/components/ui`
**Key files:** `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `alert.tsx`, `badge.tsx`, `separator.tsx`

### Database

**Purpose:** Prisma schema, migrations, and client singleton.
**Location:** `prisma`, `src/infra/db`
**Key files:** `prisma/schema.prisma`, `src/infra/db/prisma.ts`, `prisma.config.ts`

### Tests

**Purpose:** Unit setup and browser E2E coverage.
**Location:** `src/tests`, colocated unit tests in source folders
**Key files:** `src/auth/session.test.ts`, `src/tests/e2e/login.spec.ts`, `src/tests/e2e/admin-authorization.spec.ts`, `src/tests/e2e/global-setup.ts`

### Scripts

**Purpose:** Deterministic users and E2E orchestration.
**Location:** `scripts`
**Key files:** `scripts/seed-users.ts`, `scripts/e2e/prepare-test-db.ts`, `scripts/e2e/start-web-server.ts`

## Where Things Live

**Authentication:**

- UI/Interface: `src/app/login/page.tsx`, `src/app/app/logout-button.tsx`
- Business Logic: `src/auth/session.ts`, `src/auth/auth.ts`
- Data Access: Better Auth via Prisma models in `prisma/schema.prisma`
- Configuration: `.env.example`, `.env.test`, `src/app/api/auth/[...all]/route.ts`

**Authorization by Role:**

- UI/Interface: `src/app/app/admin/page.tsx`, `src/app/app/student/page.tsx`, `src/app/app/teacher/page.tsx`
- Business Logic: `requireRole` in `src/auth/session.ts`
- Data Access: `User.role` enum in Prisma
- Tests: `src/auth/session.test.ts`, `src/tests/e2e/admin-authorization.spec.ts`

**Database Setup:**

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Client: `src/infra/db/prisma.ts`
- Local database: `docker-compose.yml`

## Special Directories

**`.specs`:** TLC planning and codebase documentation.

**`src/generated/prisma`:** Generated Prisma client output. It is referenced by aliases but not manually edited.

**`src/tests/e2e/fixtures`:** Deterministic Playwright fixture data, currently seeded users.
