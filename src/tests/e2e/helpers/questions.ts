import knex from "knex";

import {
  buildSubjectFieldTitle,
  SUBJECT_FIELD_E2E_TITLE_PREFIX,
} from "./subject-fields";

export const QUESTION_E2E_MARKER = "E2E Questao";

export function buildQuestionDescription(label: string) {
  return `${QUESTION_E2E_MARKER} ${label}`;
}

export async function eraseQuestionE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  await db("Question")
    .where("descriptionMarkdown", "like", `${QUESTION_E2E_MARKER}%`)
    .orWhereIn("subjectFieldId", (builder) => {
      builder
        .select("id")
        .from("SubjectField")
        .where("title", "like", `${SUBJECT_FIELD_E2E_TITLE_PREFIX}%`);
    })
    .del();
  await db.destroy();
}

export async function ensureQuestionSubjectField(label: string) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });
  const title = buildSubjectFieldTitle(label);
  const titleNormalized = title.trim().replace(/\s+/g, " ").toLowerCase();

  const existing = await db("SubjectField").where({ titleNormalized }).first("id");
  if (existing) {
    await db.destroy();
    return String(existing.id);
  }

  const teacher = await db("User")
    .where({ email: "teacher@enade.local" })
    .first("id");

  const [subjectField] = await db("SubjectField")
    .insert({
      title,
      titleNormalized,
      description: "Grande area deterministica para testes de questoes.",
      colorHex: "#2563eb",
      createdById: teacher.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  await db.destroy();
  return String(subjectField.id);
}
