import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { SimulationAttemptReviewDetail } from "@/features/simulated-exams/simulated-exam.service";

import { SimulationAttemptView } from "./simulation-attempt-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function buildCompletedAttempt(isCorrect: boolean) {
  return {
    id: "attempt-1",
    status: "COMPLETED",
    totalQuestions: 1,
    answeredCount: 1,
    correctCount: isCorrect ? 1 : 0,
    wrongCount: isCorrect ? 0 : 1,
    scorePercent: isCorrect ? 100 : 0,
    completedAt: new Date("2026-09-08T12:00:00.000Z"),
    createdAt: new Date("2026-09-08T11:00:00.000Z"),
    questions: [
      {
        id: "attempt-question-1",
        position: 0,
        difficulty: "EASY",
        selectedAlternativeId: isCorrect ? "alternative-correct" : "alternative-wrong",
        correctAlternativeId: "alternative-correct",
        isCorrect,
        answeredAt: new Date("2026-09-08T11:30:00.000Z"),
        question: {
          id: "question-1",
          descriptionMarkdown: "Enunciado da questao",
          correctAnswerExplanation: "**Explicacao pedagogica** da resposta.",
          subjectField: {
            id: "subject-field-1",
            title: "Engenharia",
            colorHex: "#112233",
          },
          alternatives: [
            {
              id: "alternative-correct",
              contentMarkdown: "Alternativa correta",
              position: 0,
              isCorrect: true,
            },
            {
              id: "alternative-wrong",
              contentMarkdown: "Alternativa incorreta",
              position: 1,
              isCorrect: false,
            },
          ],
        },
      },
    ],
  } satisfies SimulationAttemptReviewDetail;
}

describe("SimulationAttemptView answer explanation", () => {
  it.each([
    ["correta", true],
    ["incorreta", false],
  ])("mostra a explicacao depois de uma resposta %s", (_, isCorrect) => {
    render(
      <SimulationAttemptView
        mode="completed"
        attempt={buildCompletedAttempt(isCorrect)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Explicacao da resposta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Explicacao pedagogica")).toBeInTheDocument();
  });
});
