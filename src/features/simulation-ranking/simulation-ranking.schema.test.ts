import { describe, expect, it } from "vitest";
import { z } from "zod";

import { simulationRankingQuerySchema } from "./simulation-ranking.schema";

describe("simulation-ranking.schema", () => {
  it("aplica defaults para paginacao e ordenacao", () => {
    expect(simulationRankingQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: "weightedScore",
      direction: "desc",
    });
  });

  it("coage parametros validos de query string", () => {
    expect(
      simulationRankingQuerySchema.parse({
        page: "2",
        pageSize: "50",
        sort: "accuracyPercent",
        direction: "asc",
      }),
    ).toEqual({
      page: 2,
      pageSize: 50,
      sort: "accuracyPercent",
      direction: "asc",
    });
  });

  it("rejeita pagina invalida", () => {
    expect(() => simulationRankingQuerySchema.parse({ page: "0" })).toThrow(
      z.ZodError,
    );
  });

  it("rejeita pageSize fora do limite operacional", () => {
    expect(() =>
      simulationRankingQuerySchema.parse({ pageSize: "101" }),
    ).toThrow(z.ZodError);
  });

  it("restringe campos de ordenacao permitidos", () => {
    expect(() =>
      simulationRankingQuerySchema.parse({ sort: "studentEmail" }),
    ).toThrow(z.ZodError);
  });

  it("restringe direcao de ordenacao", () => {
    expect(() =>
      simulationRankingQuerySchema.parse({ direction: "sideways" }),
    ).toThrow(z.ZodError);
  });
});
