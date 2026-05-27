-- CreateTable
CREATE TABLE "SubjectField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleNormalized" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectField_titleNormalized_key" ON "SubjectField"("titleNormalized");

-- CreateIndex
CREATE INDEX "SubjectField_createdById_idx" ON "SubjectField"("createdById");

-- CreateIndex
CREATE INDEX "SubjectField_updatedAt_idx" ON "SubjectField"("updatedAt");

-- AddForeignKey
ALTER TABLE "SubjectField" ADD CONSTRAINT "SubjectField_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
