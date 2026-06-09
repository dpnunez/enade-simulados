# Student Simulated Exams
> Student-only generated attempts, draft answer saves, final correction, and history review

Entry points:
- Pages: `src/app/app/student/simulados/page.tsx`, `src/app/app/student/simulados/novo/page.tsx`, `src/app/app/student/simulados/[attemptId]/page.tsx`
- APIs: `src/app/api/student/simulated-exams/route.ts`, `src/app/api/student/simulated-exams/[attemptId]/route.ts`, `src/app/api/student/simulated-exams/[attemptId]/answers/route.ts`

Domain flow:
- `src/features/simulated-exams/simulated-exam.schema.ts` validates generation, draft-save, and submit payloads.
- `src/features/simulated-exams/question-selection.ts` computes difficulty quotas and selects eligible questions by selected grande area.
- `src/features/simulated-exams/simulated-exam.service.ts` owns attempt creation, safe in-progress DTOs, draft answer persistence, completed review DTOs, final correction, score aggregates, and student-scoped history.

Security notes:
- Pages and APIs require `STUDENT`.
- In-progress detail and draft-save responses use explicit Prisma `select` projections and do not select `QuestionAlternative.isCorrect`, `correctAlternativeId`, or `Question.correctAnswerExplanation`.
- Completed review is the first surface that includes correction fields.

Persistence:
- `prisma/schema.prisma` adds `SimulationAttempt`, `SimulationAttemptSubjectField`, `SimulationAttemptQuestion`, and `SimulationAnswer`.
- Migrations: `prisma/migrations/20260609120000_student_simulated_exams/migration.sql`, `prisma/migrations/20260609143000_simulation_answer_drafts/migration.sql`
- `SimulationAnswer.correctAlternativeId` and `SimulationAnswer.isCorrect` are nullable while an attempt is `IN_PROGRESS`; draft saves upsert `selectedAlternativeId` with correction fields as `null`.
- `saveSimulationAttemptAnswers()` preserves `IN_PROGRESS`, updates `answeredCount`, and rejects completed attempts.
- `submitSimulationAttempt()` merges persisted draft answers with payload answers, with payload values taking precedence, then fills correction fields and marks the attempt `COMPLETED`.
- Student deletion cascades attempts; attempt-owned rows cascade with attempts; catalog subject fields/questions/alternatives are restricted once referenced by simulation history.

E2E:
- `src/tests/e2e/student-simulated-exams.spec.ts` covers generation, out-of-order answers, draft saves/reopen/finalize, final review, history, and non-student denial.
- `src/tests/e2e/helpers/simulated-exams.ts` cleans simulation attempts before deleting deterministic catalog rows.

Updated: 2026-06-09
