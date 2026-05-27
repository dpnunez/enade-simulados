import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(async () => new Headers()),
  getSession: vi.fn(),
  hasRole: vi.fn(),
  createSubjectField: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@auth/server", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@auth/authorization", () => ({ hasRole: mocks.hasRole }));
vi.mock("@/features/subject-fields/subject-field.service", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/subject-fields/subject-field.service")>(
      "@/features/subject-fields/subject-field.service",
    );

  return {
    SubjectFieldDomainError: actual.SubjectFieldDomainError,
    createSubjectField: mocks.createSubjectField,
  };
});

import { SubjectFieldDomainError } from "@/features/subject-fields/subject-field.service";
import { POST } from "./route";

describe("POST /api/subject-fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests before creating data", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user_1", role: "STUDENT" } });
    mocks.hasRole.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/subject-fields", {
        method: "POST",
        body: JSON.stringify({
          title: "Calculo",
          description: "Area de calculos iniciais",
          colorHex: "#2563EB",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(response.status).toBe(401);
    expect(mocks.createSubjectField).not.toHaveBeenCalled();
  });

  it("creates subject field for teacher requests", async () => {
    const subjectField = { id: "sf_1", title: "Calculo" };
    mocks.getSession.mockResolvedValue({ user: { id: "teacher_1", role: "TEACHER" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.createSubjectField.mockResolvedValue(subjectField);

    const response = await POST(
      new Request("http://localhost/api/subject-fields", {
        method: "POST",
        body: JSON.stringify({
          title: "Calculo",
          description: "Area de calculos iniciais",
          colorHex: "#2563eb",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      subjectField,
    });
    expect(mocks.createSubjectField).toHaveBeenCalledWith(
      {
        title: "Calculo",
        description: "Area de calculos iniciais",
        colorHex: "#2563eb",
      },
      "teacher_1",
    );
  });

  it("returns stable duplicate error codes", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "teacher_1", role: "TEACHER" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.createSubjectField.mockRejectedValue(
      new SubjectFieldDomainError("SUBJECT_FIELD_TITLE_EXISTS"),
    );

    const response = await POST(
      new Request("http://localhost/api/subject-fields", {
        method: "POST",
        body: JSON.stringify({
          title: "Calculo",
          description: "Area de calculos iniciais",
          colorHex: "#2563EB",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "SUBJECT_FIELD_TITLE_EXISTS",
    });
    expect(response.status).toBe(409);
  });
});
