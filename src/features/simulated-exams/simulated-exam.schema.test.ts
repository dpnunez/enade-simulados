import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  simulationAttemptIdSchema,
  simulationGenerationInputSchema,
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
  });

  it("accepts empty answers", () => {
    const parsed = simulationSubmitInputSchema.parse({ answers: [] });

    expect(parsed).toEqual({ answers: [] });
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
  });
});
