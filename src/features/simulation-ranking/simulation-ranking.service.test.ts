import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import { listTeacherSimulationRanking } from "./simulation-ranking.service";

function sqlText(value: unknown) {
  const sql = value as { sql?: string; text?: string; strings?: string[] };

  return sql.sql ?? sql.text ?? sql.strings?.join("") ?? String(value);
}

function sqlValues(value: unknown) {
  return (value as { values?: unknown[] }).values ?? [];
}

describe("simulation-ranking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna metadados de paginacao e rank global", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          studentId: "student_2",
          studentName: "Aluno Dois",
          studentEmail: "student2@enade.local",
          weightedScore: 6n,
          completedForms: 2n,
          correctAnswers: 3n,
          wrongAnswers: 1n,
          totalQuestions: 4n,
          accuracyPercent: { toString: () => "75.00" },
        },
      ])
      .mockResolvedValueOnce([{ rowCount: 21n }]);

    const result = await listTeacherSimulationRanking({
      page: 2,
      pageSize: 20,
    });

    expect(result).toEqual({
      rows: [
        {
          rank: 21,
          studentId: "student_2",
          studentName: "Aluno Dois",
          studentEmail: "student2@enade.local",
          weightedScore: 6,
          completedForms: 2,
          correctAnswers: 3,
          wrongAnswers: 1,
          totalQuestions: 4,
          accuracyPercent: 75,
        },
      ],
      rowCount: 21,
      page: 2,
      pageSize: 20,
      pageCount: 2,
    });
  });

  it("monta consulta usando score materializado e desempates estaveis", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({});

    const queryText = sqlText(mocks.prisma.$queryRaw.mock.calls[0][0]);

    expect(queryText).toContain("attempt.status = 'COMPLETED'");
    expect(queryText).toContain('SUM(attempt."weightedScore")');
    expect(queryText).not.toContain('"SimulationAnswer"');
    expect(queryText).not.toContain('"SimulationAttemptQuestion"');
    expect(queryText).toContain('"weightedScore" DESC');
    expect(queryText).toContain('"accuracyPercent" DESC');
    expect(queryText).toContain('"completedForms" DESC');
    expect(queryText).toContain('"studentName" ASC');
    expect(queryText).toContain('"studentEmail" ASC');
  });

  it("usa total de questoes como denominador do percentual global", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({});

    const queryText = sqlText(mocks.prisma.$queryRaw.mock.calls[0][0]);

    expect(queryText).toContain('SUM(attempt."correctCount")');
    expect(queryText).toContain('attempt_totals."totalQuestions"');
  });

  it("aplica intervalo fechado de conclusao na agregacao e na contagem", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });

    for (const query of mocks.prisma.$queryRaw.mock.calls.map(
      ([query]) => query,
    )) {
      expect(sqlText(query)).toContain('attempt."completedAt" >=');
      expect(sqlText(query)).toContain('attempt."completedAt" <');
      expect(sqlText(query)).toContain("INTERVAL '1 day'");
      expect(sqlValues(query)).toEqual(
        expect.arrayContaining(["2026-06-01", "2026-06-30"]),
      );
    }
  });

  it("aplica somente o limite inicial quando o intervalo esta aberto no fim", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({ startDate: "2026-06-01" });

    for (const query of mocks.prisma.$queryRaw.mock.calls.map(
      ([query]) => query,
    )) {
      expect(sqlText(query)).toContain('attempt."completedAt" >=');
      expect(sqlText(query)).not.toContain('attempt."completedAt" <');
      expect(sqlValues(query)).toContain("2026-06-01");
    }
  });

  it("aplica somente o limite final exclusivo do dia seguinte quando o intervalo esta aberto no inicio", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({ endDate: "2026-06-30" });

    for (const query of mocks.prisma.$queryRaw.mock.calls.map(
      ([query]) => query,
    )) {
      expect(sqlText(query)).not.toContain('attempt."completedAt" >=');
      expect(sqlText(query)).toContain('attempt."completedAt" <');
      expect(sqlText(query)).toContain("INTERVAL '1 day'");
      expect(sqlValues(query)).toContain("2026-06-30");
    }
  });

  it("nao inclui filtro de conclusao quando as datas estao ausentes", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({});

    for (const query of mocks.prisma.$queryRaw.mock.calls.map(
      ([query]) => query,
    )) {
      expect(sqlText(query)).not.toContain('attempt."completedAt"');
      expect(sqlValues(query)).not.toContain(expect.any(String));
    }
  });

  it("rejeita parametros invalidos antes da consulta", async () => {
    await expect(
      listTeacherSimulationRanking({ page: 0 }),
    ).rejects.toThrowError();

    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
