# Question Deduplication
> Question content uniqueness is enforced with a SHA-256 hash of canonical markdown

Entry: `src/features/questions/question.service.ts`

Data path:
- `src/features/questions/question.schema.ts` validates and trims question input first
- `src/features/questions/question-description-hash.ts` normalizes line endings, trims, collapses whitespace, and hashes with SHA-256
- `src/features/questions/question.service.ts:questionData()` persists `descriptionHash` on create/update
- `prisma/schema.prisma` stores `Question.descriptionHash String @unique`

Migration:
- `prisma/migrations/20260528143000_question_description_signature/migration.sql` backfills hashes with matching SQL canonicalization
- The migration raises explicitly if existing duplicate hashes are found before adding the unique index

Gotchas:
- Prisma 7 with `@prisma/adapter-pg` can return `P2002` without the old `meta.target` array; the service maps `P2002` in question writes to `QUESTION_DUPLICATE_CONTENT`
- MDXEditor exposes the editable statement field to Playwright as textbox `editable markdown`

E2E:
- `src/tests/e2e/questions.spec.ts` covers duplicate create/update feedback through the professor UI
- `src/tests/e2e/helpers/questions.ts` provides deterministic question cleanup and description-hash counting

Updated: 2026-05-28
