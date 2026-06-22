import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const prisma = {
    subjectField: {
      findMany: vi.fn(),
    },
    simulationAttempt: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    simulationAnswer: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const selectBalancedQuestions = vi.fn();

  return { prisma, selectBalancedQuestions };
});

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("./question-selection", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./question-selection")>();

  return {
    ...actual,
    selectBalancedQuestions: mocks.selectBalancedQuestions,
  };
});

import {
  SimulationDomainError,
  createSimulationAttempt,
  getCompletedSimulationAttemptForStudent,
  getInProgressSimulationAttemptForStudent,
  listEligibleSubjectFields,
  listSimulationAttemptsPageForStudent,
  listSimulationAttemptsForStudent,
  saveSimulationAttemptAnswers,
  submitSimulationAttempt,
} from "./simulated-exam.service";

function mockTransaction() {
  mocks.prisma.$transaction.mockImplementation(async (callback) =>
    callback(mocks.prisma),
  );
}

function inProgressAttempt() {
  return {
    id: "attempt_1",
    status: "IN_PROGRESS",
    totalQuestions: 1,
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    scorePercent: 0,
    createdAt: new Date("2026-06-09T12:00:00Z"),
    questions: [
      {
        id: "attempt_question_1",
        position: 0,
        difficulty: "EASY",
        answer: null,
        question: {
          id: "question_1",
          descriptionMarkdown: "Enunciado",
          subjectField: {
            id: "subject_field_1",
            title: "Calculo",
            colorHex: "#2563EB",
          },
          alternatives: [
            {
              id: "alternative_1",
              contentMarkdown: "A",
              position: 0,
            },
          ],
        },
      },
    ],
  };
}

function completedAttempt() {
  return {
    id: "attempt_1",
    status: "COMPLETED",
    totalQuestions: 1,
    answeredCount: 1,
    correctCount: 1,
    wrongCount: 0,
    scorePercent: 100,
    completedAt: new Date("2026-06-09T12:05:00Z"),
    createdAt: new Date("2026-06-09T12:00:00Z"),
    questions: [
      {
        id: "attempt_question_1",
        position: 0,
        difficulty: "EASY",
        answer: {
          selectedAlternativeId: "alternative_1",
          correctAlternativeId: "alternative_1",
          isCorrect: true,
          answeredAt: new Date("2026-06-09T12:04:00Z"),
        },
        question: {
          id: "question_1",
          descriptionMarkdown: "Enunciado",
          correctAnswerExplanation: "Explicacao",
          subjectField: {
            id: "subject_field_1",
            title: "Calculo",
            colorHex: "#2563EB",
          },
          alternatives: [
            {
              id: "alternative_1",
              contentMarkdown: "A",
              position: 0,
              isCorrect: true,
            },
          ],
        },
      },
    ],
  };
}

