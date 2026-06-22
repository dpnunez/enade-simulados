import { describe, expect, it } from "vitest";
import { z } from "zod";

import { questionInputSchema, questionListQuerySchema } from "./question.schema";

const validQuestionInput = {
  descriptionMarkdown: "  Qual e o resultado de **2 + 2**?  ",
  difficulty: "EASY",
  source: "ENADE",
  year: "2023",
  subjectFieldId: " subject_field_1 ",
  correctAnswerExplanation: "  Porque 2 + 2 = 4.  ",
  alternatives: [
    { contentMarkdown: "  3  ", isCorrect: false },
    { contentMarkdown: "  4  ", isCorrect: true },
  ],
};

describe("question.schema", () => {
  it("accepts valid input and normalizes markdown fields", () => {
    const parsed = questionInputSchema.parse(validQuestionInput);

    expect(parsed).toEqual({
      descriptionMarkdown: "Qual e o resultado de **2 + 2**?",
      difficulty: "EASY",
      source: "ENADE",
      year: 2023,
      subjectFieldId: "subject_field_1",
      correctAnswerExplanation: "Porque 2 + 2 = 4.",
      alternatives: [
        { contentMarkdown: "3", isCorrect: false },
        { contentMarkdown: "4", isCorrect: true },
      ],
    });
  });

  it("rejects empty description", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        descriptionMarkdown: "   ",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects invalid difficulty", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        difficulty: "VERY_HARD",
      }),
    ).toThrow(z.ZodError);
  });

  it("normalizes omitted source and year to null", () => {
    const parsed = questionInputSchema.parse({
      ...validQuestionInput,
      source: "",
      year: "",
      correctAnswerExplanation: "",
    });

    expect(parsed.source).toBeNull();
    expect(parsed.year).toBeNull();
    expect(parsed.correctAnswerExplanation).toBeNull();
  });

  it("rejects invalid source", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        source: "BOOK",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects invalid year", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        year: "1899",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects missing subject field id", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        subjectFieldId: " ",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects too few alternatives", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        alternatives: [{ contentMarkdown: "4", isCorrect: true }],
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects empty alternative content", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        alternatives: [
          { contentMarkdown: " ", isCorrect: false },
          { contentMarkdown: "4", isCorrect: true },
        ],
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects zero correct alternatives", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        alternatives: [
          { contentMarkdown: "3", isCorrect: false },
          { contentMarkdown: "4", isCorrect: false },
        ],
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects two correct alternatives", () => {
    expect(() =>
      questionInputSchema.parse({
        ...validQuestionInput,
        alternatives: [
          { contentMarkdown: "3", isCorrect: true },
          { contentMarkdown: "4", isCorrect: true },
        ],
      }),
    ).toThrow(z.ZodError);
  });
});

describe("questionListQuerySchema", () => {
  it("uses defaults when params are omitted", () => {
    expect(questionListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 10,
      sort: "updatedAt",
      direction: "desc",
    });
  });

  it("coerces pagination and accepts supported sorting", () => {
    expect(
      questionListQuerySchema.parse({
        page: "3",
        pageSize: "25",
        sort: "subjectField",
        direction: "asc",
      }),
    ).toEqual({
      page: 3,
      pageSize: 25,
      sort: "subjectField",
      direction: "asc",
    });
  });

  it("normalizes invalid params to safe defaults", () => {
    expect(
      questionListQuerySchema.parse({
        page: "0",
        pageSize: "500",
        sort: "descriptionMarkdown",
        direction: "sideways",
      }),
    ).toEqual({
      page: 1,
      pageSize: 10,
      sort: "updatedAt",
      direction: "desc",
    });
  });
});
