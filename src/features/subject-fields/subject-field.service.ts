import { prisma } from "@infra/db/prisma";
import { Prisma } from "@prisma-generated-client";

import {
  subjectFieldIdSchema,
  subjectFieldInputSchema,
  type SubjectFieldInput,
} from "./subject-field.schema";

export type SubjectFieldErrorCode =
  | "SUBJECT_FIELD_TITLE_EXISTS"
  | "SUBJECT_FIELD_NOT_FOUND";

export class SubjectFieldDomainError extends Error {
  constructor(public readonly code: SubjectFieldErrorCode) {
    super(code);
    this.name = "SubjectFieldDomainError";
  }
}

export type SubjectFieldListItem = Awaited<ReturnType<typeof listSubjectFields>>[number];

const prismaKnownRequestErrorCode = {
  uniqueConstraintFailed: "P2002",
  requiredRecordNotFound: "P2025",
} as const;

function getPrismaErrorCode(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  return error.code;
}

function mapSubjectFieldWriteError(error: unknown): never {
  const prismaErrorCode = getPrismaErrorCode(error);

  if (prismaErrorCode === prismaKnownRequestErrorCode.uniqueConstraintFailed) {
    throw new SubjectFieldDomainError("SUBJECT_FIELD_TITLE_EXISTS");
  }

  if (prismaErrorCode === prismaKnownRequestErrorCode.requiredRecordNotFound) {
    throw new SubjectFieldDomainError("SUBJECT_FIELD_NOT_FOUND");
  }

  throw error;
}

export async function listSubjectFields() {
  return prisma.subjectField.findMany({
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createSubjectField(
  input: SubjectFieldInput,
  actorUserId: string,
) {
  const parsed = subjectFieldInputSchema.parse(input);

  const existing = await prisma.subjectField.findUnique({
    where: { titleNormalized: parsed.titleNormalized },
    select: { id: true },
  });
  if (existing) throw new SubjectFieldDomainError("SUBJECT_FIELD_TITLE_EXISTS");

  try {
    return await prisma.subjectField.create({
      data: {
        title: parsed.title,
        titleNormalized: parsed.titleNormalized,
        description: parsed.description,
        colorHex: parsed.colorHex,
        createdById: actorUserId,
      },
    });
  } catch (error) {
    mapSubjectFieldWriteError(error);
  }
}

export async function updateSubjectField(
  subjectFieldId: string,
  input: SubjectFieldInput,
  actorUserId: string,
) {
  void actorUserId;

  const id = subjectFieldIdSchema.parse(subjectFieldId);
  const parsed = subjectFieldInputSchema.parse(input);

  const duplicate = await prisma.subjectField.findFirst({
    where: {
      titleNormalized: parsed.titleNormalized,
      NOT: { id },
    },
    select: { id: true },
  });
  if (duplicate) throw new SubjectFieldDomainError("SUBJECT_FIELD_TITLE_EXISTS");

  try {
    return await prisma.subjectField.update({
      where: { id },
      data: {
        title: parsed.title,
        titleNormalized: parsed.titleNormalized,
        description: parsed.description,
        colorHex: parsed.colorHex,
      },
    });
  } catch (error) {
    mapSubjectFieldWriteError(error);
  }
}
