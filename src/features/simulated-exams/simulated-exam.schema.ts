import { z } from "zod";

const maxSubjectFieldsPerSimulation = 20;
const maxQuestionsPerSimulation = 100;

function normalizeId(value: string) {
  return value.trim();
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

const idSchema = z.string().transform(normalizeId).pipe(z.string().min(1));

export const simulationAttemptIdSchema = idSchema;

export const simulationGenerationInputSchema = z.object({
  subjectFieldIds: z
    .array(z.string().transform(normalizeId))
    .transform((ids) => uniqueIds(ids.filter(Boolean)))
    .pipe(
      z
        .array(z.string().min(1, "Grande area invalida."))
        .min(1, "Selecione pelo menos uma grande area.")
        .max(
          maxSubjectFieldsPerSimulation,
          "Selecione no maximo 20 grandes areas.",
        ),
    ),
  questionCount: z.coerce
    .number()
    .int("Informe uma quantidade inteira.")
    .min(1, "Informe pelo menos 1 questao.")
    .max(maxQuestionsPerSimulation, "Informe no maximo 100 questoes."),
});

const simulationAnswerInputSchema = z.object({
  attemptQuestionId: idSchema,
  selectedAlternativeId: idSchema,
});

export const simulationSubmitInputSchema = z
  .object({
    answers: z.array(simulationAnswerInputSchema).max(maxQuestionsPerSimulation),
  })
  .superRefine((input, context) => {
    const attemptQuestionIds = new Set<string>();

    input.answers.forEach((answer, index) => {
      if (attemptQuestionIds.has(answer.attemptQuestionId)) {
        context.addIssue({
          code: "custom",
          path: ["answers", index, "attemptQuestionId"],
          message: "Informe apenas uma resposta por questao.",
        });
        return;
      }

      attemptQuestionIds.add(answer.attemptQuestionId);
    });
  });

export type SimulationGenerationInput = z.input<
  typeof simulationGenerationInputSchema
>;
export type ParsedSimulationGenerationInput = z.output<
  typeof simulationGenerationInputSchema
>;
export type SimulationSubmitInput = z.input<typeof simulationSubmitInputSchema>;
export type ParsedSimulationSubmitInput = z.output<
  typeof simulationSubmitInputSchema
>;
