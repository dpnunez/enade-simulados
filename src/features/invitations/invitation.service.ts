import { hashPassword } from "better-auth/crypto";

import { InvitationStatus, Prisma, Role } from "@prisma-generated-client";
import { prisma } from "@infra/db/prisma";

import {
  acceptInvitationSchema,
  cancelInvitationSchema,
  createInvitationSchema,
  type AcceptInvitationInput,
  type CancelInvitationInput,
  type CreateInvitationInput,
} from "./invitation.schema";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "./invitation-token.service";

export type InvitationErrorCode =
  | "EMAIL_ALREADY_REGISTERED"
  | "NAME_ALREADY_REGISTERED"
  | "PENDING_INVITATION_EXISTS"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_NOT_PENDING";

export class InvitationDomainError extends Error {
  constructor(public readonly code: InvitationErrorCode) {
    super(code);
    this.name = "InvitationDomainError";
  }
}

const prismaKnownRequestErrorCode = {
  uniqueConstraintFailed: "P2002",
} as const;

function getPrismaErrorCode(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  return error.code;
}

function mapInvitationWriteError(error: unknown): never {
  if (getPrismaErrorCode(error) === prismaKnownRequestErrorCode.uniqueConstraintFailed) {
    throw new InvitationDomainError("NAME_ALREADY_REGISTERED");
  }

  throw error;
}

export async function createInvitation(input: CreateInvitationInput) {
  const parsed = createInvitationSchema.parse(input);

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existingUser) throw new InvitationDomainError("EMAIL_ALREADY_REGISTERED");

  const existingPending = await prisma.invitation.findFirst({
    where: { email: parsed.email, status: InvitationStatus.PENDING },
    select: { id: true },
  });
  if (existingPending) throw new InvitationDomainError("PENDING_INVITATION_EXISTS");

  const token = generateInvitationToken();
  const invitation = await prisma.invitation.create({
    data: {
      email: parsed.email,
      role: parsed.role,
      tokenHash: hashInvitationToken(token),
      status: InvitationStatus.PENDING,
    },
  });

  return { invitation, token };
}

export async function listPendingInvitations() {
  return prisma.invitation.findMany({
    where: { status: InvitationStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveInvitationToken(token: string) {
  const tokenHash = hashInvitationToken(token);
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash } });

  if (!invitation) throw new InvitationDomainError("INVITATION_NOT_FOUND");
  if (invitation.status !== InvitationStatus.PENDING) {
    throw new InvitationDomainError("INVITATION_NOT_PENDING");
  }

  return invitation;
}

export async function cancelInvitation(input: CancelInvitationInput) {
  const parsed = cancelInvitationSchema.parse(input);
  const invitation = await prisma.invitation.findUnique({ where: { id: parsed.invitationId } });

  if (!invitation) throw new InvitationDomainError("INVITATION_NOT_FOUND");
  if (invitation.status !== InvitationStatus.PENDING) {
    throw new InvitationDomainError("INVITATION_NOT_PENDING");
  }

  return prisma.invitation.update({
    where: { id: parsed.invitationId },
    data: { status: InvitationStatus.CANCELLED, cancelledAt: new Date() },
  });
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const parsed = acceptInvitationSchema.parse(input);
  const invitation = await resolveInvitationToken(parsed.token);

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) throw new InvitationDomainError("EMAIL_ALREADY_REGISTERED");

  const existingName = await prisma.user.findUnique({ where: { name: parsed.name } });
  if (existingName) throw new InvitationDomainError("NAME_ALREADY_REGISTERED");

  const passwordHash = await hashPassword(parsed.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.name,
          email: invitation.email,
          emailVerified: true,
          role: invitation.role as Role,
          accounts: {
            create: {
              providerId: "credential",
              accountId: invitation.email,
              password: passwordHash,
            },
          },
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return { user };
    });
  } catch (error) {
    mapInvitationWriteError(error);
  }
}
