import knex from "knex";
import { randomUUID } from "node:crypto";

import { createQuestionDescriptionHash } from "@/features/questions/question-description-hash";

export const SIMULATED_EXAM_E2E_TITLE_PREFIX = "E2E Simulado Grande Area";
export const SIMULATED_EXAM_E2E_QUESTION_PREFIX = "E2E Simulado Questao";

function buildE2eId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function buildSubjectFieldTitle(label: string) {
  return `${SIMULATED_EXAM_E2E_TITLE_PREFIX} ${label}`;
}

function buildQuestionDescription(label: string, index: number) {
  return `${SIMULATED_EXAM_E2E_QUESTION_PREFIX} ${label} ${index}`;
}

async function getTeacherId(db: knex.Knex) {
  const teacher = await db("User")
    .where({ email: "teacher@enade.local" })
    .first("id");

  return String(teacher.id);
}

export async function eraseSimulatedExamE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const simulationAttemptIds = db("SimulationAttempt")
    .select("SimulationAttempt.id")
    .leftJoin(
      "SimulationAttemptQuestion",
      "SimulationAttemptQuestion.attemptId",
      "SimulationAttempt.id",
    )
    .leftJoin("Question", "Question.id", "SimulationAttemptQuestion.questionId")
    .leftJoin(
      "SimulationAttemptSubjectField",
      "SimulationAttemptSubjectField.attemptId",
      "SimulationAttempt.id",
    )
    .leftJoin(
      "SubjectField",
      "SubjectField.id",
      "SimulationAttemptSubjectField.subjectFieldId",
    )
    .where("Question.descriptionMarkdown", "like", `${SIMULATED_EXAM_E2E_QUESTION_PREFIX}%`)
    .orWhere("SubjectField.title", "like", `${SIMULATED_EXAM_E2E_TITLE_PREFIX}%`);

  await db("SimulationAttempt").whereIn("id", simulationAttemptIds).del();
  await db("Question")
    .where("descriptionMarkdown", "like", `${SIMULATED_EXAM_E2E_QUESTION_PREFIX}%`)
    .del();
  await db("SubjectField")
    .where("title", "like", `${SIMULATED_EXAM_E2E_TITLE_PREFIX}%`)
    .del();

  await db.destroy();
}

export async function createSimulatedExamQuestionSet(label: string) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });
  const teacherId = await getTeacherId(db);
  const title = buildSubjectFieldTitle(label);
  const titleNormalized = title.trim().replace(/\s+/g, " ").toLowerCase();
  const [subjectField] = await db("SubjectField")
    .insert({
      id: buildE2eId("sf"),
      title,
      titleNormalized,
      description: "Grande area deterministica para E2E de simulados.",
      colorHex: "#16A34A",
      createdById: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(["id", "title"]);
  const difficulties = ["EASY", "MEDIUM", "HARD"] as const;
  const questions: Array<{
    questionId: string;
    descriptionMarkdown: string;
    correctAlternativeText: string;
    wrongAlternativeText: string;
  }> = [];

  for (let index = 0; index < difficulties.length; index += 1) {
    const descriptionMarkdown = buildQuestionDescription(label, index + 1);
    const [question] = await db("Question")
      .insert({
        id: buildE2eId("question"),
        descriptionMarkdown,
        descriptionHash: createQuestionDescriptionHash(descriptionMarkdown),
        difficulty: difficulties[index],
        source: "MANUAL",
        year: 2024,
        subjectFieldId: subjectField.id,
        correctAnswerExplanation: "Explicacao deterministica para simulado.",
        createdById: teacherId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");

    const correctAlternativeText = `Alternativa correta ${index + 1}`;
    const wrongAlternativeText = `Alternativa incorreta ${index + 1}`;

    await db("QuestionAlternative").insert([
      {
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: correctAlternativeText,
        position: 0,
        isCorrect: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: wrongAlternativeText,
        position: 1,
        isCorrect: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    questions.push({
      questionId: String(question.id),
      descriptionMarkdown,
      correctAlternativeText,
      wrongAlternativeText,
    });
  }

  await db.destroy();

  return {
    subjectFieldId: String(subjectField.id),
    title: String(subjectField.title),
    questions,
  };
}

export async function createMarkdownSimulatedExamQuestionSet(label: string) {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });
  const teacherId = await getTeacherId(db);
  const title = buildSubjectFieldTitle(label);
  const titleNormalized = title.trim().replace(/\s+/g, " ").toLowerCase();
  const [subjectField] = await db("SubjectField")
    .insert({
      id: buildE2eId("sf"),
      title,
      titleNormalized,
      description: "Grande area deterministica para E2E de Markdown.",
      colorHex: "#16A34A",
      createdById: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(["id", "title"]);
  const descriptionMarkdown = `${buildQuestionDescription(label, 1)}

**Texto em destaque**

- item renderizado

<img src="https://example.com/e2e-question.png" alt="Diagrama E2E Markdown" />`;
  const [question] = await db("Question")
    .insert({
      id: buildE2eId("question"),
      descriptionMarkdown,
      descriptionHash: createQuestionDescriptionHash(descriptionMarkdown),
      difficulty: "MEDIUM",
      source: "MANUAL",
      year: 2024,
      subjectFieldId: subjectField.id,
      correctAnswerExplanation: "Explicacao deterministica para simulado.",
      createdById: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  await db("QuestionAlternative").insert([
    {
      id: buildE2eId("alternative"),
      questionId: question.id,
      contentMarkdown:
        '**Alternativa correta com Markdown** <img src="https://example.com/e2e-alternative.png" alt="Imagem da alternativa correta" />',
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
    subjectFieldId: String(subjectField.id),
    title: String(subjectField.title),
    descriptionMarkdown,
  };
}
