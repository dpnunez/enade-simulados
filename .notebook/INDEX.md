# .notebook
> Project intelligence — read before every mission

Last updated: 2026-06-21

- [smtp-email](smtp-email.md) — Gmail SMTP helper shared by invite/reset adapters | flow | email, smtp, gmail
- [env-config](env-config.md) — App base URL resolves from NEXT_PUBLIC_URL, VERCEL_URL, then local fallback; DB uses DATABASE_URL | pattern | env, auth, db
- [form-fields](form-fields.md) — shadcn Field/InputGroup pattern for inputs | pattern | forms, shadcn, a11y
- [http-client](http-client.md) — Shared ky instance for app API requests | pattern | http, ky, api
- [application-flow-inventory](application-flow-inventory.md) — Global MVP screen/API/service map | flow | app, routes, auth, api
- [question-deduplication](question-deduplication.md) — Question description hash uniqueness + duplicate feedback | flow | questions, prisma, e2e
- [password-reset](password-reset.md) — First-party password reset and shared password policy/checklist | decision | auth, password-reset, invitations, prisma, e2e
- [student-simulated-exams](student-simulated-exams.md) — Student attempt generation, correction, paginated list + safe in-progress DTOs | flow | simulated-exams, prisma, e2e
- [teacher-simulation-ranking](teacher-simulation-ranking.md) — Teacher ranking with weighted scoring, backend pagination, and E2E fixtures | flow | ranking, simulated-exams, prisma, e2e
- [subject-field-question-rollup](subject-field-question-rollup.md) — Grande area count + cascade flow | flow | subject-fields, questions, prisma, e2e
- [professor-content-tables](professor-content-tables.md) — Professor catalog list pages use React Query + React Table APIs | flow | professor, subject-fields, questions, react-query
- [user-nicknames](user-nicknames.md) — Invitation acceptance stores unique nick in User.name | flow | invitations, prisma, auth, e2e
- [private-app-sidebar](private-app-sidebar.md) — Protected role-aware shadcn sidebar shell for `/app` | flow | app, auth, shadcn, navigation
- [admin-access-management](admin-access-management.md) — Planned admin split into Usuarios and Convites with Query/Table pagination | plan | admin, invitations, users, react-query, table
