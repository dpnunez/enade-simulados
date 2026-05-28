-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_subjectFieldId_fkey";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectFieldId_fkey" FOREIGN KEY ("subjectFieldId") REFERENCES "SubjectField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
