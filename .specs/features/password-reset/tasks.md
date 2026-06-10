# Password Reset Tasks

**Design**: `.specs/features/password-reset/design.md`
**Status**: Implemented

---

## Testing Baseline

Use the existing project gates:

| Layer | Required Test Type | Command |
| --- | --- | --- |
| Token/schema/domain helpers | unit | `pnpm test:unit` |
| Password/account/session mutation contracts | unit/integration with mocked Prisma or test DB pattern already used in feature tests | `pnpm test:unit` |
| Browser-visible reset flow | e2e | `pnpm test:e2e` |
| Type/build confidence | build | `pnpm build` |

Before implementing App Router or Route Handler changes, read the relevant Next.js 16 local docs in `node_modules/next/dist/docs/`.

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T8
```

---

## Task Breakdown

### T1: Add Password Reset Data Model

**Status**: Done

**What**: Add `PasswordResetTokenStatus` and `PasswordResetToken` to Prisma, with indexes and cascade relation to `User`.
**Where**: `prisma/schema.prisma`, new Prisma migration.
**Depends on**: None
**Reuses**: `Invitation` token lifecycle conventions.
**Requirement**: RESET-01, RESET-02, RESET-04

**Done when**:

- [ ] Reset tokens have `PENDING`, `USED`, `CANCELLED`, and `EXPIRED` statuses.
- [ ] Token hash is unique and raw token is not persisted.
- [ ] Pending-token lookup is indexed by status/expiry and user/status.
- [ ] Prisma client generation succeeds.

**Tests**: schema/build
**Gate**: `pnpm prisma:generate`, `pnpm build`

---

### T2: Implement Schemas and Token Service

**Status**: Done

**What**: Add request/confirm Zod schemas plus secure token generation/hash helpers.
**Where**: `src/features/password-reset/password-reset.schema.ts`, `src/features/password-reset/password-reset-token.service.ts`, colocated tests.
**Depends on**: T1
**Reuses**: Invitation schema normalization and token hashing pattern.
**Requirement**: RESET-01, RESET-02, RESET-04

**Done when**:

- [ ] Email schema trims and lowercases before lookup.
- [ ] Password schema enforces minimum length and confirmation match.
- [ ] Token service generates URL-safe secure random tokens.
- [ ] Hash helper returns deterministic SHA-256 hex digests.
- [ ] Tests cover valid/invalid email, password mismatch, weak password, and token hash determinism.

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T3: Implement Password Reset Email Adapter

**Status**: Done

**What**: Add URL builder and deterministic console/log-file reset email delivery.
**Where**: `src/features/password-reset/password-reset-email.adapter.ts`, adapter tests, `.env.example`, `.env.test`, `src/infra/env.ts`.
**Depends on**: T2
**Reuses**: Invitation email adapter shape and `APP_BASE_URL`.
**Requirement**: RESET-01, RESET-03, RESET-05

**Done when**:

- [ ] Reset URL points to `/redefinir-senha/[token]`.
- [ ] Console delivery logs structured payload with `resetUrl`.
- [ ] Log-file delivery writes one JSON line per reset email when `PASSWORD_RESET_EMAIL_LOG_DIR` and `PASSWORD_RESET_EMAIL_LOG_FILE_NAME` are configured.
- [ ] `.env.test` configures the reset log under `./e2e-fixtures/tmp/`, following the invitation test pattern.
- [ ] The reset E2E log file remains untracked because `/e2e-fixtures/**/*` is already ignored by git.
- [ ] Required envs are typed and documented.
- [ ] SMTP mode either reuses existing validation behavior or fails loudly until implemented.

**Tests**: unit
**Gate**: `pnpm test:unit`

---

### T4: Implement Password Reset Service

**Status**: Done

**What**: Add domain service for request, token resolution, and reset confirmation.
**Where**: `src/features/password-reset/password-reset.service.ts`, service tests.
**Depends on**: T1, T2, T3
**Reuses**: `hashPassword` from `better-auth/crypto`, Prisma client, invitation service error style.
**Requirement**: RESET-01, RESET-02, RESET-04

**Done when**:

- [ ] Known credential user request creates one active pending token and invalidates older pending tokens.
- [ ] Unknown email returns generic success without token creation.
- [ ] User without credential account does not get a usable reset token.
- [ ] Token resolution rejects invalid, non-pending, and expired tokens.
- [ ] Confirming a valid token updates credential account password, marks token used, and deletes sessions.
- [ ] Double-submit or reused-token cases cannot update the password twice.

**Tests**: unit/integration
**Gate**: `pnpm test:unit`

---

### T5: Add Public API Routes

**Status**: Done

**What**: Expose request and confirm Route Handlers as thin HTTP boundaries.
**Where**: `src/app/api/password-reset/request/route.ts`, `src/app/api/password-reset/confirm/route.ts`, route tests if existing pattern allows.
**Depends on**: T4
**Reuses**: Existing API JSON validation/error mapping style.
**Requirement**: RESET-01, RESET-02, RESET-04

**Done when**:

- [ ] Request route validates payload and returns generic success for known and unknown emails.
- [ ] Confirm route validates payload and maps invalid token/password errors to form-safe responses.
- [ ] Routes do not require session and do not leak user existence.
- [ ] Server-side validation is authoritative.

**Tests**: unit
**Gate**: `pnpm test:unit`, `pnpm build`

---

### T6: Add Forgot/Reset UI

**Status**: Done

**What**: Add public forgot-password and reset-password pages/forms.
**Where**: `src/app/esqueci-senha/page.tsx`, `src/app/esqueci-senha/_components/*`, `src/app/redefinir-senha/[token]/page.tsx`, `src/app/redefinir-senha/[token]/_components/*`, `src/app/login/page.tsx`.
**Depends on**: T5
**Reuses**: Login page visual vocabulary, shadcn components, `react-hook-form`, `zodResolver`.
**Requirement**: RESET-01, RESET-02, RESET-05

**Done when**:

- [ ] Login page links to `/esqueci-senha`.
- [ ] Request form has email validation and neutral success message.
- [ ] Reset page resolves token server-side before rendering the form.
- [ ] Invalid token state is generic and non-actionable.
- [ ] Confirm form validates password confirmation and shows success path back to login.
- [ ] UI remains usable on mobile and desktop.

**Tests**: e2e in T7, build
**Gate**: `pnpm build`

---

### T7: Add E2E Coverage

**Status**: Done

**What**: Cover the reset lifecycle in browser tests with deterministic email-log extraction.
**Where**: `src/tests/e2e/password-reset.spec.ts`, optional helper under `src/tests/e2e/helpers/password-reset.ts`.
**Depends on**: T6
**Reuses**: Existing auth helpers, invitation log-file helper pattern, seeded `student@enade.local`.
**Requirement**: RESET-01, RESET-02, RESET-03, RESET-05

**Done when**:

- [ ] Test requests reset for seeded student and reads reset URL from log file.
- [ ] Test opens reset URL, submits a new password, and sees success.
- [ ] Test verifies old password no longer logs in.
- [ ] Test verifies new password logs in.
- [ ] Test covers invalid/used token at low maintenance cost, or documents why unit coverage is sufficient.
- [ ] Test data cleanup restores seeded user's original password or isolates the mutation safely.

**Tests**: e2e
**Gate**: `pnpm test:e2e`

---

### T8: Final Gates and Traceability

**Status**: Done

**What**: Run final checks, update docs/status, and record implementation decisions.
**Where**: `.specs/features/password-reset/*`, `.specs/project/STATE.md`, optional `.specs/codebase/*` updates if patterns changed.
**Depends on**: T7
**Reuses**: Existing feature traceability style.
**Requirement**: RESET-01, RESET-02, RESET-03, RESET-04, RESET-05

**Done when**:

- [ ] All task statuses and requirement mappings are updated.
- [ ] `pnpm test:unit` passes.
- [ ] `pnpm test:e2e` passes.
- [ ] `pnpm build` passes.
- [ ] Any deferred email-provider work is recorded in `STATE.md`.

**Tests**: unit, e2e, build
**Gate**: `pnpm test:unit`, `pnpm test:e2e`, `pnpm build`

---

## Parallelization Notes

This feature is mostly sequential because data model, token service, email delivery, API, UI, and E2E share one security contract. After T2, parts of T3 and T4 test scaffolding can be drafted in parallel, but final service behavior should be completed before API/UI work.

---

## Risk Register

| Risk | Mitigation |
| --- | --- |
| User enumeration through different messages | Always return generic public success for request flow; keep detailed logs server-side only. |
| Token reuse race | Confirm reset inside a transaction and require pending status during update. |
| Breaking seeded users in E2E | Restore the original seed password after test or use an invited deterministic user created inside the test. |
| Divergence from Better Auth password format | Use `hashPassword` from `better-auth/crypto`, same as invitations and seeds. |
| Email adapter duplication | Accept small duplication initially; extract shared transactional email helper only after reset and invitation needs converge. |
