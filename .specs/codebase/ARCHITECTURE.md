# Architecture

**Analyzed:** 2026-05-25

**Pattern:** Small modular Next.js monolith with App Router, centralized auth/session helpers, Prisma data access, and local UI components.

## High-Level Structure

```mermaid
flowchart TD
    Browser --> Proxy["src/proxy.ts"]
    Proxy --> AppRouter["src/app routes/layouts/pages"]
    AppRouter --> Session["src/auth/session.ts"]
    Session --> BetterAuth["src/auth/auth.ts"]
    BetterAuth --> Prisma["src/infra/db/prisma.ts"]
    Prisma --> Postgres["PostgreSQL 17"]
    AppRouter --> UI["src/components/ui"]
    AppRouter --> AuthRoute["src/app/api/auth/[...all]/route.ts"]
    AuthRoute --> BetterAuth
```

## Identified Patterns

### App Router Route Segments

**Location:** `src/app`
**Purpose:** UI routing, layouts, public/private route separation.
**Implementation:** Public pages live at root routes such as `src/app/page.tsx` and `src/app/login/page.tsx`; authenticated pages live below `src/app/app`.
**Example:** `src/app/app/layout.tsx` requires authentication once and wraps all private child pages.

### Optimistic Proxy Protection

**Location:** `src/proxy.ts`
**Purpose:** Redirect obvious unauthenticated private route access before rendering.
**Implementation:** `getSessionCookie(request)` checks for a Better Auth session cookie. `/app/:path*` redirects to `/login` without a cookie; `/login` redirects to `/app` when a session cookie exists.
**Example:** `config.matcher = ["/app/:path*", "/login"]`.

### Server-Side Authorization Helpers

**Location:** `src/auth/session.ts`
**Purpose:** Centralize real session lookup and role authorization.
**Implementation:** `getCurrentSession()` calls `auth.api.getSession` with `next/headers`; `requireAuth()` redirects to `/login`; `requireRole(role)` redirects unauthorized users to `/app`.
**Example:** `src/app/app/admin/page.tsx` calls `requireRole("ADMIN")`.

### Better Auth Route Handler

**Location:** `src/app/api/auth/[...all]/route.ts`
**Purpose:** Expose Better Auth HTTP endpoints to Next.js.
**Implementation:** `toNextJsHandler(auth)` exports `GET` and `POST`.
**Example:** Login uses `signIn.email` from `src/auth/auth-client.ts`, which talks to these endpoints.

### Prisma Client Singleton

**Location:** `src/infra/db/prisma.ts`
**Purpose:** Provide one Prisma client, reusing it during development reloads.
**Implementation:** Uses `PrismaPg` adapter and stores the client on `global` outside production.
**Example:** `scripts/seed-users.ts` imports `prisma` from `@infra/db/prisma`.

### shadcn-Style UI Components

**Location:** `src/components/ui`
**Purpose:** Reusable UI primitives aligned with shadcn conventions.
**Implementation:** Components use `React.forwardRef`, `cn`, Radix primitives where applicable, and `class-variance-authority` for variants.
**Example:** `src/components/ui/button.tsx` exports `Button` and `buttonVariants`.

## Data Flow

### Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Login as src/app/login/page.tsx
    participant Client as src/auth/auth-client.ts
    participant Route as /api/auth/[...all]
    participant Auth as Better Auth
    participant DB as Prisma/PostgreSQL

    User->>Login: submits email/password
    Login->>Client: signIn.email()
    Client->>Route: auth request
    Route->>Auth: Better Auth handler
    Auth->>DB: verify account/password
    Auth-->>Client: session cookie/result
    Login->>Login: router.push("/app")
```

### Private Page Access

```mermaid
sequenceDiagram
    actor User
    participant Proxy as src/proxy.ts
    participant Layout as src/app/app/layout.tsx
    participant Session as src/auth/session.ts
    participant Auth as Better Auth

    User->>Proxy: GET /app/*
    Proxy->>Proxy: check session cookie
    Proxy->>Layout: allow render when cookie exists
    Layout->>Session: requireAuth()
    Session->>Auth: getSession(headers)
    Auth-->>Layout: session or null
    Layout-->>User: private shell or redirect
```

### E2E Test Flow

`playwright.config.ts` runs `src/tests/e2e/global-setup.ts`, which loads `.env.test`, runs `pnpm e2e:prepare`, creates the test database if missing, deploys migrations, and seeds deterministic users. The web server builds and starts Next on port `3001`.

## Code Organization

**Approach:** Layered by framework area plus small domain folders. Current domain is mostly authentication; future features are expected to add focused modules under `src`.

**Structure:**

- `src/app`: App Router pages, layouts, and route handlers
- `src/auth`: Better Auth config, client, session helpers, role constants, unit tests
- `src/components/ui`: shadcn-style primitives
- `src/infra/db`: Prisma client infrastructure
- `src/tests`: setup and E2E test suite
- `scripts`: seed and E2E database/server orchestration
- `prisma`: schema and migrations

**Module boundaries:** Auth and database helpers are imported through TypeScript aliases (`@auth/*`, `@infra/*`, `@prisma-generated-client`, `@/*`). UI primitives are local and imported from `@/components/ui/*`.
