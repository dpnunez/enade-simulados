import { prisma } from "@infra/db/prisma";
import { Prisma } from "@prisma-generated-client";

import {
  questionIdSchema,
  questionInputSchema,
  questionListQuerySchema,
  type ParsedQuestionInput,
  type ParsedQuestionListQuery,
  type QuestionListQueryInput,
  type QuestionInput,
} from "./question.schema";
import { createQuestionDescriptionHash } from "./question-description-hash";

export type QuestionErrorCode =
  | "QUESTION_NOT_FOUND"
  | "QUESTION_SUBJECT_FIELD_NOT_FOUND"
  | "QUESTION_DUPLICATE_CONTENT"
  | "QUESTION_RELATION_IN_USE";

export class QuestionDomainError extends Error {
  constructor(public readonly code: QuestionErrorCode) {
    super(code);
    this.name = "QuestionDomainError";
  }
}

export type QuestionListItem = Awaited<ReturnType<typeof listQuestions>>[number];
export type PaginatedQuestionList = Awaited<ReturnType<typeof listQuestionsPaginated>>;
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
    throw new QuestionDomainError("QUESTION_RELATION_IN_USE");
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

async function syncQuestionAlternatives(
  tx: Prisma.TransactionClient,
  questionId: string,
  parsed: ParsedQuestionInput,
) {
  const existingAlternatives = await tx.questionAlternative.findMany({
    where: { questionId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const nextAlternatives = alternativeCreateData(parsed);

  await Promise.all(
    nextAlternatives
      .slice(0, existingAlternatives.length)
      .map((alternative, position) =>
        tx.questionAlternative.update({
          where: { id: existingAlternatives[position].id },
          data: alternative,
        }),
      ),
  );

  if (nextAlternatives.length > existingAlternatives.length) {
    await tx.questionAlternative.createMany({
      data: nextAlternatives
        .slice(existingAlternatives.length)
        .map((alternative) => ({
          questionId,
          ...alternative,
        })),
    });
  }

  if (existingAlternatives.length > nextAlternatives.length) {
    await tx.questionAlternative.deleteMany({
      where: {
        id: {
          in: existingAlternatives
            .slice(nextAlternatives.length)
            .map((alternative) => alternative.id),
        },
      },
    });
  }
}

function questionData(parsed: ParsedQuestionInput) {
  return {
    descriptionMarkdown: parsed.descriptionMarkdown,
    descriptionHash: createQuestionDescriptionHash(parsed.descriptionMarkdown),
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

function orderByForQuestionList(query: ParsedQuestionListQuery) {
  if (query.sort === "subjectField") {
    return { subjectField: { title: query.direction } };
  }

  return { [query.sort]: query.direction };
}

export async function listQuestionsPaginated(
  input: Partial<QuestionListQueryInput> = {},
) {
  const query = questionListQuerySchema.parse(input);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, rowCount] = await prisma.$transaction([
    prisma.question.findMany({
      include: questionInclude,
      orderBy: orderByForQuestionList(query),
      skip,
      take: query.pageSize,
    }),
    prisma.question.count(),
  ]);

  return {
    rows,
    rowCount,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(rowCount / query.pageSize)),
  };
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

      await syncQuestionAlternatives(tx, id, parsed);

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
