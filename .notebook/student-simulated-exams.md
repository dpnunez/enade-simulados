# Student Simulated Exams
> Student-only generated attempts, answer submission, correction, and history review

Entry points:
- Pages: `src/app/app/student/simulados/page.tsx`, `src/app/app/student/simulados/novo/page.tsx`, `src/app/app/student/simulados/[attemptId]/page.tsx`
- APIs: `src/app/api/student/simulated-exams/route.ts`, `src/app/api/student/simulated-exams/[attemptId]/route.ts`

Domain flow:
- `src/features/simulated-exams/simulated-exam.schema.ts` validates generation and submit payloads.
- `src/features/simulated-exams/question-selection.ts` computes difficulty quotas and selects eligible questions by selected grande area.
- `src/features/simulated-exams/simulated-exam.service.ts` owns attempt creation, safe in-progress DTOs, completed review DTOs, final correction, score aggregates, and student-scoped history.

Security notes:
- Pages and APIs require `STUDENT`.
- In-progress detail uses explicit Prisma `select` projections and does not select `QuestionAlternative.isCorrect`, `correctAlternativeId`, or `Question.correctAnswerExplanation`.
- Completed review is the first surface that includes correction fields.

Persistence:
- `prisma/schema.prisma` adds `SimulationAttempt`, `SimulationAttemptSubjectField`, `SimulationAttemptQuestion`, and `SimulationAnswer`.
- Migration: `prisma/migrations/20260609120000_student_simulated_exams/migration.sql`
- Student deletion cascades attempts; attempt-owned rows cascade with attempts; catalog subject fields/questions/alternatives are restricted once referenced by simulation history.

E2E:
- `src/tests/e2e/student-simulated-exams.spec.ts` covers generation, out-of-order answers, final review, history, and non-student denial.
- `src/tests/e2e/helpers/simulated-exams.ts` cleans simulation attempts before deleting deterministic catalog rows.

Updated: 2026-06-09
