UPDATE "User"
SET "name" = trim("name")
WHERE "name" <> trim("name");

WITH normalized_users AS (
    SELECT
        "id",
        CASE
            WHEN "name" IS NULL OR trim("name") = '' THEN split_part("email", '@', 1)
            ELSE coalesce(nullif("name", ''), split_part("email", '@', 1))
        END AS base_name
    FROM "User"
),
ranked_users AS (
    SELECT
        "id",
        coalesce(nullif(trim(base_name), ''), 'user_' || "id") AS normalized_name,
        row_number() OVER (
            PARTITION BY coalesce(nullif(trim(base_name), ''), 'user_' || "id")
            ORDER BY "id"
        ) AS duplicate_position
    FROM normalized_users
)
UPDATE "User"
SET "name" = CASE
    WHEN ranked_users.duplicate_position = 1 THEN ranked_users.normalized_name
    ELSE ranked_users.normalized_name || '_' || ranked_users.duplicate_position
END
FROM ranked_users
WHERE "User"."id" = ranked_users."id";

CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
