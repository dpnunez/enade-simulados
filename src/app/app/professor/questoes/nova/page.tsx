import Link from "next/link";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listSubjectFields } from "@/features/subject-fields/subject-field.service";

import { QuestionForm } from "../_components/question-form";

export default async function NovaQuestaoPage() {
  await requireRole("TEACHER");

  const subjectFields = await listSubjectFields();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">Criar questao</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre enunciado, metadados e alternativas da questao objetiva.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/professor/questoes">Voltar para lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da questao</CardTitle>
          <CardDescription>
            A questao precisa estar vinculada a uma grande area existente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm
            subjectFields={subjectFields}
            afterSaveHref="/app/professor/questoes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
