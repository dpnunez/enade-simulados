import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(async () => new Headers()),
  getSession: vi.fn(),
  hasRole: vi.fn(),
  updateSubjectField: vi.fn(),
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
    updateSubjectField: mocks.updateSubjectField,
  };
});

import { SubjectFieldDomainError } from "@/features/subject-fields/subject-field.service";
import { PATCH } from "./route";

function context(subjectFieldId: string) {
  return {
    params: Promise.resolve({ subjectFieldId }),
  } as RouteContext<"/api/subject-fields/[subjectFieldId]">;
}

describe("PATCH /api/subject-fields/[subjectFieldId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests before updating data", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user_1", role: "STUDENT" } });
    mocks.hasRole.mockReturnValue(false);

    const response = await PATCH(
      new Request("http://localhost/api/subject-fields/sf_1", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Calculo",
          description: "Area de calculos iniciais",
          colorHex: "#2563EB",
        }),
      }),
      context("sf_1"),
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(response.status).toBe(401);
    expect(mocks.updateSubjectField).not.toHaveBeenCalled();
  });

  it("updates subject field for teacher requests", async () => {
    const subjectField = { id: "sf_1", title: "Calculo" };
    mocks.getSession.mockResolvedValue({ user: { id: "teacher_1", role: "TEACHER" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.updateSubjectField.mockResolvedValue(subjectField);

    const response = await PATCH(
      new Request("http://localhost/api/subject-fields/sf_1", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Calculo",
          description: "Area de calculos iniciais",
          colorHex: "#2563eb",
        }),
      }),
      context("sf_1"),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      subjectField,
    });
    expect(mocks.updateSubjectField).toHaveBeenCalledWith(
      "sf_1",
      {
        title: "Calculo",
        description: "Area de calculos iniciais",
        colorHex: "#2563eb",
      },
      "teacher_1",
    );
  });

  it("returns stable duplicate and not-found error codes", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "teacher_1", role: "TEACHER" } });
    mocks.hasRole.mockReturnValue(true);
    mocks.updateSubjectField.mockRejectedValueOnce(
      new SubjectFieldDomainError("SUBJECT_FIELD_TITLE_EXISTS"),
    );
    mocks.updateSubjectField.mockRejectedValueOnce(
      new SubjectFieldDomainError("SUBJECT_FIELD_NOT_FOUND"),
    );

    const body = {
      title: "Calculo",
      description: "Area de calculos iniciais",
      colorHex: "#2563EB",
    };
    const duplicateResponse = await PATCH(
      new Request("http://localhost/api/subject-fields/sf_1", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      context("sf_1"),
    );
    const notFoundResponse = await PATCH(
      new Request("http://localhost/api/subject-fields/sf_1", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      context("sf_1"),
    );

    await expect(duplicateResponse.json()).resolves.toEqual({
      success: false,
      error: "SUBJECT_FIELD_TITLE_EXISTS",
    });
    await expect(notFoundResponse.json()).resolves.toEqual({
      success: false,
      error: "SUBJECT_FIELD_NOT_FOUND",
    });
    expect(duplicateResponse.status).toBe(409);
    expect(notFoundResponse.status).toBe(404);
  });
});
