# Professor Content Tables
> Professor catalog list pages now fetch through API routes with React Query

Entry points:
- `src/app/app/query-provider.tsx` wraps private `/app` routes with a `QueryClientProvider`.
- `src/app/api/subject-fields/route.ts:GET` returns all grandes areas for TEACHER users; no pagination.
- `src/app/api/questions/route.ts:GET` returns paginated questions for TEACHER users.
- `src/app/app/professor/grandes-areas/_components/subject-fields-table.tsx` renders the unpaginated React Table and invalidates `["subject-fields"]`.
- `src/app/app/professor/questoes/_components/questions-table.tsx` renders the paginated React Table and invalidates `["questions"]`.

Flow changes:
- Grande area creation moved to `/app/professor/grandes-areas/nova`; success redirects to `/app/professor/grandes-areas`.
- `SubjectFieldForm` and `QuestionForm` use `sonner` for submit/domain success and error feedback; inline validation remains close to fields.
- Question list pagination contract lives in `src/features/questions/question.schema.ts:questionListQuerySchema` and `src/features/questions/question.service.ts:listQuestionsPaginated()`.

Verification note:
- Feature E2E coverage lives in `src/tests/e2e/subject-fields.spec.ts` and `src/tests/e2e/questions.spec.ts`.
- Ranking files were intentionally left untouched.

Updated: 2026-06-21
