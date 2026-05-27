import knex from "knex";

export const SUBJECT_FIELD_E2E_TITLE_PREFIX = "E2E Grande Area";

export function buildSubjectFieldTitle(label: string) {
  return `${SUBJECT_FIELD_E2E_TITLE_PREFIX} ${label}`;
}

export async function eraseSubjectFieldE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  await db("SubjectField")
    .where("title", "like", `${SUBJECT_FIELD_E2E_TITLE_PREFIX}%`)
    .del();
  await db.destroy();
}
