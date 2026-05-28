-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('ENADE', 'MANUAL', 'ADAPTED', 'OTHER');

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "descriptionMarkdown" TEXT NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "source" "QuestionSource",
    "year" INTEGER,
    "subjectFieldId" TEXT NOT NULL,
    "correctAnswerExplanation" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAlternative" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_subjectFieldId_idx" ON "Question"("subjectFieldId");

-- CreateIndex
CREATE INDEX "Question_createdById_idx" ON "Question"("createdById");

-- CreateIndex
CREATE INDEX "Question_updatedAt_idx" ON "Question"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAlternative_questionId_position_key" ON "QuestionAlternative"("questionId", "position");

-- CreateIndex
CREATE INDEX "QuestionAlternative_questionId_idx" ON "QuestionAlternative"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAlternative_one_correct_per_question_idx" ON "QuestionAlternative"("questionId") WHERE "isCorrect" = true;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectFieldId_fkey" FOREIGN KEY ("subjectFieldId") REFERENCES "SubjectField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAlternative" ADD CONSTRAINT "QuestionAlternative_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
