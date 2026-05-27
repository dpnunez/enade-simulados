import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma-generated-client";

const mocks = vi.hoisted(() => ({
  prisma: {
    subjectField: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import {
  SubjectFieldDomainError,
  createSubjectField,
  listSubjectFields,
  updateSubjectField,
} from "./subject-field.service";

describe("subject-field.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists subject fields ordered by most recently updated", async () => {
    mocks.prisma.subjectField.findMany.mockResolvedValue([{ id: "sf_1" }]);

    const result = await listSubjectFields();

    expect(result).toEqual([{ id: "sf_1" }]);
    expect(mocks.prisma.subjectField.findMany).toHaveBeenCalledWith({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("creates subject field with normalized title and creator", async () => {
    mocks.prisma.subjectField.findUnique.mockResolvedValue(null);
    mocks.prisma.subjectField.create.mockResolvedValue({ id: "sf_1" });

    await createSubjectField(
      {
        title: "  Calculo   Aplicado ",
        description: " Area para materias de calculo. ",
        colorHex: "#2563eb",
      },
      "teacher_1",
    );

    expect(mocks.prisma.subjectField.create).toHaveBeenCalledWith({
      data: {
        title: "Calculo Aplicado",
        titleNormalized: "calculo aplicado",
        description: "Area para materias de calculo.",
        colorHex: "#2563EB",
        createdById: "teacher_1",
      },
    });
  });

  it("rejects duplicate create with casing and spacing variation", async () => {
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "sf_existing" });

    await expect(
      createSubjectField(
        {
          title: "  calculo  ",
          description: "Descricao valida.",
          colorHex: "#2563EB",
        },
        "teacher_1",
      ),
    ).rejects.toMatchObject({
      code: "SUBJECT_FIELD_TITLE_EXISTS",
    } satisfies Partial<SubjectFieldDomainError>);
  });

  it("updates a subject field by teacher", async () => {
    mocks.prisma.subjectField.findFirst.mockResolvedValue(null);
    mocks.prisma.subjectField.update.mockResolvedValue({ id: "sf_1" });

    await updateSubjectField(
      "sf_1",
      {
        title: "Algebra",
        description: "Area para materias de algebra.",
        colorHex: "#16A34A",
      },
      "teacher_2",
    );

    expect(mocks.prisma.subjectField.update).toHaveBeenCalledWith({
      where: { id: "sf_1" },
      data: {
        title: "Algebra",
        titleNormalized: "algebra",
        description: "Area para materias de algebra.",
        colorHex: "#16A34A",
      },
    });
  });

  it("allows same-title self update", async () => {
    mocks.prisma.subjectField.findFirst.mockResolvedValue(null);
    mocks.prisma.subjectField.update.mockResolvedValue({ id: "sf_1" });

    await updateSubjectField(
      "sf_1",
      {
        title: "Calculo",
        description: "Nova descricao valida.",
        colorHex: "#9333EA",
      },
      "teacher_1",
    );

    expect(mocks.prisma.subjectField.findFirst).toHaveBeenCalledWith({
      where: {
        titleNormalized: "calculo",
        NOT: { id: "sf_1" },
      },
      select: { id: true },
    });
    expect(mocks.prisma.subjectField.update).toHaveBeenCalled();
  });

  it("rejects duplicate update", async () => {
    mocks.prisma.subjectField.findFirst.mockResolvedValue({ id: "sf_2" });

    await expect(
      updateSubjectField(
        "sf_1",
        {
          title: "Calculo",
          description: "Descricao valida.",
          colorHex: "#2563EB",
        },
        "teacher_1",
      ),
    ).rejects.toMatchObject({
      code: "SUBJECT_FIELD_TITLE_EXISTS",
    } satisfies Partial<SubjectFieldDomainError>);
  });

  it("maps not-found update", async () => {
    mocks.prisma.subjectField.findFirst.mockResolvedValue(null);
    mocks.prisma.subjectField.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(
      updateSubjectField(
        "sf_missing",
        {
          title: "Calculo",
          description: "Descricao valida.",
          colorHex: "#2563EB",
        },
        "teacher_1",
      ),
    ).rejects.toMatchObject({
      code: "SUBJECT_FIELD_NOT_FOUND",
    } satisfies Partial<SubjectFieldDomainError>);
  });
});
