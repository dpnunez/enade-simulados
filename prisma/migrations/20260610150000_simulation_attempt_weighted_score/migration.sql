-- Add a materialized weighted score for completed simulation attempts.
ALTER TABLE "SimulationAttempt"
ADD COLUMN "weightedScore" INTEGER NOT NULL DEFAULT 0;

UPDATE "SimulationAttempt" attempt
SET "weightedScore" = COALESCE(score_totals."weightedScore", 0)
FROM (
    SELECT
        attempt_question."attemptId",
        SUM(
            CASE
                WHEN answer."isCorrect" = true AND attempt_question.difficulty = 'EASY' THEN 1
                WHEN answer."isCorrect" = true AND attempt_question.difficulty = 'HARD' THEN 3
                WHEN answer."isCorrect" = true THEN 2
                ELSE 0
            END
        ) AS "weightedScore"
    FROM "SimulationAttemptQuestion" attempt_question
    LEFT JOIN "SimulationAnswer" answer
        ON answer."attemptQuestionId" = attempt_question.id
    GROUP BY attempt_question."attemptId"
) score_totals
WHERE attempt.id = score_totals."attemptId"
  AND attempt.status = 'COMPLETED';

CREATE INDEX "SimulationAttempt_status_studentId_idx"
ON "SimulationAttempt"("status", "studentId");
