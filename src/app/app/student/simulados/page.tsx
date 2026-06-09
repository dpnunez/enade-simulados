import Link from "next/link";
import { Plus } from "lucide-react";

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
import { listSimulationAttemptsForStudent } from "@/features/simulated-exams/simulated-exam.service";

export default async function StudentSimuladosPage() {
  const session = await requireRole("STUDENT");
  const attempts = await listSimulationAttemptsForStudent(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">Simulados</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe tentativas em andamento e revise resultados finalizados.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/student/simulados/novo">
            <Plus aria-hidden="true" />
            Novo simulado
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico</CardTitle>
          <CardDescription>
            Tentativas mais recentes aparecem primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum simulado criado ainda.
            </p>
          ) : (
            <div className="divide-y">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/app/student/simulados/${attempt.id}`}
                  className="flex flex-col gap-3 py-4 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          attempt.status === "COMPLETED" ? "default" : "secondary"
                        }
                      >
                        {attempt.status === "COMPLETED"
                          ? "Finalizado"
                          : "Em andamento"}
                      </Badge>
                      <span className="text-sm font-medium">
                        {attempt.totalQuestions} questoes
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attempt.subjectFields
                        .map(({ subjectField }) => subjectField.title)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {attempt.status === "COMPLETED"
                      ? `${attempt.correctCount}/${attempt.totalQuestions} acertos (${attempt.scorePercent}%)`
                      : `${attempt.answeredCount}/${attempt.totalQuestions} respondidas`}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
