import knex from "knex";
import { randomUUID } from "node:crypto";

import { createQuestionDescriptionHash } from "@/features/questions/question-description-hash";
import {
  buildSubjectFieldTitle,
  SUBJECT_FIELD_E2E_TITLE_PREFIX,
} from "./subject-fields";

export const QUESTION_E2E_MARKER = "E2E Questao";

export function buildQuestionDescription(label: string) {
  return `${QUESTION_E2E_MARKER} ${label}`;
}

function buildE2eId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
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
      id: buildE2eId("sf"),
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

export async function createQuestionE2eData(label: string) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const subjectFieldId = await ensureQuestionSubjectField(label);
  const teacher = await db("User")
    .where({ email: "teacher@enade.local" })
    .first("id");
  const descriptionMarkdown = buildQuestionDescription(label);
  const [question] = await db("Question")
    .insert({
      id: buildE2eId("question"),
      descriptionMarkdown,
      descriptionHash: createQuestionDescriptionHash(descriptionMarkdown),
      difficulty: "MEDIUM",
      source: "MANUAL",
      year: 2024,
      subjectFieldId,
      correctAnswerExplanation: "Explicacao deterministica para teste.",
      createdById: teacher.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  await db("QuestionAlternative").insert([
    {
      id: buildE2eId("alternative"),
      questionId: question.id,
      contentMarkdown: "Alternativa correta.",
      position: 0,
      isCorrect: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: buildE2eId("alternative"),
      questionId: question.id,
      contentMarkdown: "Alternativa incorreta.",
      position: 1,
      isCorrect: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await db.destroy();

  return {
    questionId: String(question.id),
    subjectFieldId,
    descriptionMarkdown,
  };
}

export async function countQuestionsByEquivalentDescription(descriptionMarkdown: string) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const rows = await db("Question")
    .where({ descriptionHash: createQuestionDescriptionHash(descriptionMarkdown) })
    .count<{ count: string }[]>("*");

  await db.destroy();

  return Number(rows[0]?.count ?? 0);
}
