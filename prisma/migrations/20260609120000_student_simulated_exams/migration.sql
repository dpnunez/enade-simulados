-- CreateEnum
CREATE TYPE "SimulationAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "SimulationAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "SimulationAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "requestedQuestionCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "answeredCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "scorePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationAttemptSubjectField" (
    "attemptId" TEXT NOT NULL,
    "subjectFieldId" TEXT NOT NULL,

    CONSTRAINT "SimulationAttemptSubjectField_pkey" PRIMARY KEY ("attemptId","subjectFieldId")
);

-- CreateTable
CREATE TABLE "SimulationAttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "subjectFieldId" TEXT NOT NULL,

    CONSTRAINT "SimulationAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationAnswer" (
    "id" TEXT NOT NULL,
    "attemptQuestionId" TEXT NOT NULL,
    "selectedAlternativeId" TEXT,
    "correctAlternativeId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationAttempt_studentId_createdAt_idx" ON "SimulationAttempt"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "SimulationAttempt_status_updatedAt_idx" ON "SimulationAttempt"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SimulationAttemptSubjectField_subjectFieldId_idx" ON "SimulationAttemptSubjectField"("subjectFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationAttemptQuestion_attemptId_questionId_key" ON "SimulationAttemptQuestion"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationAttemptQuestion_attemptId_position_key" ON "SimulationAttemptQuestion"("attemptId", "position");

-- CreateIndex
CREATE INDEX "SimulationAttemptQuestion_questionId_idx" ON "SimulationAttemptQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationAnswer_attemptQuestionId_key" ON "SimulationAnswer"("attemptQuestionId");

-- CreateIndex
CREATE INDEX "SimulationAnswer_selectedAlternativeId_idx" ON "SimulationAnswer"("selectedAlternativeId");

-- CreateIndex
CREATE INDEX "SimulationAnswer_correctAlternativeId_idx" ON "SimulationAnswer"("correctAlternativeId");

-- AddForeignKey
ALTER TABLE "SimulationAttempt" ADD CONSTRAINT "SimulationAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttemptSubjectField" ADD CONSTRAINT "SimulationAttemptSubjectField_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SimulationAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttemptSubjectField" ADD CONSTRAINT "SimulationAttemptSubjectField_subjectFieldId_fkey" FOREIGN KEY ("subjectFieldId") REFERENCES "SubjectField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttemptQuestion" ADD CONSTRAINT "SimulationAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SimulationAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttemptQuestion" ADD CONSTRAINT "SimulationAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttemptQuestion" ADD CONSTRAINT "SimulationAttemptQuestion_subjectFieldId_fkey" FOREIGN KEY ("subjectFieldId") REFERENCES "SubjectField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAnswer" ADD CONSTRAINT "SimulationAnswer_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "SimulationAttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAnswer" ADD CONSTRAINT "SimulationAnswer_selectedAlternativeId_fkey" FOREIGN KEY ("selectedAlternativeId") REFERENCES "QuestionAlternative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAnswer" ADD CONSTRAINT "SimulationAnswer_correctAlternativeId_fkey" FOREIGN KEY ("correctAlternativeId") REFERENCES "QuestionAlternative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
