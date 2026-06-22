import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  simulationAttemptIdSchema,
  simulationAttemptsListQuerySchema,
  simulationGenerationInputSchema,
  simulationSaveAnswersInputSchema,
  simulationSubmitInputSchema,
} from "./simulated-exam.schema";

describe("simulated-exam.schema", () => {
  it("accepts valid generation input and normalizes ids", () => {
    const parsed = simulationGenerationInputSchema.parse({
      subjectFieldIds: [" sf_1 ", "", "sf_2", "sf_1"],
      questionCount: "12",
    });

    expect(parsed).toEqual({
      subjectFieldIds: ["sf_1", "sf_2"],
      questionCount: 12,
    });
  });

  it("rejects missing subject fields", () => {
    expect(() =>
      simulationGenerationInputSchema.parse({
        subjectFieldIds: [" ", ""],
        questionCount: 10,
      }),
    ).toThrow(z.ZodError);
  });

  it("deduplicates repeated subject fields", () => {
    const parsed = simulationGenerationInputSchema.parse({
      subjectFieldIds: ["sf_1", "sf_1", " sf_1 "],
      questionCount: 3,
    });

    expect(parsed.subjectFieldIds).toEqual(["sf_1"]);
  });

  it("rejects invalid question count", () => {
    expect(() =>
      simulationGenerationInputSchema.parse({
        subjectFieldIds: ["sf_1"],
        questionCount: 0,
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      simulationGenerationInputSchema.parse({
        subjectFieldIds: ["sf_1"],
        questionCount: 101,
      }),
    ).toThrow(z.ZodError);
  });

  it("accepts valid submit input and trims ids", () => {
    const parsed = simulationSubmitInputSchema.parse({
      answers: [
        {
          attemptQuestionId: " attempt_question_1 ",
          selectedAlternativeId: " alternative_1 ",
        },
      ],
    });

    expect(parsed).toEqual({
      answers: [
        {
          attemptQuestionId: "attempt_question_1",
          selectedAlternativeId: "alternative_1",
        },
      ],
    });
  });

  it("accepts valid draft save input and trims ids", () => {
    const parsed = simulationSaveAnswersInputSchema.parse({
      answers: [
        {
          attemptQuestionId: " attempt_question_1 ",
          selectedAlternativeId: " alternative_1 ",
        },
      ],
    });

    expect(parsed).toEqual({
      answers: [
        {
          attemptQuestionId: "attempt_question_1",
          selectedAlternativeId: "alternative_1",
        },
      ],
    });
  });

  it("rejects malformed ids", () => {
    expect(() => simulationAttemptIdSchema.parse(" ")).toThrow(z.ZodError);

    expect(() =>
      simulationSubmitInputSchema.parse({
        answers: [
          {
            attemptQuestionId: "",
            selectedAlternativeId: "alternative_1",
          },
        ],
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      simulationSaveAnswersInputSchema.parse({
        answers: [
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "",
          },
        ],
      }),
    ).toThrow(z.ZodError);
  });

  it("accepts empty answers", () => {
    const parsed = simulationSubmitInputSchema.parse({ answers: [] });

    expect(parsed).toEqual({ answers: [] });

    expect(simulationSaveAnswersInputSchema.parse({ answers: [] })).toEqual({
      answers: [],
    });
  });

  it("rejects duplicate answers for the same attempt question", () => {
    expect(() =>
      simulationSubmitInputSchema.parse({
        answers: [
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "alternative_1",
          },
          {
            attemptQuestionId: " attempt_question_1 ",
            selectedAlternativeId: "alternative_2",
          },
        ],
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      simulationSaveAnswersInputSchema.parse({
        answers: [
          {
            attemptQuestionId: "attempt_question_1",
            selectedAlternativeId: "alternative_1",
          },
          {
            attemptQuestionId: " attempt_question_1 ",
            selectedAlternativeId: "alternative_2",
          },
        ],
      }),
    ).toThrow(z.ZodError);
  });

  it("keeps submit schema using the shared answer payload shape", () => {
    const input = {
      answers: [
        {
          attemptQuestionId: " attempt_question_1 ",
          selectedAlternativeId: " alternative_1 ",
        },
      ],
    };

    expect(simulationSubmitInputSchema.parse(input)).toEqual(
      simulationSaveAnswersInputSchema.parse(input),
    );
  });

  it("normalizes list pagination query defaults and numeric strings", () => {
    expect(simulationAttemptsListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });

    expect(
      simulationAttemptsListQuerySchema.parse({ page: "2", pageSize: "10" }),
    ).toEqual({
      page: 2,
      pageSize: 10,
    });
  });

  it("rejects invalid list pagination query", () => {
    expect(() =>
      simulationAttemptsListQuerySchema.parse({ page: "0", pageSize: "20" }),
    ).toThrow(z.ZodError);

    expect(() =>
      simulationAttemptsListQuerySchema.parse({ page: "1", pageSize: "101" }),
    ).toThrow(z.ZodError);
  });
});
