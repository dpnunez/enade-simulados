"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  SimulationAttemptInProgressDetail,
  SimulationAttemptReviewDetail,
} from "@/features/simulated-exams/simulated-exam.service";
import { cn } from "@/lib/utils";

type SimulationAttemptViewProps =
  | {
      mode: "in-progress";
      attempt: SimulationAttemptInProgressDetail;
    }
  | {
      mode: "completed";
      attempt: SimulationAttemptReviewDetail;
    };

function messageForError(error: string) {
  if (error === "SIMULATION_ATTEMPT_ALREADY_COMPLETED") {
    return "Este simulado ja foi finalizado.";
  }
  if (error === "SIMULATION_INVALID_ANSWER") {
    return "Uma alternativa selecionada nao pertence a questao.";
  }
  return "Nao foi possivel finalizar o simulado.";
}

export function SimulationAttemptView({
  mode,
  attempt,
}: SimulationAttemptViewProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      attempt.questions
        .filter((question) => question.selectedAlternativeId)
        .map((question) => [question.id, question.selectedAlternativeId as string]),
    ),
  );
  const activeQuestion = attempt.questions[activeIndex];
  const answeredCount = useMemo(
    () => Object.keys(selectedByQuestion).length,
    [selectedByQuestion],
  );

  async function finalizeAttempt() {
    setError(null);

    const response = await fetch(`/api/student/simulated-exams/${attempt.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(selectedByQuestion).map(
          ([attemptQuestionId, selectedAlternativeId]) => ({
            attemptQuestionId,
            selectedAlternativeId,
          }),
        ),
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setError(messageForError(payload.error));
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={mode === "completed" ? "default" : "secondary"}>
            {mode === "completed" ? "Finalizado" : "Em andamento"}
          </Badge>
          {mode === "completed" ? (
            <Badge variant="outline">
              {attempt.correctCount}/{attempt.totalQuestions} acertos
            </Badge>
          ) : (
            <Badge variant="outline">
              {answeredCount}/{attempt.totalQuestions} respondidas
            </Badge>
          )}
        </div>
        <CardTitle>
          {mode === "completed"
            ? `${attempt.scorePercent}% de aproveitamento`
            : "Responder questoes"}
        </CardTitle>
        <CardDescription>
          {mode === "completed"
            ? `${attempt.wrongCount} erros ou nao respondidas.`
            : "Navegue livremente e finalize quando quiser corrigir."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertIcon />
            <div>
              <AlertTitle>Falha ao finalizar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {attempt.questions.map((question, index) => {
            const isAnswered = Boolean(selectedByQuestion[question.id]);
            const isActive = index === activeIndex;
            const isCorrect =
              mode === "completed" && "isCorrect" in question && question.isCorrect;

            return (
              <Button
                key={question.id}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-9 min-w-10"
                onClick={() => setActiveIndex(index)}
              >
                {mode === "completed" ? (
                  isCorrect ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <CircleAlert aria-hidden="true" />
                  )
                ) : isAnswered ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Circle aria-hidden="true" />
                )}
                {index + 1}
              </Button>
            );
          })}
        </div>

        <div className="rounded-md border p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Questao {activeQuestion.position + 1}</Badge>
            <Badge variant="secondary">{activeQuestion.difficulty}</Badge>
            <Badge variant="outline">
              {activeQuestion.question.subjectField.title}
            </Badge>
            {mode === "completed" ? (
              <Badge
                variant={
                  "isCorrect" in activeQuestion && activeQuestion.isCorrect
                    ? "default"
                    : "destructive"
                }
              >
                {"isCorrect" in activeQuestion && activeQuestion.isCorrect
                  ? "Correta"
                  : "Incorreta"}
              </Badge>
            ) : null}
          </div>

          <p className="whitespace-pre-wrap text-sm">
            {activeQuestion.question.descriptionMarkdown}
          </p>

          <div className="mt-5 space-y-2">
            {activeQuestion.question.alternatives.map((alternative) => {
              const inputId = `${activeQuestion.id}-${alternative.id}`;
              const selected =
                selectedByQuestion[activeQuestion.id] === alternative.id;
              const isCorrect =
                mode === "completed" &&
                "isCorrect" in alternative &&
                alternative.isCorrect;

              return (
                <Label
                  key={alternative.id}
                  htmlFor={inputId}
                  className={cn(
                    "flex gap-3 rounded-md border p-3 text-sm transition-colors",
                    mode === "in-progress" ? "cursor-pointer hover:bg-muted/50" : "",
                    selected ? "border-primary bg-primary/5" : "",
                    mode === "completed" && isCorrect
                      ? "border-green-600 bg-green-600/10"
                      : "",
                  )}
                >
                  <Input
                    id={inputId}
                    type="radio"
                    name={activeQuestion.id}
                    className="mt-0.5 h-4 w-4"
                    checked={selected}
                    disabled={mode === "completed"}
                    onChange={() => {
                      if (mode === "completed") return;
                      setSelectedByQuestion((current) => ({
                        ...current,
                        [activeQuestion.id]: alternative.id,
                      }));
                    }}
                  />
                  <span>
                    <span className="block">{alternative.contentMarkdown}</span>
                    {mode === "completed" && selected ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Alternativa escolhida
                      </span>
                    ) : null}
                    {mode === "completed" && isCorrect ? (
                      <span className="mt-1 block text-xs font-medium">
                        Alternativa correta
                      </span>
                    ) : null}
                  </span>
                </Label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={activeIndex === attempt.questions.length - 1}
              onClick={() =>
                setActiveIndex((index) =>
                  Math.min(attempt.questions.length - 1, index + 1),
                )
              }
            >
              Proxima
            </Button>
          </div>

          {mode === "in-progress" ? (
            <Button type="button" onClick={finalizeAttempt}>
              Finalizar e corrigir
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
