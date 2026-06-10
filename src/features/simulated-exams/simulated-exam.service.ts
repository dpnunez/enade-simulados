import type { Prisma, QuestionDifficulty } from "@prisma-generated-client";

import { prisma } from "@infra/db/prisma";

import {
  simulationAttemptIdSchema,
  simulationGenerationInputSchema,
  simulationSaveAnswersInputSchema,
  simulationSubmitInputSchema,
  type SimulationGenerationInput,
  type SimulationSaveAnswersInput,
  type SimulationSubmitInput,
} from "./simulated-exam.schema";
import {
  QuestionSelectionError,
  selectBalancedQuestions,
} from "./question-selection";

export type SimulationDomainErrorCode =
  | "SIMULATION_NOT_ENOUGH_QUESTIONS"
  | "SIMULATION_ATTEMPT_NOT_FOUND"
  | "SIMULATION_ATTEMPT_ALREADY_COMPLETED"
  | "SIMULATION_INVALID_ANSWER";

export class SimulationDomainError extends Error {
  constructor(
    public readonly code: SimulationDomainErrorCode,
    public readonly metadata?: { availableQuestionCount?: number },
  ) {
    super(code);
    this.name = "SimulationDomainError";
  }
}

type SimulationPrismaClient = typeof prisma | Prisma.TransactionClient;

export type SimulationAttemptSummary = Awaited<
  ReturnType<typeof listSimulationAttemptsForStudent>
>[number];
export type SimulationAttemptInProgressDetail = Awaited<
  ReturnType<typeof getInProgressSimulationAttemptForStudent>
>;
export type SimulationAttemptReviewDetail = Awaited<
  ReturnType<typeof getCompletedSimulationAttemptForStudent>
>;

function mapSelectionError(error: unknown): never {
  if (error instanceof QuestionSelectionError) {
    throw new SimulationDomainError("SIMULATION_NOT_ENOUGH_QUESTIONS", {
      availableQuestionCount: error.availableQuestionCount,
    });
  }

  throw error;
}

function scorePercent(correctCount: number, totalQuestions: number) {
  if (totalQuestions === 0) return 0;
  return Math.round((correctCount / totalQuestions) * 10_000) / 100;
}

function questionWeight(difficulty: QuestionDifficulty | null | undefined) {
  if (difficulty === "EASY") return 1;
  if (difficulty === "HARD") return 3;
  return 2;
}

export async function listEligibleSubjectFields() {
  return prisma.subjectField.findMany({
    where: {
      questions: {
        some: {},
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      colorHex: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });
}

export async function createSimulationAttempt(
  input: SimulationGenerationInput,
  studentId: string,
) {
  const parsed = simulationGenerationInputSchema.parse(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const selectedQuestions = await selectBalancedQuestions(parsed, tx);

      const attempt = await tx.simulationAttempt.create({
        data: {
          studentId,
          requestedQuestionCount: parsed.questionCount,
          totalQuestions: selectedQuestions.length,
          subjectFields: {
            create: parsed.subjectFieldIds.map((subjectFieldId) => ({
              subjectFieldId,
            })),
          },
          questions: {
            create: selectedQuestions.map((question) => ({
              questionId: question.questionId,
              position: question.position,
              difficulty: question.difficulty,
              subjectFieldId: question.subjectFieldId,
            })),
          },
        },
        select: {
          id: true,
          totalQuestions: true,
        },
      });

      return attempt;
    });
  } catch (error) {
    mapSelectionError(error);
  }
}

