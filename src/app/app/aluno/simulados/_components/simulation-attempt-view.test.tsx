import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SimulationAttemptInProgressDetail } from "@/features/simulated-exams/simulated-exam.service";

import { SimulationAttemptView } from "./simulation-attempt-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function buildInProgressAttempt() {
  return {
    id: "attempt-1",
    status: "IN_PROGRESS",
    totalQuestions: 2,
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    scorePercent: 0,
    createdAt: new Date("2026-09-08T11:00:00.000Z"),
    questions: [0, 1].map((position) => ({
      id: `attempt-question-${position + 1}`,
      position,
      difficulty: "EASY" as const,
      selectedAlternativeId: null,
      question: {
        id: `question-${position + 1}`,
        descriptionMarkdown: `Enunciado ${position + 1}`,
        subjectField: {
          id: "subject-field-1",
          title: "Engenharia",
          colorHex: "#112233",
        },
        alternatives: [
          {
            id: `alternative-${position + 1}-a`,
            contentMarkdown: `Alternativa A da questao ${position + 1}`,
            position: 0,
          },
          {
            id: `alternative-${position + 1}-b`,
            contentMarkdown: `Alternativa B da questao ${position + 1}`,
            position: 1,
          },
        ],
      },
    })),
  } satisfies SimulationAttemptInProgressDetail;
}

describe("SimulationAttemptView", () => {
  it("mostra a finalizacao apenas na ultima questao", () => {
    render(
      <SimulationAttemptView
        mode="in-progress"
        attempt={buildInProgressAttempt()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Finalizar e corrigir" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));

    expect(
      screen.getByRole("button", { name: "Finalizar e corrigir" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Proxima" }),
    ).not.toBeInTheDocument();
  });

  it("indica as questoes pendentes e nao finaliza enquanto faltarem respostas", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SimulationAttemptView
        mode="in-progress"
        attempt={buildInProgressAttempt()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Finalizar e corrigir" }),
    );

    expect(screen.getByText("Responda todas as questoes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "As questoes 1, 2 ainda nao foram respondidas. Marque uma alternativa em cada uma para finalizar.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Enunciado 1")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("finaliza quando todas as questoes estiverem respondidas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SimulationAttemptView
        mode="in-progress"
        attempt={buildInProgressAttempt()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Alternativa A da questao 1"));
    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));
    fireEvent.click(screen.getByLabelText("Alternativa A da questao 2"));
    fireEvent.click(
      screen.getByRole("button", { name: "Finalizar e corrigir" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/student/simulated-exams/attempt-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
