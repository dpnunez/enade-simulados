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

import { SimulationGenerateForm } from "../_components/simulation-generate-form";

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
          <SimulationGenerateForm subjectFields={subjectFields} />
        </CardContent>
      </Card>
    </div>
  );
}
