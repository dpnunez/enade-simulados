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

  it("normaliza datas vazias como ausencia de filtro", () => {
    expect(
      simulationRankingQuerySchema.parse({ startDate: "", endDate: "" }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      sort: "weightedScore",
      direction: "desc",
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("aceita limite inicial aberto", () => {
    expect(
      simulationRankingQuerySchema.parse({ startDate: "2026-08-01" }),
    ).toMatchObject({ startDate: "2026-08-01" });
  });

  it("aceita limite final aberto", () => {
    expect(
      simulationRankingQuerySchema.parse({ endDate: "2026-08-31" }),
    ).toMatchObject({ endDate: "2026-08-31" });
  });

  it("aceita intervalo de datas fechado", () => {
    expect(
      simulationRankingQuerySchema.parse({
        startDate: "2026-08-01",
        endDate: "2026-08-31",
      }),
    ).toMatchObject({ startDate: "2026-08-01", endDate: "2026-08-31" });
  });

  it("rejeita formato de data invalido", () => {
    expect(() =>
      simulationRankingQuerySchema.parse({ startDate: "01/08/2026" }),
    ).toThrow(z.ZodError);
  });

  it("rejeita intervalo de datas invertido", () => {
    expect(() =>
      simulationRankingQuerySchema.parse({
        startDate: "2026-08-31",
        endDate: "2026-08-01",
      }),
    ).toThrow(z.ZodError);
  });
});
