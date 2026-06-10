import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@prisma-generated-client";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(async () => new Headers()),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@auth/server", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

import { getCurrentSession, getRoleHomePath, requireAuth, requireRole } from "./session";

describe("session helpers", () => {
  const session = {
    user: {
      email: "admin@enade.local",
      role: "ADMIN" as Role,
    },
  };

  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.headers.mockClear();
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

  it("getRoleHomePath retorna a área inicial da role", () => {
    expect(getRoleHomePath("ADMIN")).toBe("/app/admin");
    expect(getRoleHomePath("STUDENT")).toBe("/app/student");
    expect(getRoleHomePath("TEACHER")).toBe("/app/teacher");
  });

  it("getCurrentSession encaminha os headers para a api de sessão", async () => {
    mocks.getSession.mockResolvedValue(session);

    await expect(getCurrentSession()).resolves.toEqual(session);

    expect(mocks.headers).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it("requireAuth redireciona para /login quando não há sessão", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
  });

  it("requireAuth retorna a sessão quando autenticado", async () => {
    mocks.getSession.mockResolvedValue(session);

    await expect(requireAuth()).resolves.toEqual(session);
  });

  it("requireRole redireciona para a área da role atual quando a role não bate", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        email: "student@enade.local",
        role: "STUDENT" as Role,
      },
    });

    await expect(requireRole("ADMIN")).rejects.toThrow("REDIRECT:/app/student");
  });

  it("requireRole retorna a sessão quando a role é válida", async () => {
    mocks.getSession.mockResolvedValue(session);

    await expect(requireRole("ADMIN")).resolves.toEqual(session);
  });
});
