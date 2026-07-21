import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma-generated-client";

const mocks = vi.hoisted(() => {
  const prisma = {
    question: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    questionAlternative: {
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    subjectField: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return { prisma };
});

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import {
  QuestionDomainError,
  createQuestion,
  deleteQuestion,
  getQuestionForEdit,
  listQuestions,
  listQuestionsPaginated,
  updateQuestion,
} from "./question.service";

const validInput = {
  descriptionMarkdown: "  Enunciado da questao  ",
  difficulty: "MEDIUM",
  source: "MANUAL",
  year: "2024",
  subjectFieldId: "subject_field_1",
  correctAnswerExplanation: "  Explicacao da resposta.  ",
  alternatives: [
    { contentMarkdown: "  Alternativa A  ", isCorrect: false },
    { contentMarkdown: "  Alternativa B  ", isCorrect: true },
  ],
};

function mockTransaction() {
  mocks.prisma.$transaction.mockImplementation(async (callback) =>
    callback(mocks.prisma),
  );
}

describe("question.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction();
  });

  it("lists questions ordered by most recently updated with relations", async () => {
    mocks.prisma.question.findMany.mockResolvedValue([{ id: "question_1" }]);

    const result = await listQuestions();

    expect(result).toEqual([{ id: "question_1" }]);
    expect(mocks.prisma.question.findMany).toHaveBeenCalledWith({
      include: {
        subjectField: true,
        alternatives: { orderBy: { position: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("lists questions with pagination metadata", async () => {
    mocks.prisma.question.findMany.mockResolvedValue([{ id: "question_1" }]);
    mocks.prisma.question.count.mockResolvedValue(21);
    mocks.prisma.$transaction.mockResolvedValue([[{ id: "question_1" }], 21]);

    const result = await listQuestionsPaginated({
      page: "2",
      pageSize: "10",
      sort: "year",
      direction: "asc",
    });

    expect(result).toEqual({
      rows: [{ id: "question_1" }],
      rowCount: 21,
      page: 2,
      pageSize: 10,
      pageCount: 3,
    });
    expect(mocks.prisma.question.findMany).toHaveBeenCalledWith({
      include: {
        subjectField: true,
        alternatives: { orderBy: { position: "asc" } },
      },
      orderBy: { year: "asc" },
      skip: 10,
      take: 10,
    });
    expect(mocks.prisma.question.count).toHaveBeenCalledWith();
  });

  it("lists questions sorted by subject field title", async () => {
    mocks.prisma.question.findMany.mockResolvedValue([]);
    mocks.prisma.question.count.mockResolvedValue(0);
    mocks.prisma.$transaction.mockResolvedValue([[], 0]);

    const result = await listQuestionsPaginated({
      sort: "subjectField",
      direction: "asc",
    });

    expect(result.pageCount).toBe(1);
    expect(mocks.prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { subjectField: { title: "asc" } },
      }),
    );
  });

  it("gets a question for edit with relations", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });

    const result = await getQuestionForEdit("question_1");

    expect(result).toEqual({ id: "question_1" });
    expect(mocks.prisma.question.findUnique).toHaveBeenCalledWith({
      where: { id: "question_1" },
      include: {
        subjectField: true,
        alternatives: { orderBy: { position: "asc" } },
      },
    });
  });

  it("maps get-for-edit not found", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue(null);

    await expect(getQuestionForEdit("missing")).rejects.toMatchObject({
      code: "QUESTION_NOT_FOUND",
    } satisfies Partial<QuestionDomainError>);
  });

  it("creates a question with alternatives and creator in one transaction", async () => {
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.create.mockResolvedValue({ id: "question_1" });

    await createQuestion(validInput, "teacher_1");

    expect(mocks.prisma.question.create).toHaveBeenCalledWith({
      data: {
        descriptionMarkdown: "Enunciado da questao",
        descriptionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        difficulty: "MEDIUM",
        source: "MANUAL",
        year: 2024,
        subjectFieldId: "subject_field_1",
        correctAnswerExplanation: "Explicacao da resposta.",
        createdById: "teacher_1",
        alternatives: {
          create: [
            {
              contentMarkdown: "Alternativa A",
              position: 0,
              isCorrect: false,
            },
            {
              contentMarkdown: "Alternativa B",
              position: 1,
              isCorrect: true,
            },
          ],
        },
      },
      include: {
        subjectField: true,
        alternatives: { orderBy: { position: "asc" } },
      },
    });
  });

  it("rejects create when subject field is missing", async () => {
    mocks.prisma.subjectField.findUnique.mockResolvedValue(null);

    await expect(createQuestion(validInput, "teacher_1")).rejects.toMatchObject({
      code: "QUESTION_SUBJECT_FIELD_NOT_FOUND",
    } satisfies Partial<QuestionDomainError>);
    expect(mocks.prisma.question.create).not.toHaveBeenCalled();
  });

  it("maps duplicate content create conflicts", async () => {
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["descriptionHash"] },
      }),
    );

    await expect(createQuestion(validInput, "teacher_1")).rejects.toMatchObject({
      code: "QUESTION_DUPLICATE_CONTENT",
    } satisfies Partial<QuestionDomainError>);
  });

  it("rejects create with invalid correct count", async () => {
    await expect(
      createQuestion(
        {
          ...validInput,
          alternatives: [
            { contentMarkdown: "A", isCorrect: false },
            { contentMarkdown: "B", isCorrect: false },
          ],
        },
        "teacher_1",
      ),
    ).rejects.toThrow();
    expect(mocks.prisma.subjectField.findUnique).not.toHaveBeenCalled();
  });

  it("updates a question and syncs alternatives transactionally", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockResolvedValue({ id: "question_1" });
    mocks.prisma.questionAlternative.findMany.mockResolvedValue([
      { id: "alternative_1" },
      { id: "alternative_2" },
    ]);

    await updateQuestion("question_1", validInput, "teacher_1");

    expect(mocks.prisma.question.update).toHaveBeenCalledWith({
      where: { id: "question_1" },
      data: {
        descriptionMarkdown: "Enunciado da questao",
        descriptionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        difficulty: "MEDIUM",
        source: "MANUAL",
        year: 2024,
        subjectFieldId: "subject_field_1",
        correctAnswerExplanation: "Explicacao da resposta.",
      },
    });
    expect(mocks.prisma.questionAlternative.findMany).toHaveBeenCalledWith({
      where: { questionId: "question_1" },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    expect(mocks.prisma.questionAlternative.update).toHaveBeenNthCalledWith(1, {
      where: { id: "alternative_1" },
      data: {
        contentMarkdown: "Alternativa A",
        position: 0,
        isCorrect: false,
      },
    });
    expect(mocks.prisma.questionAlternative.update).toHaveBeenNthCalledWith(2, {
      where: { id: "alternative_2" },
      data: {
        contentMarkdown: "Alternativa B",
        position: 1,
        isCorrect: true,
      },
    });
    expect(mocks.prisma.questionAlternative.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.questionAlternative.createMany).not.toHaveBeenCalled();
  });

  it("creates extra alternatives when an update adds options", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockResolvedValue({ id: "question_1" });
    mocks.prisma.questionAlternative.findMany.mockResolvedValue([
      { id: "alternative_1" },
    ]);

    await updateQuestion("question_1", validInput, "teacher_1");

    expect(mocks.prisma.questionAlternative.update).toHaveBeenCalledWith({
      where: { id: "alternative_1" },
      data: {
        contentMarkdown: "Alternativa A",
        position: 0,
        isCorrect: false,
      },
    });
    expect(mocks.prisma.questionAlternative.createMany).toHaveBeenCalledWith({
      data: [
        {
          questionId: "question_1",
          contentMarkdown: "Alternativa B",
          position: 1,
          isCorrect: true,
        },
      ],
    });
  });

  it("deletes extra alternatives when an update removes options", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockResolvedValue({ id: "question_1" });
    mocks.prisma.questionAlternative.findMany.mockResolvedValue([
      { id: "alternative_1" },
      { id: "alternative_2" },
      { id: "alternative_3" },
    ]);

    await updateQuestion("question_1", validInput, "teacher_1");

    expect(mocks.prisma.questionAlternative.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["alternative_3"] } },
    });
  });

  it("maps not-found update", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue(null);

    await expect(
      updateQuestion("missing", validInput, "teacher_1"),
    ).rejects.toMatchObject({
      code: "QUESTION_NOT_FOUND",
    } satisfies Partial<QuestionDomainError>);
  });

  it("allows update when keeping the same content", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockResolvedValue({ id: "question_1" });

    await updateQuestion("question_1", validInput, "teacher_1");

    expect(mocks.prisma.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "question_1" },
        data: expect.objectContaining({
          descriptionMarkdown: "Enunciado da questao",
          descriptionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });

  it("maps duplicate content update conflicts before replacing alternatives", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["descriptionHash"] },
      }),
    );

    await expect(
      updateQuestion("question_1", validInput, "teacher_1"),
    ).rejects.toMatchObject({
      code: "QUESTION_DUPLICATE_CONTENT",
    } satisfies Partial<QuestionDomainError>);
    expect(mocks.prisma.questionAlternative.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.questionAlternative.createMany).not.toHaveBeenCalled();
  });

  it("maps relation conflicts on update without reporting a missing subject field", async () => {
    mocks.prisma.question.findUnique.mockResolvedValue({ id: "question_1" });
    mocks.prisma.subjectField.findUnique.mockResolvedValue({ id: "subject_field_1" });
    mocks.prisma.question.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    await expect(
      updateQuestion("question_1", validInput, "teacher_1"),
    ).rejects.toMatchObject({
      code: "QUESTION_RELATION_IN_USE",
    } satisfies Partial<QuestionDomainError>);
  });

  it("rolls back invalid update before replacing alternatives", async () => {
    await expect(
      updateQuestion(
        "question_1",
        {
          ...validInput,
          alternatives: [
            { contentMarkdown: "A", isCorrect: true },
            { contentMarkdown: "B", isCorrect: true },
          ],
        },
        "teacher_1",
      ),
    ).rejects.toThrow();

    expect(mocks.prisma.question.update).not.toHaveBeenCalled();
    expect(mocks.prisma.questionAlternative.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes a question", async () => {
    mocks.prisma.question.delete.mockResolvedValue({ id: "question_1" });

    await deleteQuestion("question_1", "teacher_1");

    expect(mocks.prisma.question.delete).toHaveBeenCalledWith({
      where: { id: "question_1" },
    });
  });

  it("maps not-found delete", async () => {
    mocks.prisma.question.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(deleteQuestion("missing", "teacher_1")).rejects.toMatchObject({
      code: "QUESTION_NOT_FOUND",
    } satisfies Partial<QuestionDomainError>);
  });

  it("maps relation conflicts on delete", async () => {
    mocks.prisma.question.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    await expect(deleteQuestion("question_1", "teacher_1")).rejects.toMatchObject({
      code: "QUESTION_RELATION_IN_USE",
    } satisfies Partial<QuestionDomainError>);
  });
});
