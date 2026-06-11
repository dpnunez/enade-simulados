# HTTP Client
> Shared ky instance for client-side API requests

Entry: `src/infra/http/client.ts`

Default: import `http` from `@infra/http/client` for app API requests.
- `http` uses `ky.create()` with prefix `/api`
- Login first migrated use: `src/app/login/_components/login-form.tsx:onSubmit()`
- Remaining legacy `fetch` calls intentionally untouched in first migration

Better Auth login: POST `auth/sign-in/email` via `http` → `/api/auth/sign-in/email`
- Error path catches `HTTPError` and reads response JSON `message`
- Success path keeps router push/refresh to `/app`

Invitation forms:
- `src/app/app/admin/_components/invite-form.tsx` POSTs `invitations`
- `src/app/convites/[token]/_components/accept-invite-form.tsx` POSTs `invitations/accept`
- Both catch `HTTPError` and map API `error` codes to user-friendly messages

Updated: 2026-06-11
