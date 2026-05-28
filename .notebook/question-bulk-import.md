# Question Bulk Import
> Bulk question import should reuse the current question schema and keep transport separate from domain validation

Current question contract:
- `src/features/questions/question.schema.ts` validates one question with Markdown description, difficulty, optional source/year/explanation, `subjectFieldId`, 2-8 alternatives, and exactly one correct alternative
- `src/features/questions/question.service.ts:createQuestion()` validates input, ensures the subject field exists, and creates question + alternatives transactionally
- `prisma/schema.prisma` requires `Question.subjectFieldId`, `createdById`, and child `QuestionAlternative` rows with unique `(questionId, position)`

Decision update:
- Bulk import will use an admin route and one structured Markdown file containing N questions
- Markdown is the authoring format; parser converts blocks into the current `QuestionInput`
- `externalId` is required in each Markdown question block for import reports/deduplication, but is not persisted in `Question` initially
- Deduplication is required in v1: block duplicate `externalId`, duplicate canonical signatures inside the file, and `hashContent` already present in the DB
- Bulk import assumes `Question.hashContent` exists before execution, is uniquely constrained, and is computed only from normalized `descriptionMarkdown`
- Use preview/commit modes; first version should reject the whole batch if any question is invalid
- CSV/JSON remain possible adapters but are not the chosen first version

Related doc: `docs/question-bulk-import.md`
Official format: `docs/question-bulk-import-markdown-format.md`
Product guide: `docs/question-bulk-import-product-guide.md`

Updated: 2026-05-28
