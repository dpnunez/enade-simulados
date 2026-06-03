import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  knownRequestError: class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  },
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    invitation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  generateInvitationToken: vi.fn(() => "raw-token"),
  hashInvitationToken: vi.fn((token: string) => `hash:${token}`),
  hashPassword: vi.fn(async () => "hashed-password"),
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@prisma-generated-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@prisma-generated-client")>();
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      PrismaClientKnownRequestError: mocks.knownRequestError,
    },
  };
});
vi.mock("./invitation-token.service", () => ({
  generateInvitationToken: mocks.generateInvitationToken,
  hashInvitationToken: mocks.hashInvitationToken,
}));
vi.mock("better-auth/crypto", () => ({ hashPassword: mocks.hashPassword }));

import { InvitationStatus, Role } from "@prisma-generated-client";
import {
  InvitationDomainError,
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  resolveInvitationToken,
} from "./invitation.service";

describe("invitation.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates invitation successfully", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.invitation.findFirst.mockResolvedValue(null);
    mocks.prisma.invitation.create.mockResolvedValue({ id: "inv_1" });

    const result = await createInvitation({
      email: "User@Test.com",
      role: "TEACHER",
    });

    expect(result.token).toBe("raw-token");
    expect(mocks.prisma.invitation.create).toHaveBeenCalled();
  });

  it("rejects when email already exists", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(
      createInvitation({ email: "user@test.com", role: "STUDENT" }),
    ).rejects.toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
    } satisfies Partial<InvitationDomainError>);
  });

  it("rejects duplicate pending invitation", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.invitation.findFirst.mockResolvedValue({ id: "inv_1" });

    await expect(
      createInvitation({ email: "user@test.com", role: "STUDENT" }),
    ).rejects.toMatchObject({
      code: "PENDING_INVITATION_EXISTS",
    } satisfies Partial<InvitationDomainError>);
  });

  it("resolves only pending invitation tokens", async () => {
    mocks.prisma.invitation.findUnique.mockResolvedValue({
      id: "inv_1",
      status: InvitationStatus.CANCELLED,
    });

    await expect(resolveInvitationToken("raw-token")).rejects.toMatchObject({
      code: "INVITATION_NOT_PENDING",
    } satisfies Partial<InvitationDomainError>);
  });

  it("cancels pending invitation", async () => {
    mocks.prisma.invitation.findUnique.mockResolvedValue({
      id: "inv_1",
      status: InvitationStatus.PENDING,
    });
    mocks.prisma.invitation.update.mockResolvedValue({
      id: "inv_1",
      status: InvitationStatus.CANCELLED,
    });

    await cancelInvitation({ invitationId: "inv_1" });

    expect(mocks.prisma.invitation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inv_1" } }),
    );
  });

  it("accepts invitation with transaction and creates credential account using submitted nick", async () => {
    mocks.prisma.invitation.findUnique.mockResolvedValue({
      id: "inv_1",
      email: "student@example.com",
      role: Role.STUDENT,
      status: InvitationStatus.PENDING,
    });
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    const tx = {
      user: { create: vi.fn(async () => ({ id: "u1" })) },
      invitation: { update: vi.fn(async () => ({ id: "inv_1" })) },
    };

    mocks.prisma.$transaction.mockImplementation(
      async (cb: (ctx: typeof tx) => Promise<unknown>) => cb(tx),
    );

    await acceptInvitation({
      token: "raw-token",
      name: "Maria Silva",
      password: "password123",
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Maria Silva",
          email: "student@example.com",
          accounts: {
            create: expect.objectContaining({
              providerId: "credential",
              accountId: "student@example.com",
            }),
          },
        }),
      }),
    );
    expect(tx.invitation.update).toHaveBeenCalled();
  });

  it("rejects duplicate submitted nick before creating the user", async () => {
    mocks.prisma.invitation.findUnique.mockResolvedValue({
      id: "inv_1",
      email: "invitee@test.com",
      role: Role.STUDENT,
      status: InvitationStatus.PENDING,
    });
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "u_existing" });

    await expect(
      acceptInvitation({
        token: "raw-token",
        name: "maria_silva",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      code: "NAME_ALREADY_REGISTERED",
    } satisfies Partial<InvitationDomainError>);

    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("maps database name uniqueness races to domain error", async () => {
    mocks.prisma.invitation.findUnique.mockResolvedValue({
      id: "inv_1",
      email: "invitee@test.com",
      role: Role.STUDENT,
      status: InvitationStatus.PENDING,
    });
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.$transaction.mockRejectedValue(
      new mocks.knownRequestError("Unique constraint failed", { code: "P2002" }),
    );

    await expect(
      acceptInvitation({
        token: "raw-token",
        name: "maria_silva",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      code: "NAME_ALREADY_REGISTERED",
    } satisfies Partial<InvitationDomainError>);
  });
});
