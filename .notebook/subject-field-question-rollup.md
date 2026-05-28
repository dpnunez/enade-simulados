# Subject Field Question Rollup
> Grande area list shows question count; delete cascades through questions/alternatives

Entry: `src/app/app/professor/grandes-areas/page.tsx`

Data path:
- Page calls `src/features/subject-fields/subject-field.service.ts:listSubjectFields()`
- Service includes `createdBy` and `_count.questions`
- Client list renders count in `src/app/app/professor/grandes-areas/_components/subject-fields-list.tsx:SubjectFieldsList()`

Delete path:
- UI calls `DELETE /api/subject-fields/[subjectFieldId]`
- Route calls `src/features/subject-fields/subject-field.service.ts:deleteSubjectField()`
- DB cascade: `SubjectField` -> `Question` -> `QuestionAlternative`

Schema:
- `prisma/schema.prisma` relation `Question.subjectField` uses `onDelete: Cascade`
- Migration: `prisma/migrations/20260528120000_subject_field_question_cascade/migration.sql`

E2E:
- `src/tests/e2e/subject-fields.spec.ts` covers count display and cascade deletion
- Knex helpers inserting Prisma `cuid()` models must provide explicit ids; Prisma generates cuid client-side, not as a Postgres default

Updated: 2026-05-28
