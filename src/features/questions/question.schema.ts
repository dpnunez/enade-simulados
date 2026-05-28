import { z } from "zod";

const markdownMaxLength = 10_000;
const explanationMaxLength = 5_000;
const alternativeMaxLength = 5_000;
const minQuestionYear = 1998;
const maxQuestionYear = 2100;

const questionDifficulties = ["EASY", "MEDIUM", "HARD"] as const;
const questionSources = ["ENADE", "MANUAL", "ADAPTED", "OTHER"] as const;

function normalizeMarkdown(value: string) {
  return value.trim();
}

function emptyToNull(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

const requiredMarkdownSchema = z
  .string()
  .transform(normalizeMarkdown)
  .pipe(
    z
      .string()
      .min(1, "Informe um texto.")
      .max(markdownMaxLength, "Informe um texto com no maximo 10000 caracteres."),
  );

const optionalExplanationSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .transform(normalizeMarkdown)
    .pipe(
      z
        .string()
        .max(
          explanationMaxLength,
          "Informe uma explicacao com no maximo 5000 caracteres.",
        ),
    )
    .nullable(),
);

const optionalSourceSchema = z.preprocess(
  emptyToNull,
  z.enum(questionSources).nullable(),
);

const optionalYearSchema = z.preprocess(
  emptyToNull,
  z.coerce
    .number()
    .int("Informe um ano inteiro.")
    .min(minQuestionYear, "Informe um ano valido.")
    .max(maxQuestionYear, "Informe um ano valido.")
    .nullable(),
);

export const questionIdSchema = z.string().trim().min(1, "Questao invalida.");

export const questionAlternativeInputSchema = z.object({
  contentMarkdown: z
    .string()
    .transform(normalizeMarkdown)
    .pipe(
      z
        .string()
        .min(1, "Informe o texto da alternativa.")
        .max(
          alternativeMaxLength,
          "Informe uma alternativa com no maximo 5000 caracteres.",
        ),
    ),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z
  .object({
    descriptionMarkdown: requiredMarkdownSchema,
    difficulty: z.enum(questionDifficulties),
    source: optionalSourceSchema,
    year: optionalYearSchema,
    subjectFieldId: z.string().trim().min(1, "Selecione uma grande area."),
    correctAnswerExplanation: optionalExplanationSchema,
    alternatives: z
      .array(questionAlternativeInputSchema)
      .min(2, "Informe pelo menos 2 alternativas.")
      .max(8, "Informe no maximo 8 alternativas."),
  })
  .superRefine((input, context) => {
    const correctCount = input.alternatives.filter(
      (alternative) => alternative.isCorrect,
    ).length;

    if (correctCount !== 1) {
      context.addIssue({
        code: "custom",
        path: ["alternatives"],
        message: "Marque exatamente uma alternativa correta.",
      });
    }
  });

export type QuestionInput = z.input<typeof questionInputSchema>;
export type ParsedQuestionInput = z.output<typeof questionInputSchema>;
