import Link from "next/link";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listEligibleSubjectFields } from "@/features/simulated-exams/simulated-exam.service";

export default async function NovoSimuladoPage() {
  await requireRole("STUDENT");

  const subjectFields = await listEligibleSubjectFields();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            Gerar simulado
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha grandes areas com questoes disponiveis e defina a quantidade.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/student/simulados">Voltar ao historico</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuracao</CardTitle>
          <CardDescription>
            {subjectFields.length} grandes areas disponiveis para sorteio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjectFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma grande area possui questoes disponiveis no momento.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subjectFields.map((subjectField) => (
                <div
                  key={subjectField.id}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: subjectField.colorHex }}
                    />
                    {subjectField.title}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {subjectField._count.questions} questoes disponiveis
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