describe("simulated-exam.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction();
  });

  it("lists only subject fields that have questions", async () => {
    mocks.prisma.subjectField.findMany.mockResolvedValue([
      { id: "subject_field_1", _count: { questions: 2 } },
    ]);

    await listEligibleSubjectFields();

    expect(mocks.prisma.subjectField.findMany).toHaveBeenCalledWith({
      where: { questions: { some: {} } },
      select: {
        id: true,
        title: true,
        description: true,
        colorHex: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });
  });

  it("creates an attempt with selected filters and positioned questions transactionally", async () => {
    mocks.selectBalancedQuestions.mockResolvedValue([
      {
        questionId: "question_1",
        difficulty: "EASY",
        subjectFieldId: "subject_field_1",
        position: 0,
      },
    ]);
    mocks.prisma.simulationAttempt.create.mockResolvedValue({
      id: "attempt_1",
      totalQuestions: 1,
    });

    const result = await createSimulationAttempt(
      {
        subjectFieldIds: [" subject_field_1 "],
        questionCount: 1,
      },
      "student_1",
    );

    expect(result).toEqual({ id: "attempt_1", totalQuestions: 1 });
    expect(mocks.selectBalancedQuestions).toHaveBeenCalledWith(
      {
        subjectFieldIds: ["subject_field_1"],
        questionCount: 1,
      },
      mocks.prisma,
    );
    expect(mocks.prisma.simulationAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "student_1",
          requestedQuestionCount: 1,
          totalQuestions: 1,
        }),
      }),
    );
  });

  it("returns safe in-progress detail without correct answer fields", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue(inProgressAttempt());

    const detail = await getInProgressSimulationAttemptForStudent(
      "attempt_1",
      "student_1",
    );

    expect(detail.questions[0].selectedAlternativeId).toBeNull();
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("isCorrect");
    expect(serialized).not.toContain("correctAlternativeId");
    expect(serialized).not.toContain("correctAnswerExplanation");
    expect(mocks.prisma.simulationAttempt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "attempt_1",
          studentId: "student_1",
          status: "IN_PROGRESS",
        },
      }),
    );
  });

  it("returns correction fields for completed review detail", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue(completedAttempt());

    const detail = await getCompletedSimulationAttemptForStudent(
      "attempt_1",
      "student_1",
    );

    expect(detail.questions[0]).toMatchObject({
      selectedAlternativeId: "alternative_1",
      correctAlternativeId: "alternative_1",
      isCorrect: true,
    });
  });

  it("rejects attempts that are missing or not owned by the student", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue(null);

    await expect(
      getInProgressSimulationAttemptForStudent("attempt_1", "student_2"),
    ).rejects.toMatchObject({
      code: "SIMULATION_ATTEMPT_NOT_FOUND",
    } satisfies Partial<SimulationDomainError>);
  });

  it("saves draft answers without correction fields and returns safe in-progress detail", async () => {
    const savedAttempt = inProgressAttempt();
    savedAttempt.answeredCount = 2;
    savedAttempt.questions[0].answer = {
      selectedAlternativeId: "alternative_1",
    };

    mocks.prisma.simulationAttempt.findFirst
      .mockResolvedValueOnce({
        id: "attempt_1",
        status: "IN_PROGRESS",
        questions: [
          {
            id: "attempt_question_1",
            difficulty: "HARD",
            answer: null,
            question: {
              alternatives: [{ id: "alternative_1" }],
            },
          },
          {
            id: "attempt_question_2",
            answer: { selectedAlternativeId: "alternative_2" },
            question: {
              alternatives: [{ id: "alternative_2" }],
            },
          },
        ],
      })
      .mockResolvedValueOnce(savedAttempt);
    mocks.prisma.simulationAnswer.upsert.mockResolvedValue({});
    mocks.prisma.simulationAttempt.update.mockResolvedValue({});

    const detail = await saveSimulationAttemptAnswers(
      "attempt_1",
      {
        answers: [
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "alternative_1",
          },
        ],
      },
      "student_1",
    );

    expect(mocks.prisma.simulationAnswer.upsert).toHaveBeenCalledWith({
      where: { attemptQuestionId: "attempt_question_1" },
      create: {
        attemptQuestionId: "attempt_question_1",
        selectedAlternativeId: "alternative_1",
        correctAlternativeId: null,
        isCorrect: null,
      },
      update: {
        selectedAlternativeId: "alternative_1",
        correctAlternativeId: null,
        isCorrect: null,
        answeredAt: expect.any(Date),
      },
    });
    expect(mocks.prisma.simulationAttempt.update).toHaveBeenCalledWith({
      where: { id: "attempt_1" },
      data: { answeredCount: 2 },
    });
    expect(detail.answeredCount).toBe(2);
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("isCorrect");
    expect(serialized).not.toContain("correctAlternativeId");
    expect(serialized).not.toContain("correctAnswerExplanation");
  });

  it("rejects draft saves for attempts that are missing or not owned by the student", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue(null);

    await expect(
      saveSimulationAttemptAnswers(
        "attempt_1",
        {
          answers: [
            {
              attemptQuestionId: "attempt_question_1",
              selectedAlternativeId: "alternative_1",
            },
          ],
        },
        "student_2",
      ),
    ).rejects.toMatchObject({
      code: "SIMULATION_ATTEMPT_NOT_FOUND",
    } satisfies Partial<SimulationDomainError>);
  });

  it("rejects draft saves for completed attempts", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue({
      id: "attempt_1",
      status: "COMPLETED",
      questions: [],
    });

    await expect(
      saveSimulationAttemptAnswers("attempt_1", { answers: [] }, "student_1"),
    ).rejects.toMatchObject({
      code: "SIMULATION_ATTEMPT_ALREADY_COMPLETED",
    } satisfies Partial<SimulationDomainError>);
  });

  it("rejects draft saves with invalid attempt questions or alternatives", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue({
      id: "attempt_1",
      status: "IN_PROGRESS",
      questions: [
        {
          id: "attempt_question_1",
          answer: null,
          question: {
            alternatives: [{ id: "alternative_1" }],
          },
        },
      ],
    });

    await expect(
      saveSimulationAttemptAnswers(
        "attempt_1",
        {
          answers: [
            {
              attemptQuestionId: "attempt_question_1",
              selectedAlternativeId: "alternative_outside",
            },
          ],
        },
        "student_1",
      ),
    ).rejects.toMatchObject({
      code: "SIMULATION_INVALID_ANSWER",
    } satisfies Partial<SimulationDomainError>);

    await expect(
      saveSimulationAttemptAnswers(
        "attempt_1",
        {
          answers: [
            {
              attemptQuestionId: "attempt_question_outside",
              selectedAlternativeId: "alternative_1",
            },
          ],
        },
        "student_1",
      ),
    ).rejects.toMatchObject({
      code: "SIMULATION_INVALID_ANSWER",
    } satisfies Partial<SimulationDomainError>);
  });

  it("submits answers, finalizes aggregates, and returns completed review", async () => {
    mocks.prisma.simulationAttempt.findFirst
      .mockResolvedValueOnce({
        id: "attempt_1",
        status: "IN_PROGRESS",
        totalQuestions: 2,
        questions: [
          {
            id: "attempt_question_1",
            difficulty: "HARD",
            answer: null,
            question: {
              alternatives: [
                { id: "alternative_1", isCorrect: true },
                { id: "alternative_2", isCorrect: false },
              ],
            },
          },
          {
            id: "attempt_question_2",
            difficulty: "EASY",
            answer: null,
            question: {
              alternatives: [
                { id: "alternative_3", isCorrect: true },
                { id: "alternative_4", isCorrect: false },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce(completedAttempt());
    mocks.prisma.simulationAnswer.upsert.mockResolvedValue({});
    mocks.prisma.simulationAttempt.update.mockResolvedValue({});

    await submitSimulationAttempt(
      "attempt_1",
      {
        answers: [
          {
            attemptQuestionId: "attempt_question_2",
            selectedAlternativeId: "alternative_4",
          },
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "alternative_1",
          },
        ],
      },
      "student_1",
    );

    expect(mocks.prisma.simulationAnswer.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.prisma.simulationAttempt.update).toHaveBeenCalledWith({
      where: { id: "attempt_1" },
      data: expect.objectContaining({
        status: "COMPLETED",
        answeredCount: 2,
        correctCount: 1,
        wrongCount: 1,
        scorePercent: 50,
        weightedScore: 3,
        completedAt: expect.any(Date),
      }),
    });
  });

  it("submits saved draft answers merged with payload answers taking precedence", async () => {
    mocks.prisma.simulationAttempt.findFirst
      .mockResolvedValueOnce({
        id: "attempt_1",
        status: "IN_PROGRESS",
        totalQuestions: 2,
        questions: [
          {
            id: "attempt_question_1",
            difficulty: "EASY",
            answer: { selectedAlternativeId: "alternative_2" },
            question: {
              alternatives: [
                { id: "alternative_1", isCorrect: true },
                { id: "alternative_2", isCorrect: false },
              ],
            },
          },
          {
            id: "attempt_question_2",
            difficulty: "HARD",
            answer: { selectedAlternativeId: "alternative_4" },
            question: {
              alternatives: [
                { id: "alternative_3", isCorrect: true },
                { id: "alternative_4", isCorrect: false },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce(completedAttempt());
    mocks.prisma.simulationAnswer.upsert.mockResolvedValue({});
    mocks.prisma.simulationAttempt.update.mockResolvedValue({});

    await submitSimulationAttempt(
      "attempt_1",
      {
        answers: [
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "alternative_1",
          },
        ],
      },
      "student_1",
    );

    expect(mocks.prisma.simulationAnswer.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.prisma.simulationAnswer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { attemptQuestionId: "attempt_question_1" },
        create: expect.objectContaining({
          selectedAlternativeId: "alternative_1",
          isCorrect: true,
        }),
      }),
    );
    expect(mocks.prisma.simulationAnswer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { attemptQuestionId: "attempt_question_2" },
        create: expect.objectContaining({
          selectedAlternativeId: "alternative_4",
          isCorrect: false,
        }),
      }),
    );
    expect(mocks.prisma.simulationAttempt.update).toHaveBeenCalledWith({
      where: { id: "attempt_1" },
      data: expect.objectContaining({
        answeredCount: 2,
        correctCount: 1,
        wrongCount: 1,
        scorePercent: 50,
        weightedScore: 1,
      }),
    });
  });

  it("rejects submissions for already completed attempts", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue({
      id: "attempt_1",
      status: "COMPLETED",
      totalQuestions: 1,
      questions: [],
    });

    await expect(
      submitSimulationAttempt("attempt_1", { answers: [] }, "student_1"),
    ).rejects.toMatchObject({
      code: "SIMULATION_ATTEMPT_ALREADY_COMPLETED",
    } satisfies Partial<SimulationDomainError>);
  });

  it("rejects alternatives that do not belong to the attempt question", async () => {
    mocks.prisma.simulationAttempt.findFirst.mockResolvedValue({
      id: "attempt_1",
      status: "IN_PROGRESS",
      totalQuestions: 1,
      questions: [
        {
          id: "attempt_question_1",
          question: {
            alternatives: [{ id: "alternative_1", isCorrect: true }],
          },
        },
      ],
    });

    await expect(
      submitSimulationAttempt(
        "attempt_1",
        {
          answers: [
            {
              attemptQuestionId: "attempt_question_1",
              selectedAlternativeId: "alternative_outside",
            },
          ],
        },
        "student_1",
      ),
    ).rejects.toMatchObject({
      code: "SIMULATION_INVALID_ANSWER",
    } satisfies Partial<SimulationDomainError>);
  });

  it("lists only the student's attempts newest first", async () => {
    mocks.prisma.simulationAttempt.findMany.mockResolvedValue([
      { id: "attempt_1" },
    ]);

    await listSimulationAttemptsForStudent("student_1");

    expect(mocks.prisma.simulationAttempt.findMany).toHaveBeenCalledWith({
      where: { studentId: "student_1" },
      select: expect.any(Object),
      orderBy: { createdAt: "desc" },
    });
  });

  it("lists a paginated page of student attempt summaries", async () => {
    const createdAt = new Date("2026-06-09T12:00:00Z");
    const completedAt = new Date("2026-06-09T12:30:00Z");

    mocks.prisma.simulationAttempt.count.mockResolvedValue(21);
    mocks.prisma.simulationAttempt.findMany.mockResolvedValue([
      {
        id: "attempt_1",
        status: "COMPLETED",
        totalQuestions: 10,
        answeredCount: 10,
        correctCount: 7,
        wrongCount: 3,
        scorePercent: 70,
        completedAt,
        createdAt,
        subjectFields: [
          {
            subjectField: {
              id: "subject_field_1",
              title: "Calculo",
              colorHex: "#2563EB",
            },
          },
        ],
      },
    ]);

    const result = await listSimulationAttemptsPageForStudent("student_1", {
      page: 2,
      pageSize: 10,
    });

    expect(mocks.prisma.simulationAttempt.count).toHaveBeenCalledWith({
      where: { studentId: "student_1" },
    });
    expect(mocks.prisma.simulationAttempt.findMany).toHaveBeenCalledWith({
      where: { studentId: "student_1" },
      select: expect.any(Object),
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      rows: [
        {
          id: "attempt_1",
          status: "COMPLETED",
          totalQuestions: 10,
          answeredCount: 10,
          correctCount: 7,
          wrongCount: 3,
          scorePercent: 70,
          completedAt,
          startedAt: createdAt,
          subjectFields: [
            {
              id: "subject_field_1",
              title: "Calculo",
              colorHex: "#2563EB",
            },
          ],
        },
      ],
      rowCount: 21,
      page: 2,
      pageSize: 10,
      pageCount: 3,
    });
  });

  it("uses default pagination values for student attempt summaries", async () => {
    mocks.prisma.simulationAttempt.count.mockResolvedValue(0);
    mocks.prisma.simulationAttempt.findMany.mockResolvedValue([]);

    const result = await listSimulationAttemptsPageForStudent("student_1", {});

    expect(mocks.prisma.simulationAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student_1" },
        skip: 0,
        take: 20,
      }),
    );
    expect(result).toMatchObject({
      rows: [],
      rowCount: 0,
      page: 1,
      pageSize: 20,
      pageCount: 0,
    });
  });
});
