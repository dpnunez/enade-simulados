import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import {
  SimulationDomainError,
  getCompletedSimulationAttemptForStudent,
  getInProgressSimulationAttemptForStudent,
} from "@/features/simulated-exams/simulated-exam.service";

import { SimulationAttemptView } from "../_components/simulation-attempt-view";

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

      {detail.mode === "completed" ? (
        <SimulationAttemptView mode="completed" attempt={detail.attempt} />
      ) : (
        <SimulationAttemptView mode="in-progress" attempt={detail.attempt} />
      )}
    </div>
  );
}
