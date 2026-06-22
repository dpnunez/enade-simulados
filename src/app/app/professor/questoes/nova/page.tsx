import Link from "next/link";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listSubjectFields } from "@/features/subject-fields/subject-field.service";

import { QuestionForm } from "../_components/question-form";

export default async function NovaQuestaoPage() {
  await requireRole("TEACHER");

  const subjectFields = await listSubjectFields();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar questao</CardTitle>
          <CardDescription>
            A questao precisa estar vinculada a uma grande area existente.
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/app/professor/questoes">Voltar para lista</Link>
            </Button>
          </CardAction>
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
