import { z } from "zod";

export const simulationRankingSortFields = [
  "weightedScore",
  "accuracyPercent",
  "completedForms",
  "studentName",
] as const;

export const simulationRankingDirections = ["asc", "desc"] as const;

export const simulationRankingQuerySchema = z.object({
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
});

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
