import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasRole: vi.fn(),
  headers: vi.fn(),
  sendInvitationEmail: vi.fn(),
  createInvitation: vi.fn(),
  listPendingInvitationsPage: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@auth/server", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@auth/authorization", () => ({ hasRole: mocks.hasRole }));
vi.mock("@/features/invitations/invitation-email.adapter", () => ({
  sendInvitationEmail: mocks.sendInvitationEmail,
}));
vi.mock("@/features/invitations/invitation.service", () => {
  class InvitationDomainError extends Error {
    constructor(public readonly code: string) {
      super(code);
      this.name = "InvitationDomainError";
    }
  }

  return {
    InvitationDomainError,
    createInvitation: mocks.createInvitation,
    listPendingInvitationsPage: mocks.listPendingInvitationsPage,
  };
});

import { GET, POST } from "./route";

function request(url: string) {
  return new Request(url);
}

function jsonRequest(body: unknown) {
  return {
    json: vi.fn(async () => body),
  } as unknown as Request;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("invitations route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { role: "ADMIN" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.listPendingInvitationsPage.mockResolvedValue({
      rows: [],
      rowCount: 0,
      page: 1,
      pageSize: 20,
      pageCount: 0,
    });
    mocks.createInvitation.mockResolvedValue({
      invitation: {
        id: "inv_1",
        email: "teacher@enade.local",
        role: "TEACHER",
      },
      token: "raw-token",
    });
  });

  it("bloqueia leitura para usuarios nao admin", async () => {
    mocks.hasRole.mockReturnValue(false);

    const response = await GET(request("http://localhost/api/invitations"));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(mocks.listPendingInvitationsPage).not.toHaveBeenCalled();
  });

  it("valida query params de leitura", async () => {
    const response = await GET(
      request("http://localhost/api/invitations?page=0"),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.listPendingInvitationsPage).not.toHaveBeenCalled();
  });

  it("retorna convites pendentes paginados", async () => {
    mocks.listPendingInvitationsPage.mockResolvedValue({
      rows: [{ id: "inv_1", email: "teacher@enade.local" }],
      rowCount: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });

    const response = await GET(
      request(
        "http://localhost/api/invitations?page=1&pageSize=20&sort=email&direction=asc",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.listPendingInvitationsPage).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: "email",
      direction: "asc",
    });
    expect(await json(response)).toEqual({
      success: true,
      rows: [{ id: "inv_1", email: "teacher@enade.local" }],
      rowCount: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });
  });

  it("mantem criacao de convite via POST", async () => {
    const response = await POST(
      jsonRequest({ email: "Teacher@Enade.Local", role: "TEACHER" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createInvitation).toHaveBeenCalledWith({
      email: "teacher@enade.local",
      role: "TEACHER",
    });
    expect(mocks.sendInvitationEmail).toHaveBeenCalledWith({
      email: "teacher@enade.local",
      role: "TEACHER",
      token: "raw-token",
    });
    expect(await json(response)).toMatchObject({ success: true });
  });
});
