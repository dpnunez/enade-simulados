import { hashPassword } from "better-auth/crypto";

import { PasswordResetTokenStatus } from "@prisma-generated-client";
import { prisma } from "@infra/db/prisma";

import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
  type ConfirmPasswordResetInput,
  type RequestPasswordResetInput,
} from "./password-reset.schema";
import { sendPasswordResetEmail } from "./password-reset-email.adapter";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "./password-reset-token.service";

export type PasswordResetErrorCode =
  | "PASSWORD_RESET_TOKEN_NOT_FOUND"
  | "PASSWORD_RESET_TOKEN_NOT_PENDING"
  | "PASSWORD_RESET_TOKEN_EXPIRED"
  | "PASSWORD_RESET_ACCOUNT_NOT_CREDENTIAL";

export class PasswordResetDomainError extends Error {
  constructor(public readonly code: PasswordResetErrorCode) {
    super(code);
    this.name = "PasswordResetDomainError";
  }
}

const PASSWORD_RESET_EXPIRES_IN_MS = 60 * 60 * 1000;

function getExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_EXPIRES_IN_MS);
}

function isExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

async function runDummyTokenWork() {
  const token = generatePasswordResetToken();
  hashPasswordResetToken(token);
}

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  const parsed = requestPasswordResetSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: {
      id: true,
      email: true,
      accounts: {
        where: { providerId: "credential" },
        select: { id: true },
      },
    },
  });

  if (!user || user.accounts.length === 0) {
    await runDummyTokenWork();
    return { sent: false };
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = getExpiresAt();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        status: PasswordResetTokenStatus.PENDING,
      },
      data: {
        status: PasswordResetTokenStatus.CANCELLED,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        status: PasswordResetTokenStatus.PENDING,
        expiresAt,
      },
    });
  });

  await sendPasswordResetEmail({
    email: user.email,
    token,
  });

  return { sent: true };
}

export async function resolvePasswordResetToken(token: string) {
  const tokenHash = hashPasswordResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!resetToken) {
    throw new PasswordResetDomainError("PASSWORD_RESET_TOKEN_NOT_FOUND");
  }

  if (resetToken.status !== PasswordResetTokenStatus.PENDING) {
    throw new PasswordResetDomainError("PASSWORD_RESET_TOKEN_NOT_PENDING");
  }

  if (isExpired(resetToken.expiresAt)) {
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { status: PasswordResetTokenStatus.EXPIRED },
    });
    throw new PasswordResetDomainError("PASSWORD_RESET_TOKEN_EXPIRED");
  }

  return {
    id: resetToken.id,
    userId: resetToken.userId,
    expiresAt: resetToken.expiresAt,
  };
}

export async function confirmPasswordReset(input: ConfirmPasswordResetInput) {
  const parsed = confirmPasswordResetSchema.parse(input);
  const resetToken = await resolvePasswordResetToken(parsed.token);
  const passwordHash = await hashPassword(parsed.password);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const tokenUpdate = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        status: PasswordResetTokenStatus.PENDING,
        expiresAt: { gt: now },
      },
      data: {
        status: PasswordResetTokenStatus.USED,
        usedAt: now,
      },
    });

    if (tokenUpdate.count !== 1) {
      throw new PasswordResetDomainError("PASSWORD_RESET_TOKEN_NOT_PENDING");
    }

    const accountUpdate = await tx.account.updateMany({
      where: {
        userId: resetToken.userId,
        providerId: "credential",
      },
      data: {
        password: passwordHash,
      },
    });

    if (accountUpdate.count !== 1) {
      throw new PasswordResetDomainError("PASSWORD_RESET_ACCOUNT_NOT_CREDENTIAL");
    }

    await tx.session.deleteMany({
      where: { userId: resetToken.userId },
    });
  });
}
