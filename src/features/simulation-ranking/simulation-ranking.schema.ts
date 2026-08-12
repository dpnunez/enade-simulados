import { z } from "zod";

export const simulationRankingSortFields = [
  "weightedScore",
  "accuracyPercent",
  "completedForms",
  "studentName",
] as const;

export const simulationRankingDirections = ["asc", "desc"] as const;

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalIsoDateSchema = z.preprocess(
  emptyToUndefined,
  z.iso.date().optional(),
);

function validateDateRange(
  input: { startDate?: string; endDate?: string },
  context: z.RefinementCtx,
) {
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "A data final deve ser igual ou posterior a data inicial.",
    });
  }
}

export const simulationRankingDateFilterSchema = z
  .object({
    startDate: optionalIsoDateSchema,
    endDate: optionalIsoDateSchema,
  })
  .superRefine(validateDateRange);

export const simulationRankingQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int("Informe uma pagina inteira.")
      .min(1, "Informe uma pagina maior que zero.")
      .default(1),
    pageSize: z.coerce
      .number()
      .int("Informe um tamanho de pagina inteiro.")
      .min(10, "Informe pelo menos 10 linhas por pagina.")
      .max(100, "Informe no maximo 100 linhas por pagina.")
      .default(20),
    sort: z.enum(simulationRankingSortFields).default("weightedScore"),
    direction: z.enum(simulationRankingDirections).default("desc"),
    ...simulationRankingDateFilterSchema.shape,
  })
  .superRefine(validateDateRange);

export type SimulationRankingQuery = z.input<
  typeof simulationRankingQuerySchema
>;
export type ParsedSimulationRankingQuery = z.output<
  typeof simulationRankingQuerySchema
>;
export type SimulationRankingSortField =
  (typeof simulationRankingSortFields)[number];
export type SimulationRankingDirection =
  (typeof simulationRankingDirections)[number];
