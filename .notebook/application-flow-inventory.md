# Application Flow Inventory
> Global MVP map across public, protected, role-specific pages, APIs, and services

Entry:
- App pages/API tree: `src/app`
- Auth helpers: `src/proxy.ts`, `src/infra/auth/session.ts`, `src/infra/auth/server.ts`
- Domain services: `src/features/*/*.service.ts`
- Data model: `prisma/schema.prisma`

Public:
- Root redirect: `src/app/page.tsx` -> unauthenticated users go to `/login`; authenticated users go to the home path for their role.
- Login: `src/app/login/page.tsx` -> Better Auth email/password via `src/infra/auth/client.ts`.
- Forgot/reset password: `src/app/esqueci-senha/page.tsx`, `src/app/redefinir-senha/[token]/page.tsx`.
- Invite acceptance: `src/app/convites/[token]/page.tsx`.

Protected shell:
- `src/proxy.ts` redirects `/app/*` without session cookie to `/login`, and `/login` with session cookie to `/app`.
- `src/app/app/layout.tsx` requires auth, shows session identity, role, logout, and role-specific nav.
- `src/app/app/page.tsx` requires auth and redirects to `getRoleHomePath()` from `src/infra/auth/session.ts`.
- Role home paths: ADMIN -> `/app/admin`, STUDENT -> `/app/student`, TEACHER -> `/app/teacher`.

ADMIN:
- Page: `src/app/app/admin/page.tsx`.
- APIs: `src/app/api/invitations/route.ts`, `src/app/api/invitations/[invitationId]/cancel/route.ts`.
- Service/schema: `src/features/invitations/invitation.service.ts`, `src/features/invitations/invitation.schema.ts`.
- Flow: list users + pending invitations -> create STUDENT/TEACHER invitation -> send email -> cancel pending invitation.

Invitation acceptance:
- Page resolves token with `resolveInvitationToken()` and shows `AcceptInviteForm`.
- API: `src/app/api/invitations/accept/route.ts`.
- Service creates `User` + credential `Account`, marks invitation ACCEPTED, enforces unique email/name.

TEACHER catalog:
- Grandes areas page/components/API/service:
  `src/app/app/professor/grandes-areas/page.tsx`,
  `src/app/api/subject-fields/route.ts`,
  `src/app/api/subject-fields/[subjectFieldId]/route.ts`,
  `src/features/subject-fields/subject-field.service.ts`.
- Questions page/components/API/service:
  `src/app/app/professor/questoes/page.tsx`,
  `src/app/app/professor/questoes/nova/page.tsx`,
  `src/app/app/professor/questoes/[id]/page.tsx`,
  `src/app/api/questions/route.ts`,
  `src/app/api/questions/[questionId]/route.ts`,
  `src/features/questions/question.service.ts`.
- Markdown image upload:
  `src/app/api/uploads/markdown-images/route.ts`,
  `src/features/uploads/markdown-image.service.ts`,
  `src/infra/storage/supabase-storage.adapter.ts`.

TEACHER ranking:
- Page/component/API/service:
  `src/app/app/professor/ranking/page.tsx`,
  `src/app/app/professor/ranking/_components/ranking-table.tsx`,
  `src/app/api/teacher/simulation-ranking/route.ts`,
  `src/features/simulation-ranking/simulation-ranking.service.ts`.
- Flow: backend-paginated aggregate over COMPLETED `SimulationAttempt`, sortable by weighted score, accuracy, completed forms, or student name.

STUDENT simulations:
- Pages/components/API/service:
  `src/app/app/student/simulados/page.tsx`,
  `src/app/app/student/simulados/novo/page.tsx`,
  `src/app/app/student/simulados/[attemptId]/page.tsx`,
  `src/app/api/student/simulated-exams/route.ts`,
  `src/app/api/student/simulated-exams/[attemptId]/route.ts`,
  `src/app/api/student/simulated-exams/[attemptId]/answers/route.ts`,
  `src/features/simulated-exams/simulated-exam.service.ts`.
- Flow: eligible subject fields -> generate attempt -> answer/draft-save -> finalize/correct -> review/history.

Coverage pointers:
- E2E specs: `src/tests/e2e/login.spec.ts`, `src/tests/e2e/admin-authorization.spec.ts`, `src/tests/e2e/invitations.spec.ts`, `src/tests/e2e/password-reset.spec.ts`, `src/tests/e2e/subject-fields.spec.ts`, `src/tests/e2e/questions.spec.ts`, `src/tests/e2e/student-simulated-exams.spec.ts`, `src/tests/e2e/teacher-simulation-ranking.spec.ts`.

Updated: 2026-06-10
