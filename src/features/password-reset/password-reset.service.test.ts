import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    account: {
      updateMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  generatePasswordResetToken: vi.fn(() => "raw-reset-token"),
  hashPasswordResetToken: vi.fn((token: string) => `hash:${token}`),
  sendPasswordResetEmail: vi.fn(),
  hashPassword: vi.fn(async () => "hashed-new-password"),
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("./password-reset-token.service", () => ({
  generatePasswordResetToken: mocks.generatePasswordResetToken,
  hashPasswordResetToken: mocks.hashPasswordResetToken,
}));
vi.mock("./password-reset-email.adapter", () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));
vi.mock("better-auth/crypto", () => ({ hashPassword: mocks.hashPassword }));

import { PasswordResetTokenStatus } from "@prisma-generated-client";
import {
  PasswordResetDomainError,
  confirmPasswordReset,
  requestPasswordReset,
  resolvePasswordResetToken,
} from "./password-reset.service";

describe("password-reset.service", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mocks.prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof mocks.prisma) => Promise<unknown>) => cb(mocks.prisma),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates one pending token for a known credential user and invalidates older pending tokens", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "student@enade.local",
      accounts: [{ id: "account_1" }],
    });
    mocks.prisma.passwordResetToken.create.mockResolvedValue({ id: "reset_1" });

    const result = await requestPasswordReset({
      email: " Student@Enade.Local ",
    });

    expect(result).toEqual({ sent: true });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "student@enade.local" },
      }),
    );
    expect(mocks.prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        status: PasswordResetTokenStatus.PENDING,
      },
      data: {
        status: PasswordResetTokenStatus.CANCELLED,
      },
    });
    expect(mocks.prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        tokenHash: "hash:raw-reset-token",
        status: PasswordResetTokenStatus.PENDING,
        expiresAt: new Date("2026-06-10T13:00:00.000Z"),
      },
    });
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: "student@enade.local",
      token: "raw-reset-token",
    });
  });

  it("returns generic success without token creation for unknown email", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    const result = await requestPasswordReset({
      email: "missing@enade.local",
    });

    expect(result).toEqual({ sent: false });
    expect(mocks.generatePasswordResetToken).toHaveBeenCalled();
    expect(mocks.hashPasswordResetToken).toHaveBeenCalledWith("raw-reset-token");
    expect(mocks.prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not create a reset token for users without credential account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "student@enade.local",
      accounts: [],
    });

    const result = await requestPasswordReset({
      email: "student@enade.local",
    });

    expect(result).toEqual({ sent: false });
    expect(mocks.prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("resolves valid pending tokens", async () => {
    mocks.prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset_1",
      userId: "user_1",
      status: PasswordResetTokenStatus.PENDING,
      expiresAt: new Date("2026-06-10T13:00:00.000Z"),
    });

    const result = await resolvePasswordResetToken("raw-reset-token");

    expect(result).toEqual({
      id: "reset_1",
      userId: "user_1",
      expiresAt: new Date("2026-06-10T13:00:00.000Z"),
    });
  });

  it("rejects invalid, non-pending, and expired tokens", async () => {
    mocks.prisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
    await expect(resolvePasswordResetToken("missing")).rejects.toMatchObject({
      code: "PASSWORD_RESET_TOKEN_NOT_FOUND",
    } satisfies Partial<PasswordResetDomainError>);

    mocks.prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "reset_1",
      userId: "user_1",
      status: PasswordResetTokenStatus.USED,
      expiresAt: new Date("2026-06-10T13:00:00.000Z"),
    });
    await expect(resolvePasswordResetToken("used")).rejects.toMatchObject({
      code: "PASSWORD_RESET_TOKEN_NOT_PENDING",
    } satisfies Partial<PasswordResetDomainError>);

    mocks.prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "reset_1",
      userId: "user_1",
      status: PasswordResetTokenStatus.PENDING,
      expiresAt: new Date("2026-06-10T11:59:59.000Z"),
    });
    await expect(resolvePasswordResetToken("expired")).rejects.toMatchObject({
      code: "PASSWORD_RESET_TOKEN_EXPIRED",
    } satisfies Partial<PasswordResetDomainError>);
    expect(mocks.prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: "reset_1" },
      data: { status: PasswordResetTokenStatus.EXPIRED },
    });
  });

  it("confirms a valid token by updating password, marking token used, and deleting sessions", async () => {
    mocks.prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset_1",
      userId: "user_1",
      status: PasswordResetTokenStatus.PENDING,
      expiresAt: new Date("2026-06-10T13:00:00.000Z"),
    });
    mocks.prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.account.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.session.deleteMany.mockResolvedValue({ count: 2 });

    await confirmPasswordReset({
      token: "raw-reset-token",
      password: "new-password",
      passwordConfirmation: "new-password",
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith("new-password");
    expect(mocks.prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: "reset_1",
        status: PasswordResetTokenStatus.PENDING,
        expiresAt: { gt: now },
      },
      data: {
        status: PasswordResetTokenStatus.USED,
        usedAt: now,
      },
    });
    expect(mocks.prisma.account.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        providerId: "credential",
      },
      data: {
        password: "hashed-new-password",
      },
    });
    expect(mocks.prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
  });

  it("rejects reused tokens without updating password again", async () => {
    mocks.prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset_1",
      userId: "user_1",
      status: PasswordResetTokenStatus.PENDING,
      expiresAt: new Date("2026-06-10T13:00:00.000Z"),
    });
    mocks.prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      confirmPasswordReset({
        token: "raw-reset-token",
        password: "new-password",
        passwordConfirmation: "new-password",
      }),
    ).rejects.toMatchObject({
      code: "PASSWORD_RESET_TOKEN_NOT_PENDING",
    } satisfies Partial<PasswordResetDomainError>);

    expect(mocks.prisma.account.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.session.deleteMany).not.toHaveBeenCalled();
  });
});
