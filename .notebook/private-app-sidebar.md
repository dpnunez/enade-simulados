# Private App Sidebar
> Protected `/app` shell navigation by authenticated user role

Entry: `src/app/app/layout.tsx`

- The protected layout stays a Server Component and calls `src/infra/auth/session.ts:requireAuth()`.
- It passes a minimal user DTO into `src/app/app/app-sidebar.tsx`, casting `session.user.role` to the Prisma `Role` enum because Better Auth exposes the additional field as `string`.
- `src/app/app/app-sidebar.tsx` is a Client Component so it can use `next/navigation:usePathname()` for active links and `@auth/client:signOut()` for logout.
- Role-specific navigation lives in `ROLE_NAV_ITEMS`:
  - `ADMIN`: `/app/admin`
  - `STUDENT`: `/app/student`, `/app/student/simulados/novo`, `/app/student/simulados`
  - `TEACHER`: `/app/professor`, `/app/professor/grandes-areas`, `/app/professor/questoes`, `/app/professor/ranking`
- The root layout wraps the app with `src/components/ui/tooltip.tsx:TooltipProvider` because shadcn Sidebar tooltips depend on it when collapsed.

Updated: 2026-06-20
