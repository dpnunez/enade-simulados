import type { Prisma, QuestionDifficulty } from "@prisma-generated-client";

import { prisma } from "@infra/db/prisma";

const difficulties = ["EASY", "MEDIUM", "HARD"] as const satisfies readonly QuestionDifficulty[];

export type DifficultyQuotas = Record<QuestionDifficulty, number>;

export type QuestionSelectionInput = {
  subjectFieldIds: string[];
  questionCount: number;
};

export type SelectedQuestion = {
  questionId: string;
  difficulty: QuestionDifficulty;
  subjectFieldId: string;
  position: number;
};

type QuestionSelectionClient = Pick<PrismaClientLike, "question">;

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

type EligibleQuestion = {
  id: string;
  difficulty: QuestionDifficulty;
  subjectFieldId: string;
};

export class QuestionSelectionError extends Error {
  constructor(
    public readonly code: "NOT_ENOUGH_QUESTIONS",
    public readonly availableQuestionCount: number,
  ) {
    super(code);
    this.name = "QuestionSelectionError";
  }
}

export function calculateDifficultyQuotas(
  availableByDifficulty: Partial<Record<QuestionDifficulty, number>>,
  requestedQuestionCount: number,
): DifficultyQuotas {
  const available = difficulties.reduce(
    (counts, difficulty) => ({
      ...counts,
      [difficulty]: availableByDifficulty[difficulty] ?? 0,
    }),
    {} as DifficultyQuotas,
  );
  const totalAvailable = difficulties.reduce(
    (sum, difficulty) => sum + available[difficulty],
    0,
  );

  if (totalAvailable < requestedQuestionCount) {
    throw new QuestionSelectionError("NOT_ENOUGH_QUESTIONS", totalAvailable);
  }

  const baseQuota = Math.floor(requestedQuestionCount / difficulties.length);
  let remainder = requestedQuestionCount % difficulties.length;
  const quotas = difficulties.reduce((result, difficulty) => {
    const target = baseQuota + (remainder > 0 ? 1 : 0);
    remainder -= 1;

    return {
      ...result,
      [difficulty]: Math.min(target, available[difficulty]),
    };
  }, {} as DifficultyQuotas);

  let allocated = difficulties.reduce(
    (sum, difficulty) => sum + quotas[difficulty],
    0,
  );

  while (allocated < requestedQuestionCount) {
    const nextDifficulty = difficulties.find(
      (difficulty) => quotas[difficulty] < available[difficulty],
    );

    if (!nextDifficulty) {
      break;
    }

    quotas[nextDifficulty] += 1;
    allocated += 1;
  }

  return quotas;
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function countByDifficulty(questions: EligibleQuestion[]) {
  return questions.reduce<Partial<Record<QuestionDifficulty, number>>>(
    (counts, question) => ({
      ...counts,
      [question.difficulty]: (counts[question.difficulty] ?? 0) + 1,
    }),
    {},
  );
}

export async function selectBalancedQuestions(
  input: QuestionSelectionInput,
  tx: QuestionSelectionClient = prisma,
): Promise<SelectedQuestion[]> {
  const questions = await tx.question.findMany({
    where: {
      subjectFieldId: { in: input.subjectFieldIds },
    },
    select: {
      id: true,
      difficulty: true,
      subjectFieldId: true,
    },
  });

  const quotas = calculateDifficultyQuotas(
    countByDifficulty(questions),
    input.questionCount,
  );

  const selected = difficulties.flatMap((difficulty) => {
    const questionsForDifficulty = questions.filter(
      (question) => question.difficulty === difficulty,
    );

    return shuffle(questionsForDifficulty).slice(0, quotas[difficulty]);
  });

  return shuffle(selected).map((question, index) => ({
    questionId: question.id,
    difficulty: question.difficulty,
    subjectFieldId: question.subjectFieldId,
    position: index,
  }));
}
