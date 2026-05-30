import { prisma } from "@infra/db/prisma";
import { Prisma } from "@prisma-generated-client";

import {
  questionIdSchema,
  questionInputSchema,
  type ParsedQuestionInput,
  type QuestionInput,
} from "./question.schema";
import { createQuestionContentHash } from "./question-content-hash";

export type QuestionErrorCode =
  | "QUESTION_NOT_FOUND"
  | "QUESTION_SUBJECT_FIELD_NOT_FOUND"
  | "QUESTION_DUPLICATE_CONTENT";

export class QuestionDomainError extends Error {
  constructor(public readonly code: QuestionErrorCode) {
    super(code);
    this.name = "QuestionDomainError";
  }
}

export type QuestionListItem = Awaited<ReturnType<typeof listQuestions>>[number];
export type QuestionEditable = Awaited<ReturnType<typeof getQuestionForEdit>>;

const questionInclude = {
  subjectField: true,
  alternatives: { orderBy: { position: "asc" as const } },
};

const prismaKnownRequestErrorCode = {
  requiredRecordNotFound: "P2025",
  foreignKeyConstraintFailed: "P2003",
  uniqueConstraintFailed: "P2002",
} as const;

function getPrismaErrorCode(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  return error.code;
}

function mapQuestionWriteError(error: unknown): never {
  const prismaErrorCode = getPrismaErrorCode(error);

  if (prismaErrorCode === prismaKnownRequestErrorCode.uniqueConstraintFailed) {
    throw new QuestionDomainError("QUESTION_DUPLICATE_CONTENT");
  }

  if (prismaErrorCode === prismaKnownRequestErrorCode.requiredRecordNotFound) {
    throw new QuestionDomainError("QUESTION_NOT_FOUND");
  }

  if (prismaErrorCode === prismaKnownRequestErrorCode.foreignKeyConstraintFailed) {
    throw new QuestionDomainError("QUESTION_SUBJECT_FIELD_NOT_FOUND");
  }

  throw error;
}

async function ensureSubjectFieldExists(subjectFieldId: string) {
  const subjectField = await prisma.subjectField.findUnique({
    where: { id: subjectFieldId },
    select: { id: true },
  });

  if (!subjectField) {
    throw new QuestionDomainError("QUESTION_SUBJECT_FIELD_NOT_FOUND");
  }
}

function alternativeCreateData(parsed: ParsedQuestionInput) {
  return parsed.alternatives.map((alternative, position) => ({
    contentMarkdown: alternative.contentMarkdown,
    position,
    isCorrect: alternative.isCorrect,
  }));
}

function questionData(parsed: ParsedQuestionInput) {
  return {
    descriptionMarkdown: parsed.descriptionMarkdown,
    contentHash: createQuestionContentHash(parsed.descriptionMarkdown),
    difficulty: parsed.difficulty,
    source: parsed.source,
    year: parsed.year,
    subjectFieldId: parsed.subjectFieldId,
    correctAnswerExplanation: parsed.correctAnswerExplanation,
  };
}

export async function listQuestions() {
  return prisma.question.findMany({
    include: questionInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getQuestionForEdit(questionId: string) {
  const id = questionIdSchema.parse(questionId);
  const question = await prisma.question.findUnique({
    where: { id },
    include: questionInclude,
  });

  if (!question) {
    throw new QuestionDomainError("QUESTION_NOT_FOUND");
  }

  return question;
}

export async function createQuestion(input: QuestionInput, actorUserId: string) {
  const parsed = questionInputSchema.parse(input);

  await ensureSubjectFieldExists(parsed.subjectFieldId);

  try {
    return await prisma.$transaction((tx) =>
      tx.question.create({
        data: {
          ...questionData(parsed),
          createdById: actorUserId,
          alternatives: {
            create: alternativeCreateData(parsed),
          },
        },
        include: questionInclude,
      }),
    );
  } catch (error) {
    mapQuestionWriteError(error);
  }
}

export async function updateQuestion(
  questionId: string,
  input: QuestionInput,
  actorUserId: string,
) {
  void actorUserId;

  const id = questionIdSchema.parse(questionId);
  const parsed = questionInputSchema.parse(input);

  const existingQuestion = await prisma.question.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingQuestion) {
    throw new QuestionDomainError("QUESTION_NOT_FOUND");
  }

  await ensureSubjectFieldExists(parsed.subjectFieldId);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: questionData(parsed),
      });

      await tx.questionAlternative.deleteMany({
        where: { questionId: id },
      });

      await tx.questionAlternative.createMany({
        data: alternativeCreateData(parsed).map((alternative) => ({
          questionId: id,
          ...alternative,
        })),
      });

      const updatedQuestion = await tx.question.findUnique({
        where: { id },
        include: questionInclude,
      });

      if (!updatedQuestion) {
        throw new QuestionDomainError("QUESTION_NOT_FOUND");
      }

      return updatedQuestion;
    });
  } catch (error) {
    mapQuestionWriteError(error);
  }
}

export async function deleteQuestion(questionId: string, actorUserId: string) {
  void actorUserId;

  const id = questionIdSchema.parse(questionId);

  try {
    return await prisma.question.delete({
      where: { id },
    });
  } catch (error) {
    mapQuestionWriteError(error);
  }
}
