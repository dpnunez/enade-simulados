import { Prisma } from "@prisma-generated-client";

import { prisma } from "@infra/db/prisma";

import {
  simulationRankingQuerySchema,
  type ParsedSimulationRankingQuery,
  type SimulationRankingQuery,
} from "./simulation-ranking.schema";

export interface SimulationRankingRow {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  weightedScore: number;
  completedForms: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  accuracyPercent: number;
}

export interface SimulationRankingPage {
  rows: SimulationRankingRow[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

type RankingAggregateRow = {
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  weightedScore: bigint | number | null;
  completedForms: bigint | number | null;
  correctAnswers: bigint | number | null;
  wrongAnswers: bigint | number | null;
  totalQuestions: bigint | number | null;
  accuracyPercent: number | string | null;
};

type RankingCountRow = {
  rowCount: bigint | number | null;
};

const sortFragments: Record<
  ParsedSimulationRankingQuery["sort"],
  Prisma.Sql
> = {
  weightedScore: Prisma.sql`"weightedScore"`,
  accuracyPercent: Prisma.sql`"accuracyPercent"`,
  completedForms: Prisma.sql`"completedForms"`,
  studentName: Prisma.sql`"studentName"`,
};

const directionFragments: Record<
  ParsedSimulationRankingQuery["direction"],
  Prisma.Sql
> = {
  asc: Prisma.sql`ASC`,
  desc: Prisma.sql`DESC`,
};

function numberFromDb(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return Number(value.toString());
  }
  return 0;
}

function buildOrderBy(input: ParsedSimulationRankingQuery) {
  const primarySort = sortFragments[input.sort];
  const primaryDirection = directionFragments[input.direction];

  if (input.sort === "studentName") {
    return Prisma.sql`
      ORDER BY ${primarySort} ${primaryDirection},
        "studentEmail" ${primaryDirection},
        "weightedScore" DESC,
        "accuracyPercent" DESC,
        "completedForms" DESC
    `;
  }

  return Prisma.sql`
    ORDER BY ${primarySort} ${primaryDirection},
      "accuracyPercent" DESC,
      "completedForms" DESC,
      "studentName" ASC,
      "studentEmail" ASC
  `;
}

function rankingBaseSql() {
  return Prisma.sql`
    FROM (
      SELECT
        attempt."studentId" AS "studentId",
        COUNT(*) AS "completedForms",
        COALESCE(SUM(attempt."correctCount"), 0) AS "correctAnswers",
        COALESCE(SUM(attempt."wrongCount"), 0) AS "wrongAnswers",
        COALESCE(SUM(attempt."totalQuestions"), 0) AS "totalQuestions",
        COALESCE(SUM(attempt."weightedScore"), 0) AS "weightedScore"
      FROM "SimulationAttempt" attempt
      WHERE attempt.status = 'COMPLETED'
      GROUP BY attempt."studentId"
    ) attempt_totals
    INNER JOIN "User" student ON student.id = attempt_totals."studentId"
  `;
}

export async function listTeacherSimulationRanking(
  input: SimulationRankingQuery,
): Promise<SimulationRankingPage> {
  const parsed = simulationRankingQuerySchema.parse(input);
  const offset = (parsed.page - 1) * parsed.pageSize;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<RankingAggregateRow[]>(Prisma.sql`
      SELECT
        student.id AS "studentId",
        student.name AS "studentName",
        student.email AS "studentEmail",
        attempt_totals."weightedScore" AS "weightedScore",
        attempt_totals."completedForms" AS "completedForms",
        attempt_totals."correctAnswers" AS "correctAnswers",
        attempt_totals."wrongAnswers" AS "wrongAnswers",
        attempt_totals."totalQuestions" AS "totalQuestions",
        CASE
          WHEN attempt_totals."totalQuestions" = 0 THEN 0
          ELSE ROUND(
            (
              attempt_totals."correctAnswers"::numeric /
              attempt_totals."totalQuestions"::numeric
            ) * 100,
            2
          )
        END AS "accuracyPercent"
      ${rankingBaseSql()}
      ${buildOrderBy(parsed)}
      LIMIT ${parsed.pageSize}
      OFFSET ${offset}
    `),
    prisma.$queryRaw<RankingCountRow[]>(Prisma.sql`
      SELECT COUNT(DISTINCT attempt."studentId") AS "rowCount"
      FROM "SimulationAttempt" attempt
      WHERE attempt.status = 'COMPLETED'
    `),
  ]);

  const rowCount = numberFromDb(countRows[0]?.rowCount);

  return {
    rows: rows.map((row, index) => ({
      rank: offset + index + 1,
      studentId: row.studentId,
      studentName: row.studentName?.trim() || row.studentEmail,
      studentEmail: row.studentEmail,
      weightedScore: numberFromDb(row.weightedScore),
      completedForms: numberFromDb(row.completedForms),
      correctAnswers: numberFromDb(row.correctAnswers),
      wrongAnswers: numberFromDb(row.wrongAnswers),
      totalQuestions: numberFromDb(row.totalQuestions),
      accuracyPercent: numberFromDb(row.accuracyPercent),
    })),
    rowCount,
    page: parsed.page,
    pageSize: parsed.pageSize,
    pageCount: Math.ceil(rowCount / parsed.pageSize),
  };
}
