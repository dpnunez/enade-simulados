import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@infra/db/prisma", () => ({ prisma: mocks.prisma }));

import {
  calculateQuestionWeight,
  listTeacherSimulationRanking,
} from "./simulation-ranking.service";

function sqlText(value: unknown) {
  const sql = value as { sql?: string; text?: string; strings?: string[] };

  return sql.sql ?? sql.text ?? sql.strings?.join("") ?? String(value);
}

describe("simulation-ranking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula pesos por dificuldade com medio como fallback", () => {
    expect(calculateQuestionWeight("EASY")).toBe(1);
    expect(calculateQuestionWeight("MEDIUM")).toBe(2);
    expect(calculateQuestionWeight("HARD")).toBe(3);
    expect(calculateQuestionWeight(null)).toBe(2);
    expect(calculateQuestionWeight(undefined)).toBe(2);
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

  it("monta consulta com tentativas finalizadas, pesos e desempates estaveis", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rowCount: 0n }]);

    await listTeacherSimulationRanking({});

    const queryText = sqlText(mocks.prisma.$queryRaw.mock.calls[0][0]);

    expect(queryText).toContain("attempt.status = 'COMPLETED'");
    expect(queryText).toContain("answer.\"isCorrect\" = true");
    expect(queryText).toContain("attempt_question.difficulty = 'EASY' THEN 1");
    expect(queryText).toContain("attempt_question.difficulty = 'HARD' THEN 3");
    expect(queryText).toContain("ELSE 0");
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

  it("rejeita parametros invalidos antes da consulta", async () => {
    await expect(
      listTeacherSimulationRanking({ page: 0 }),
    ).rejects.toThrowError();

    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
