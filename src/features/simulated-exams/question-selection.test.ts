import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const prisma = {
    question: {
      findMany: vi.fn(),
    },
  };

  return { prisma };
});

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import {
  QuestionSelectionError,
  calculateDifficultyQuotas,
  selectBalancedQuestions,
} from "./question-selection";

function question(
  id: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  subjectFieldId = "subject_field_1",
) {
  return { id, difficulty, subjectFieldId };
}

describe("question-selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("distributes quotas evenly across difficulties", () => {
    expect(
      calculateDifficultyQuotas(
        {
          EASY: 10,
          MEDIUM: 10,
          HARD: 10,
        },
        6,
      ),
    ).toEqual({
      EASY: 2,
      MEDIUM: 2,
      HARD: 2,
    });
  });

  it("distributes remainder from the first difficulties", () => {
    expect(
      calculateDifficultyQuotas(
        {
          EASY: 10,
          MEDIUM: 10,
          HARD: 10,
        },
        5,
      ),
    ).toEqual({
      EASY: 2,
      MEDIUM: 2,
      HARD: 1,
    });
  });

  it("redistributes shortages to available difficulties", () => {
    expect(
      calculateDifficultyQuotas(
        {
          EASY: 1,
          MEDIUM: 10,
          HARD: 10,
        },
        6,
      ),
    ).toEqual({
      EASY: 1,
      MEDIUM: 3,
      HARD: 2,
    });
  });

  it("rejects insufficient total availability", () => {
    expect(() =>
      calculateDifficultyQuotas(
        {
          EASY: 1,
          MEDIUM: 1,
          HARD: 0,
        },
        3,
      ),
    ).toThrow(QuestionSelectionError);
  });

  it("filters by subject fields and returns exactly the requested unique questions", async () => {
    mocks.prisma.question.findMany.mockResolvedValue([
      question("easy_1", "EASY", "subject_field_1"),
      question("easy_2", "EASY", "subject_field_2"),
      question("medium_1", "MEDIUM", "subject_field_1"),
      question("medium_2", "MEDIUM", "subject_field_2"),
      question("hard_1", "HARD", "subject_field_1"),
      question("hard_2", "HARD", "subject_field_2"),
    ]);

    const selected = await selectBalancedQuestions({
      subjectFieldIds: ["subject_field_1", "subject_field_2"],
      questionCount: 4,
    });

    expect(mocks.prisma.question.findMany).toHaveBeenCalledWith({
      where: {
        subjectFieldId: { in: ["subject_field_1", "subject_field_2"] },
      },
      select: {
        id: true,
        difficulty: true,
        subjectFieldId: true,
      },
    });
    expect(selected).toHaveLength(4);
    expect(
      new Set(selected.map((selectedQuestion) => selectedQuestion.questionId)).size,
    ).toBe(4);
    expect(selected.map((selectedQuestion) => selectedQuestion.position).sort()).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("rejects selection when eligible questions are below requested count", async () => {
    mocks.prisma.question.findMany.mockResolvedValue([
      question("easy_1", "EASY"),
      question("medium_1", "MEDIUM"),
    ]);

    await expect(
      selectBalancedQuestions({
        subjectFieldIds: ["subject_field_1"],
        questionCount: 3,
      }),
    ).rejects.toMatchObject({
      code: "NOT_ENOUGH_QUESTIONS",
      availableQuestionCount: 2,
    } satisfies Partial<QuestionSelectionError>);
  });
});
