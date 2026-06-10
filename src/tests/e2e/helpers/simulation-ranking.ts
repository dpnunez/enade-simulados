import knex from "knex";
import { randomUUID } from "node:crypto";

import { createQuestionDescriptionHash } from "@/features/questions/question-description-hash";

export const SIMULATION_RANKING_E2E_PREFIX = "E2E Ranking";
const createdStudentEmailDomain = "ranking.e2e.local";

function buildE2eId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

async function getUserIdByEmail(db: knex.Knex, email: string) {
  const user = await db("User").where({ email }).first("id");

  return String(user.id);
}

async function createRankingQuestionSet(db: knex.Knex) {
  const teacherId = await getUserIdByEmail(db, "teacher@enade.local");
  const subjectTitle = `${SIMULATION_RANKING_E2E_PREFIX} Grande Area`;
  const [subjectField] = await db("SubjectField")
    .insert({
      id: buildE2eId("sf"),
      title: subjectTitle,
      titleNormalized: subjectTitle.toLowerCase(),
      description: "Grande area deterministica para ranking E2E.",
      colorHex: "#0F766E",
      createdById: teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  const difficulties = ["EASY", "MEDIUM", "HARD"] as const;
  const questions = [];

  for (const [index, difficulty] of difficulties.entries()) {
    const descriptionMarkdown = `${SIMULATION_RANKING_E2E_PREFIX} Questao ${index + 1}`;
    const [question] = await db("Question")
      .insert({
        id: buildE2eId("question"),
        descriptionMarkdown,
        descriptionHash: createQuestionDescriptionHash(descriptionMarkdown),
        difficulty,
        source: "MANUAL",
        year: 2026,
        subjectFieldId: subjectField.id,
        correctAnswerExplanation: "Explicacao deterministica para ranking.",
        createdById: teacherId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");

    const [correctAlternative] = await db("QuestionAlternative")
      .insert({
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: `Correta ${difficulty}`,
        position: 0,
        isCorrect: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");
    const [wrongAlternative] = await db("QuestionAlternative")
      .insert({
        id: buildE2eId("alternative"),
        questionId: question.id,
        contentMarkdown: `Incorreta ${difficulty}`,
        position: 1,
        isCorrect: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning("id");

    questions.push({
      questionId: String(question.id),
      difficulty,
      subjectFieldId: String(subjectField.id),
      correctAlternativeId: String(correctAlternative.id),
      wrongAlternativeId: String(wrongAlternative.id),
    });
  }

  return { subjectFieldId: String(subjectField.id), questions };
}

async function ensureRankingStudent(
  db: knex.Knex,
  label: string,
  email?: string,
) {
  const userEmail =
    email ?? `${label.toLowerCase().replaceAll(" ", ".")}@${createdStudentEmailDomain}`;
  const existing = await db("User").where({ email: userEmail }).first("id");

  if (existing) return String(existing.id);

  const [user] = await db("User")
    .insert({
      id: buildE2eId("user"),
      name: `${SIMULATION_RANKING_E2E_PREFIX} ${label}`,
      email: userEmail,
      emailVerified: true,
      role: "STUDENT",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning("id");

  return String(user.id);
}

async function createCompletedAttempt(
  db: knex.Knex,
  input: {
    studentId: string;
    subjectFieldId: string;
    answers: Array<{
      questionId: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      subjectFieldId: string;
      isCorrect: boolean;
      correctAlternativeId: string;
      wrongAlternativeId: string;
    }>;
  },
) {
  const correctCount = input.answers.filter((answer) => answer.isCorrect).length;
  const wrongCount = input.answers.length - correctCount;
  const now = new Date();
  const [attempt] = await db("SimulationAttempt")
    .insert({
      id: buildE2eId("attempt"),
      studentId: input.studentId,
      status: "COMPLETED",
      requestedQuestionCount: input.answers.length,
      totalQuestions: input.answers.length,
      answeredCount: input.answers.length,
      correctCount,
      wrongCount,
      scorePercent: Math.round((correctCount / input.answers.length) * 10_000) / 100,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning("id");

  await db("SimulationAttemptSubjectField").insert({
    attemptId: attempt.id,
    subjectFieldId: input.subjectFieldId,
  });

  for (const [position, answer] of input.answers.entries()) {
    const [attemptQuestion] = await db("SimulationAttemptQuestion")
      .insert({
        id: buildE2eId("attempt_question"),
        attemptId: attempt.id,
        questionId: answer.questionId,
        position,
        difficulty: answer.difficulty,
        subjectFieldId: answer.subjectFieldId,
      })
      .returning("id");

    await db("SimulationAnswer").insert({
      id: buildE2eId("answer"),
      attemptQuestionId: attemptQuestion.id,
      selectedAlternativeId: answer.isCorrect
        ? answer.correctAlternativeId
        : answer.wrongAlternativeId,
      correctAlternativeId: answer.correctAlternativeId,
      isCorrect: answer.isCorrect,
      answeredAt: now,
    });
  }
}

export async function eraseSimulationRankingE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const rankingQuestionIds = db("Question")
    .select("id")
    .where("descriptionMarkdown", "like", `${SIMULATION_RANKING_E2E_PREFIX}%`);

  const rankingSubjectFieldIds = db("SubjectField")
    .select("id")
    .where("title", "like", `${SIMULATION_RANKING_E2E_PREFIX}%`);

  const rankingAttemptIds = db("SimulationAttempt")
    .select("SimulationAttempt.id")
    .leftJoin(
      "SimulationAttemptQuestion",
      "SimulationAttemptQuestion.attemptId",
      "SimulationAttempt.id",
    )
    .leftJoin(
      "SimulationAttemptSubjectField",
      "SimulationAttemptSubjectField.attemptId",
      "SimulationAttempt.id",
    )
    .whereIn("SimulationAttemptQuestion.questionId", rankingQuestionIds)
    .orWhereIn(
      "SimulationAttemptSubjectField.subjectFieldId",
      rankingSubjectFieldIds,
    );

  await db("SimulationAttempt").whereIn("id", rankingAttemptIds).del();
  await db("Question").whereIn("id", rankingQuestionIds).del();
  await db("SubjectField").whereIn("id", rankingSubjectFieldIds).del();
  await db("User").where("email", "like", `%@${createdStudentEmailDomain}`).del();

  await db.destroy();
}

export async function createSimulationRankingE2eData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  const questionSet = await createRankingQuestionSet(db);
  const seededStudentId = await getUserIdByEmail(db, "student@enade.local");
  const secondStudentId = await ensureRankingStudent(db, "Aluno Dois");

  await createCompletedAttempt(db, {
    studentId: seededStudentId,
    subjectFieldId: questionSet.subjectFieldId,
    answers: questionSet.questions.map((question) => ({
      ...question,
      isCorrect: true,
    })),
  });

  await createCompletedAttempt(db, {
    studentId: secondStudentId,
    subjectFieldId: questionSet.subjectFieldId,
    answers: questionSet.questions.map((question) => ({
      ...question,
      isCorrect: question.difficulty === "MEDIUM",
    })),
  });

  for (let index = 3; index <= 11; index += 1) {
    const studentId = await ensureRankingStudent(db, `Aluno ${index}`);
    await createCompletedAttempt(db, {
      studentId,
      subjectFieldId: questionSet.subjectFieldId,
      answers: questionSet.questions.map((question) => ({
        ...question,
        isCorrect: false,
      })),
    });
  }

  await db.destroy();

  return {
    topStudentEmail: "student@enade.local",
    topStudentName: "Student Test",
    secondStudentEmail: `aluno.dois@${createdStudentEmailDomain}`,
  };
}
