# Admin Access Management
> Split admin access management into dedicated users and invitations screens

Entry specs:
- `.specs/features/admin-access-management/spec.md`
- `.specs/features/admin-access-management/design.md`
- `.specs/features/admin-access-management/tasks.md`

Implemented shape:
- Private app routes are wrapped by `src/app/app/_components/query-provider.tsx` for TanStack Query.
- Users live at `/app/admin/usuarios`, rendered by `src/app/app/admin/usuarios/page.tsx` and `src/app/app/admin/usuarios/_components/users-table.tsx`.
- Invitations live at `/app/admin/convites`, rendered by `src/app/app/admin/convites/page.tsx` and route-local client components.
- `/app/admin` is still protected with `requireRole("ADMIN")`, then redirects to `/app/admin/usuarios`.
- ADMIN sidebar entries are split in `src/app/app/app-sidebar.tsx` as "Usuarios" and "Convites".

Data contracts:
- `GET /api/admin/users` returns paginated `{ success, rows, rowCount, page, pageSize, pageCount }` from `src/features/admin-users`.
- `GET /api/invitations` now returns paginated pending invitations in the same page shape.
- `POST /api/invitations` remains compatible with the existing invite form.
- `src/app/app/admin/_components/invite-form.tsx` accepts `onCreated`; the convites page invalidates/refetches invitation queries and resets the table to newest-first first page.

Verification:
- `pnpm test:unit` passed with 206 tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed with 21 browser tests.

Updated: 2026-06-21
