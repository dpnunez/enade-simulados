import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SimulationDomainError,
  getCompletedSimulationAttemptForStudent,
  getInProgressSimulationAttemptForStudent,
} from "@/features/simulated-exams/simulated-exam.service";

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
};

async function getAttempt(attemptId: string, studentId: string) {
  try {
    return {
      mode: "in-progress" as const,
      attempt: await getInProgressSimulationAttemptForStudent(
        attemptId,
        studentId,
      ),
    };
  } catch (error) {
    if (
      !(error instanceof SimulationDomainError) ||
      error.code !== "SIMULATION_ATTEMPT_NOT_FOUND"
    ) {
      throw error;
    }
  }

  try {
    return {
      mode: "completed" as const,
      attempt: await getCompletedSimulationAttemptForStudent(attemptId, studentId),
    };
  } catch (error) {
    if (
      error instanceof SimulationDomainError &&
      error.code === "SIMULATION_ATTEMPT_NOT_FOUND"
    ) {
      notFound();
    }

    throw error;
  }
}

export default async function StudentSimuladoAttemptPage({
  params,
}: AttemptPageProps) {
  const session = await requireRole("STUDENT");
  const { attemptId } = await params;
  const detail = await getAttempt(attemptId, session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            {detail.mode === "completed" ? "Revisar simulado" : "Responder simulado"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {detail.attempt.totalQuestions} questoes selecionadas para esta
            tentativa.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/student/simulados">Voltar ao historico</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                detail.mode === "completed" ? "default" : "secondary"
              }
            >
              {detail.mode === "completed" ? "Finalizado" : "Em andamento"}
            </Badge>
            {detail.mode === "completed" ? (
              <Badge variant="outline">
                {detail.attempt.correctCount}/{detail.attempt.totalQuestions}{" "}
                acertos
              </Badge>
            ) : null}
          </div>
          <CardTitle>
            {detail.mode === "completed"
              ? `${detail.attempt.scorePercent}% de aproveitamento`
              : "Questoes sorteadas"}
          </CardTitle>
          <CardDescription>
            {detail.mode === "completed"
              ? `${detail.attempt.wrongCount} erros ou nao respondidas.`
              : "A interface de resposta sera carregada nesta tentativa."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.attempt.questions.map((attemptQuestion) => (
            <div key={attemptQuestion.id} className="rounded-md border p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  Questao {attemptQuestion.position + 1}
                </Badge>
                <Badge variant="secondary">{attemptQuestion.difficulty}</Badge>
                {"isCorrect" in attemptQuestion ? (
                  <Badge
                    variant={attemptQuestion.isCorrect ? "default" : "destructive"}
                  >
                    {attemptQuestion.isCorrect ? "Correta" : "Incorreta"}
                  </Badge>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-sm">
                {attemptQuestion.question.descriptionMarkdown}
              </p>
              <div className="mt-4 space-y-2">
                {attemptQuestion.question.alternatives.map((alternative) => {
                  const isSelected =
                    attemptQuestion.selectedAlternativeId === alternative.id;
                  const isCorrect =
                    "isCorrect" in alternative && alternative.isCorrect;

                  return (
                    <div
                      key={alternative.id}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {isSelected ? "Escolhida" : "Alternativa"}
                        {isCorrect ? " correta" : ""}
                      </span>
                      <span className="ml-2">{alternative.contentMarkdown}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
