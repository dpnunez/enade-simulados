"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, CircleAlert, Save } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

function messageForError(error: string, action: "finalize" | "save") {
  if (error === "SIMULATION_ATTEMPT_ALREADY_COMPLETED") {
    return "Este simulado ja foi finalizado.";
  }
  if (error === "SIMULATION_INVALID_ANSWER") {
    return "Uma alternativa selecionada nao pertence a questao.";
  }
  return action === "save"
    ? "Nao foi possivel salvar as respostas."
    : "Nao foi possivel finalizar o simulado.";
}

function selectedAnswersFromAttempt(
  attempt: SimulationAttemptInProgressDetail | SimulationAttemptReviewDetail,
) {
  return Object.fromEntries(
    attempt.questions
      .filter((question) => question.selectedAlternativeId)
      .map((question) => [question.id, question.selectedAlternativeId as string]),
  );
}

function serializeAnswers(selectedByQuestion: Record<string, string>) {
  return Object.entries(selectedByQuestion).map(
    ([attemptQuestionId, selectedAlternativeId]) => ({
      attemptQuestionId,
      selectedAlternativeId,
    }),
  );
}

export function SimulationAttemptView({
  mode,
  attempt,
}: SimulationAttemptViewProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string>
  >(() => selectedAnswersFromAttempt(attempt));
  const [savedByQuestion, setSavedByQuestion] = useState<Record<string, string>>(
    () => selectedAnswersFromAttempt(attempt),
  );
  const activeQuestion = attempt.questions[activeIndex];
  const answeredCount = useMemo(
    () => Object.keys(selectedByQuestion).length,
    [selectedByQuestion],
  );
  const hasUnsavedChanges = useMemo(() => {
    const selectedEntries = Object.entries(selectedByQuestion);
    const savedEntries = Object.entries(savedByQuestion);

    if (selectedEntries.length !== savedEntries.length) return true;

    return selectedEntries.some(
      ([questionId, selectedAlternativeId]) =>
        savedByQuestion[questionId] !== selectedAlternativeId,
    );
  }, [savedByQuestion, selectedByQuestion]);

  async function finalizeAttempt() {
    setError(null);
    setSaveMessage(null);
    setIsFinalizing(true);

    try {
      const response = await fetch(`/api/student/simulated-exams/${attempt.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: serializeAnswers(selectedByQuestion),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError({
          title: "Falha ao finalizar",
          message: messageForError(payload.error, "finalize"),
        });
        return;
      }

      router.refresh();
    } finally {
      setIsFinalizing(false);
    }
  }

  async function saveAnswers() {
    setError(null);
    setSaveMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/student/simulated-exams/${attempt.id}/answers`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            answers: serializeAnswers(selectedByQuestion),
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError({
          title: "Falha ao salvar",
          message: messageForError(payload.error, "save"),
        });
        return;
      }

      setSavedByQuestion(selectedAnswersFromAttempt(payload.attempt));
      setSaveMessage("Respostas salvas.");
      router.refresh();
    } catch {
      setError({
        title: "Falha ao salvar",
        message: messageForError("UNKNOWN", "save"),
      });
      return;
    } finally {
      setIsSaving(false);
    }
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
            <CircleAlert aria-hidden="true" />
            <div>
              <AlertTitle>{error.title}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </div>
          </Alert>
        ) : null}
        {mode === "in-progress" && saveMessage ? (
          <Alert>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <AlertTitle>{saveMessage}</AlertTitle>
              <AlertDescription>
                {hasUnsavedChanges
                  ? "Ha alteracoes ainda nao salvas."
                  : "Voce pode continuar depois sem finalizar."}
              </AlertDescription>
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
                      setSaveMessage(null);
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
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={saveAnswers}
                >
                  <Save aria-hidden="true" />
                  {isSaving ? "Salvando..." : "Salvar respostas"}
                </Button>
                <Button
                  type="button"
                  disabled={isFinalizing}
                  onClick={finalizeAttempt}
                >
                  {isFinalizing ? "Finalizando..." : "Finalizar e corrigir"}
                </Button>
              </div>
              {hasUnsavedChanges ? (
                <p className="text-xs text-muted-foreground">
                  Ha alteracoes ainda nao salvas.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
