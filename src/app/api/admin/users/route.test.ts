import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasRole: vi.fn(),
  headers: vi.fn(),
  listAdminUsers: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@auth/server", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@auth/authorization", () => ({ hasRole: mocks.hasRole }));
vi.mock("@/features/admin-users/admin-user.service", () => ({
  listAdminUsers: mocks.listAdminUsers,
}));

import { GET } from "./route";

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

function request(url: string) {
  return new Request(url);
}

describe("admin users route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { role: "ADMIN" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.listAdminUsers.mockResolvedValue({
      rows: [],
      rowCount: 0,
      page: 1,
      pageSize: 20,
      pageCount: 0,
    });
  });

  it("bloqueia usuarios nao admin", async () => {
    mocks.hasRole.mockReturnValue(false);

    const response = await GET(request("http://localhost/api/admin/users"));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(mocks.listAdminUsers).not.toHaveBeenCalled();
  });

  it("valida parametros da query", async () => {
    const response = await GET(
      request("http://localhost/api/admin/users?page=0"),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.listAdminUsers).not.toHaveBeenCalled();
  });

  it("retorna pagina de usuarios para admin", async () => {
    mocks.listAdminUsers.mockResolvedValue({
      rows: [{ id: "u1", email: "admin@enade.local" }],
      rowCount: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });

    const response = await GET(
      request(
        "http://localhost/api/admin/users?page=1&pageSize=20&sort=email&direction=asc",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.listAdminUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: "email",
      direction: "asc",
    });
    expect(await json(response)).toEqual({
      success: true,
      rows: [{ id: "u1", email: "admin@enade.local" }],
      rowCount: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });
  });
});
