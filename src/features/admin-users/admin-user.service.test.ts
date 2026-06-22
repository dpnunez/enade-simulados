import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import { listAdminUsers } from "./admin-user.service";

describe("admin-user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna usuarios e metadados de paginacao", async () => {
    const createdAt = new Date("2026-01-10T12:00:00.000Z");
    mocks.prisma.user.findMany.mockResolvedValue([
      {
        id: "user_1",
        name: "Admin",
        email: "admin@enade.local",
        role: "ADMIN",
        createdAt,
      },
    ]);
    mocks.prisma.user.count.mockResolvedValue(21);

    const result = await listAdminUsers({ page: 2, pageSize: 20 });

    expect(result).toEqual({
      rows: [
        {
          id: "user_1",
          name: "Admin",
          email: "admin@enade.local",
          role: "ADMIN",
          createdAt: createdAt.toISOString(),
        },
      ],
      rowCount: 21,
      page: 2,
      pageSize: 20,
      pageCount: 2,
    });
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      skip: 20,
      take: 20,
    });
  });

  it("ordena por campos permitidos com desempate estavel", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([]);
    mocks.prisma.user.count.mockResolvedValue(0);

    await listAdminUsers({ sort: "email", direction: "asc" });

    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ email: "asc" }, { id: "asc" }],
      }),
    );
  });

  it("rejeita parametros invalidos antes da consulta", async () => {
    await expect(listAdminUsers({ page: 0 })).rejects.toThrowError();

    expect(mocks.prisma.user.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.user.count).not.toHaveBeenCalled();
  });
});
