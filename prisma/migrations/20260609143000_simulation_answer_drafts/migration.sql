-- Allow in-progress simulated exam answers to be saved before correction.
ALTER TABLE "SimulationAnswer"
  ALTER COLUMN "correctAlternativeId" DROP NOT NULL,
  ALTER COLUMN "isCorrect" DROP NOT NULL;
