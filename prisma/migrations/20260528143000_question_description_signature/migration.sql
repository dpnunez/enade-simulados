-- Add nullable first so existing questions can be backfilled before the
-- uniqueness constraint is enforced.
ALTER TABLE "Question" ADD COLUMN "descriptionHash" TEXT;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE "Question"
SET "descriptionHash" = encode(
  digest(
    regexp_replace(
      trim(
        regexp_replace("descriptionMarkdown", E'\\r\\n?|\\n', E'\\n', 'g')
      ),
      '[[:space:]]+',
      ' ',
      'g'
    ),
    'sha256'
  ),
  'hex'
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Question"
    GROUP BY "descriptionHash"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate question description hashes found. Clean duplicate questions before applying question deduplication migration.';
  END IF;
END $$;

ALTER TABLE "Question" ALTER COLUMN "descriptionHash" SET NOT NULL;

CREATE UNIQUE INDEX "Question_descriptionHash_key" ON "Question"("descriptionHash");
