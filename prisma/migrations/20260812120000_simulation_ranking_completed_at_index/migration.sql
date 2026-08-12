-- CreateIndex
CREATE INDEX "SimulationAttempt_status_completedAt_studentId_idx"
ON "SimulationAttempt"("status", "completedAt", "studentId");
