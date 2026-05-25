# Tech Stack

**Analyzed:** 2026-05-25

## Core

- Framework: Next.js 16.2.6 with App Router
- UI runtime: React 19.2.4 / React DOM 19.2.4
- Language: TypeScript 5 with `strict: true`
- Package manager: pnpm, inferred from `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and scripts
- Runtime scripts: `tsx` for local TypeScript scripts

## Frontend

- UI framework: React 19 via Next.js App Router
- Styling: Tailwind CSS 4 with `@tailwindcss/postcss`
- Component system: shadcn-style local components in `src/components/ui`
- Primitive UI dependencies: Radix Slot, Label, Separator
- Icons: `lucide-react`
- Utility styling: `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`
- State/form handling: local React state and native forms; no dedicated form library observed

## Backend

- API style: Next.js Route Handlers under `src/app/api`
- Authentication: Better Auth 1.6.11 with `better-auth/next-js`
- Auth persistence: Better Auth Prisma adapter with PostgreSQL
- ORM: Prisma 7.8.0, generated client output to `src/generated/prisma`
- Database: PostgreSQL 17 via Docker Compose
- Database adapter: `@prisma/adapter-pg` with `pg`

## Testing

- Unit/integration-light: Vitest 3.2.4
- React/browser-like unit environment: jsdom 26.1.0
- Assertions: `@testing-library/jest-dom`
- Component testing library present: `@testing-library/react`
- E2E: Playwright 1.56.0, Chromium project

## External Services

- Database: local PostgreSQL container from `docker-compose.yml`
- Authentication/session service: Better Auth hosted inside the Next.js app, not external SaaS
- Email/file storage/queues: none implemented yet

## Development Tools

- Linting: ESLint 9 with `eslint-config-next` 16.2.6
- Build: `next build`
- Database workflows: `prisma generate`, `prisma migrate dev`, `prisma migrate deploy`, `prisma studio`
- E2E database setup: custom scripts in `scripts/e2e`
