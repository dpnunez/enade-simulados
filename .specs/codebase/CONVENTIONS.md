# Code Conventions

**Analyzed:** 2026-05-25

## Naming Conventions

**Files:**

- App Router convention files use `page.tsx`, `layout.tsx`, and `route.ts`.
- Client component helpers use descriptive kebab names such as `logout-button.tsx`.
- Tests use `.test.ts` for unit tests and `.spec.ts` for Playwright E2E.
- Shared UI primitives use lowercase component names: `button.tsx`, `card.tsx`, `input.tsx`.

**Functions/Methods:**

- React components use PascalCase: `LoginPage`, `PrivateLayout`, `AdminPage`, `LogoutButton`.
- Server/auth helpers use camelCase verbs: `getCurrentSession`, `requireAuth`, `requireRole`.
- Test helpers use action names: `loginAs`.

**Variables and Constants:**

- Constants use uppercase object names: `ROLES`, `TEST_USERS`, `AUTH_ROUTES`, `PRIVATE_PREFIXES`.
- Local booleans are prefixed semantically: `hasSessionCookie`, `isPrivateRoute`, `isAuthRoute`.

## Code Organization

**Imports:**

Observed ordering is external packages first, then internal aliases, then relative imports. Examples:

- `src/infra/auth/session.ts`: Next imports, then `@auth/server`, then Prisma type.
- `src/app/app/layout.tsx`: Next/lucide imports, then auth/UI aliases, then relative `LogoutButton`.

**Component structure:**

- Server Components are default unless client interactivity is needed.
- Client Components declare `"use client"` at the top, as seen in `src/app/login/page.tsx` and `src/app/app/logout-button.tsx`.
- Pages generally fetch/authorize at top level and return shadcn-styled JSX.
- New or modified forms use `react-hook-form` for client-side form state, validation feedback, pending/submission ergonomics, and integration with shadcn-style fields.
- Form validation schemas use `zod`; when client-side validation is needed, wire schemas into `react-hook-form` with `@hookform/resolvers/zod`.
- Server-side API handlers/controllers own authorization and trusted `zod` validation; `react-hook-form` is a UI/form-state layer, not a security boundary.
- Route-specific form components should stay close to their route, commonly under `_components`, until they become reusable across multiple surfaces.

**UI style:**

- Tailwind utility classes are used directly in JSX.
- UI primitives use `cn` from `src/lib/utils.ts` to merge class names.
- Icons come from `lucide-react` and are sized with Tailwind classes.

## Type Safety

- TypeScript strict mode is enabled.
- Prisma enum/type imports come from the generated alias `@prisma-generated-client`.
- Component props use explicit types, usually inline `Readonly<{ children: React.ReactNode }>` for layouts.
- Better Auth session type is exported as `Session = typeof auth.$Infer.Session`.

## Error Handling

- Auth redirect helpers rely on Next.js `redirect()` for control flow.
- Login UI stores an error string in React state and shows a destructive `Alert`.
- Scripts throw `Error` for missing env/config and set `process.exitCode` in top-level catch blocks.
- Tests mock redirects by throwing `REDIRECT:/path`, allowing assertions on redirect behavior.

## Testing Style

- Unit tests use Vitest globals imported explicitly from `vitest`.
- Mocks that must exist before import use `vi.hoisted`, as in `src/infra/auth/session.test.ts`.
- E2E tests use user-visible locators: `getByRole`, `getByText`, `getByLabel`.
- Test names are currently written in Portuguese.

## Comments/Documentation

- Code comments are sparse.
- Generated or scaffold comments exist in `prisma/schema.prisma`, `prisma.config.ts`, and `next.config.ts`.
- Product and planning documentation lives in `README.md` and `.specs`.
