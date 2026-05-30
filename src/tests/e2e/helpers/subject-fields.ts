import knex from "knex";
import { randomUUID } from "node:crypto";

import { createQuestionDescriptionHash } from "@/features/questions/question-description-hash";

export const SUBJECT_FIELD_E2E_TITLE_PREFIX = "E2E Grande Area";

export function buildSubjectFieldTitle(label: string) {
  return `${SUBJECT_FIELD_E2E_TITLE_PREFIX} ${label}`;
}

function buildE2eId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

export async function createSubjectFieldWithQuestions(label: string, questionCount: number) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const title = buildSubjectFieldTitle(label);
  const titleNormalized = title.trim().replace(/\s+/g, " ").toLowerCase();
  const teacher = await db("User")
    .where({ email: "teacher@enade.local" })
    .first("id");

  const [subjectField] = await db("SubjectField")
    .insert({
      id: buildE2eId("sf"),
      title,
      titleNormalized,
      description: "Grande area deterministica para rollup de questoes.",
      colorHex: "#2563EB",
      createdById: teacher.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  const questionIds: string[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const [question] = await db("Question")
      .insert({
        id: buildE2eId("question"),
        descriptionMarkdown: `E2E Questao Rollup ${label} ${index + 1}`,
        descriptionHash: createQuestionDescriptionHash(
          `E2E Questao Rollup ${label} ${index + 1}`,
        ),
        difficulty: "MEDIUM",
        source: "MANUAL",
        year: 2024,
        subjectFieldId: subjectField.id,
        correctAnswerExplanation: "Explicacao deterministica para teste.",
        createdById: teacher.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");

    questionIds.push(String(question.id));

    await db("QuestionAlternative").insert([
      {
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: "Alternativa correta.",
        position: 1,
        isCorrect: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: "Alternativa incorreta.",
        position: 2,
        isCorrect: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  await db.destroy();

  return {
    subjectFieldId: String(subjectField.id),
    title,
    questionIds,
  };
}

export async function countSubjectFieldRollupRows(
  subjectFieldId: string,
  questionIds: string[],
) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const [subjectFields, questions, alternatives] = await Promise.all([
    db("SubjectField").where({ id: subjectFieldId }).count<{ count: string }[]>("*"),
    db("Question").whereIn("id", questionIds).count<{ count: string }[]>("*"),
    db("QuestionAlternative")
      .whereIn("questionId", questionIds)
      .count<{ count: string }[]>("*"),
  ]);

  await db.destroy();

  return {
    subjectFields: Number(subjectFields[0]?.count ?? 0),
    questions: Number(questions[0]?.count ?? 0),
    alternatives: Number(alternatives[0]?.count ?? 0),
  };
}

export async function eraseSubjectFieldE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  await db("Question")
    .whereIn("subjectFieldId", (builder) => {
      builder
        .select("id")
        .from("SubjectField")
        .where("title", "like", `${SUBJECT_FIELD_E2E_TITLE_PREFIX}%`);
    })
    .del();
  await db("SubjectField")
    .where("title", "like", `${SUBJECT_FIELD_E2E_TITLE_PREFIX}%`)
    .del();
  await db.destroy();
}