export async function getInProgressSimulationAttemptForStudent(
  attemptId: string,
  studentId: string,
  client: SimulationPrismaClient = prisma,
) {
  const id = simulationAttemptIdSchema.parse(attemptId);
  const attempt = await client.simulationAttempt.findFirst({
    where: {
      id,
      studentId,
      status: "IN_PROGRESS",
    },
    select: {
      id: true,
      status: true,
      totalQuestions: true,
      answeredCount: true,
      correctCount: true,
      wrongCount: true,
      scorePercent: true,
      createdAt: true,
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          difficulty: true,
          question: {
            select: {
              id: true,
              descriptionMarkdown: true,
              subjectField: {
                select: {
                  id: true,
                  title: true,
                  colorHex: true,
                },
              },
              alternatives: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  contentMarkdown: true,
                  position: true,
                },
              },
            },
          },
          answer: {
            select: {
              selectedAlternativeId: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new SimulationDomainError("SIMULATION_ATTEMPT_NOT_FOUND");
  }

  return {
    ...attempt,
    questions: attempt.questions.map((attemptQuestion) => ({
      id: attemptQuestion.id,
      position: attemptQuestion.position,
      difficulty: attemptQuestion.difficulty,
      selectedAlternativeId: attemptQuestion.answer?.selectedAlternativeId ?? null,
      question: attemptQuestion.question,
    })),
  };
}

export async function getCompletedSimulationAttemptForStudent(
  attemptId: string,
  studentId: string,
  client: SimulationPrismaClient = prisma,
) {
  const id = simulationAttemptIdSchema.parse(attemptId);
  const attempt = await client.simulationAttempt.findFirst({
    where: {
      id,
      studentId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      status: true,
      totalQuestions: true,
      answeredCount: true,
      correctCount: true,
      wrongCount: true,
      scorePercent: true,
      completedAt: true,
      createdAt: true,
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          difficulty: true,
          question: {
            select: {
              id: true,
              descriptionMarkdown: true,
              correctAnswerExplanation: true,
              subjectField: {
                select: {
                  id: true,
                  title: true,
                  colorHex: true,
                },
              },
              alternatives: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  contentMarkdown: true,
                  position: true,
                  isCorrect: true,
                },
              },
            },
          },
          answer: {
            select: {
              selectedAlternativeId: true,
              correctAlternativeId: true,
              isCorrect: true,
              answeredAt: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new SimulationDomainError("SIMULATION_ATTEMPT_NOT_FOUND");
  }

  return {
    ...attempt,
    questions: attempt.questions.map((attemptQuestion) => ({
      id: attemptQuestion.id,
      position: attemptQuestion.position,
      difficulty: attemptQuestion.difficulty,
      selectedAlternativeId: attemptQuestion.answer?.selectedAlternativeId ?? null,
      correctAlternativeId: attemptQuestion.answer?.correctAlternativeId ?? null,
      isCorrect: attemptQuestion.answer?.isCorrect ?? false,
      answeredAt: attemptQuestion.answer?.answeredAt ?? null,
      question: attemptQuestion.question,
    })),
  };
}

export async function submitSimulationAttempt(
  attemptId: string,
  input: SimulationSubmitInput,
  studentId: string,
) {
  const id = simulationAttemptIdSchema.parse(attemptId);
  const parsed = simulationSubmitInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.simulationAttempt.findFirst({
      where: {
        id,
        studentId,
      },
      select: {
        id: true,
        status: true,
        totalQuestions: true,
        questions: {
          select: {
            id: true,
            difficulty: true,
            answer: {
              select: {
                selectedAlternativeId: true,
              },
            },
            question: {
              select: {
                alternatives: {
                  select: {
                    id: true,
                    isCorrect: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new SimulationDomainError("SIMULATION_ATTEMPT_NOT_FOUND");
    }

    if (attempt.status === "COMPLETED") {
      throw new SimulationDomainError("SIMULATION_ATTEMPT_ALREADY_COMPLETED");
    }

    const attemptQuestionsById = new Map(
      attempt.questions.map((question) => [question.id, question]),
    );

    const selectedByAttemptQuestion = new Map(
      attempt.questions
        .filter((question) => question.answer?.selectedAlternativeId)
        .map((question) => [
          question.id,
          question.answer?.selectedAlternativeId ?? null,
        ]),
    );

    parsed.answers.forEach((answer) => {
      selectedByAttemptQuestion.set(
        answer.attemptQuestionId,
        answer.selectedAlternativeId,
      );
    });

    const correctedAnswers = Array.from(
      selectedByAttemptQuestion.entries(),
    ).map(([attemptQuestionId, selectedAlternativeId]) => {
      const attemptQuestion = attemptQuestionsById.get(attemptQuestionId);
      if (!attemptQuestion) {
        throw new SimulationDomainError("SIMULATION_INVALID_ANSWER");
      }

      const selectedAlternative = attemptQuestion.question.alternatives.find(
        (alternative) => alternative.id === selectedAlternativeId,
      );
      if (!selectedAlternative) {
        throw new SimulationDomainError("SIMULATION_INVALID_ANSWER");
      }

      const correctAlternative = attemptQuestion.question.alternatives.find(
        (alternative) => alternative.isCorrect,
      );
      if (!correctAlternative) {
        throw new SimulationDomainError("SIMULATION_INVALID_ANSWER");
      }

      return {
        attemptQuestionId,
        selectedAlternativeId: selectedAlternative.id,
        correctAlternativeId: correctAlternative.id,
        isCorrect: selectedAlternative.id === correctAlternative.id,
        difficulty: attemptQuestion.difficulty,
      };
    });

    await Promise.all(
      correctedAnswers.map((answer) =>
        tx.simulationAnswer.upsert({
          where: {
            attemptQuestionId: answer.attemptQuestionId,
          },
          create: {
            attemptQuestionId: answer.attemptQuestionId,
            selectedAlternativeId: answer.selectedAlternativeId,
            correctAlternativeId: answer.correctAlternativeId,
            isCorrect: answer.isCorrect,
          },
          update: {
            selectedAlternativeId: answer.selectedAlternativeId,
            correctAlternativeId: answer.correctAlternativeId,
            isCorrect: answer.isCorrect,
            answeredAt: new Date(),
          },
        }),
      ),
    );

    const answeredCount = correctedAnswers.length;
    const correctCount = correctedAnswers.filter((answer) => answer.isCorrect).length;
    const wrongCount = attempt.totalQuestions - correctCount;
    const weightedScore = correctedAnswers.reduce(
      (total, answer) =>
        answer.isCorrect ? total + questionWeight(answer.difficulty) : total,
      0,
    );

    await tx.simulationAttempt.update({
      where: { id },
      data: {
        status: "COMPLETED",
        answeredCount,
        correctCount,
        wrongCount,
        scorePercent: scorePercent(correctCount, attempt.totalQuestions),
        weightedScore,
        completedAt: new Date(),
      },
    });

    return getCompletedSimulationAttemptForStudent(id, studentId, tx);
  });
}

export async function saveSimulationAttemptAnswers(
  attemptId: string,
  input: SimulationSaveAnswersInput,
  studentId: string,
) {
  const id = simulationAttemptIdSchema.parse(attemptId);
  const parsed = simulationSaveAnswersInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.simulationAttempt.findFirst({
      where: {
        id,
        studentId,
      },
      select: {
        id: true,
        status: true,
        questions: {
          select: {
            id: true,
            answer: {
              select: {
                selectedAlternativeId: true,
              },
            },
            question: {
              select: {
                alternatives: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new SimulationDomainError("SIMULATION_ATTEMPT_NOT_FOUND");
    }

    if (attempt.status === "COMPLETED") {
      throw new SimulationDomainError("SIMULATION_ATTEMPT_ALREADY_COMPLETED");
    }

    const attemptQuestionsById = new Map(
      attempt.questions.map((question) => [question.id, question]),
    );
    const selectedByAttemptQuestion = new Map(
      attempt.questions
        .filter((question) => question.answer?.selectedAlternativeId)
        .map((question) => [
          question.id,
          question.answer?.selectedAlternativeId ?? null,
        ]),
    );

    parsed.answers.forEach((answer) => {
      const attemptQuestion = attemptQuestionsById.get(answer.attemptQuestionId);
      if (!attemptQuestion) {
        throw new SimulationDomainError("SIMULATION_INVALID_ANSWER");
      }

      const selectedAlternative = attemptQuestion.question.alternatives.find(
        (alternative) => alternative.id === answer.selectedAlternativeId,
      );
      if (!selectedAlternative) {
        throw new SimulationDomainError("SIMULATION_INVALID_ANSWER");
      }

      selectedByAttemptQuestion.set(
        answer.attemptQuestionId,
        selectedAlternative.id,
      );
    });

    await Promise.all(
      parsed.answers.map((answer) =>
        tx.simulationAnswer.upsert({
          where: {
            attemptQuestionId: answer.attemptQuestionId,
          },
          create: {
            attemptQuestionId: answer.attemptQuestionId,
            selectedAlternativeId: answer.selectedAlternativeId,
            correctAlternativeId: null,
            isCorrect: null,
          },
          update: {
            selectedAlternativeId: answer.selectedAlternativeId,
            correctAlternativeId: null,
            isCorrect: null,
            answeredAt: new Date(),
          },
        }),
      ),
    );

    await tx.simulationAttempt.update({
      where: { id },
      data: {
        answeredCount: selectedByAttemptQuestion.size,
      },
    });

    return getInProgressSimulationAttemptForStudent(id, studentId, tx);
  });
}

export async function listSimulationAttemptsForStudent(studentId: string) {
  return prisma.simulationAttempt.findMany({
    where: { studentId },
    select: {
      id: true,
      status: true,
      totalQuestions: true,
      answeredCount: true,
      correctCount: true,
      wrongCount: true,
      scorePercent: true,
      completedAt: true,
      createdAt: true,
      subjectFields: {
        select: {
          subjectField: {
            select: {
              id: true,
              title: true,
              colorHex: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
