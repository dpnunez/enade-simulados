import Link from "next/link";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";

import { requireRole } from "@auth/session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getQuestionForEdit,
  QuestionDomainError,
} from "@/features/questions/question.service";
import { listSubjectFields } from "@/features/subject-fields/subject-field.service";

import { QuestionForm } from "../_components/question-form";

type EditQuestionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarQuestaoPage({ params }: EditQuestionPageProps) {
  await requireRole("TEACHER");

  const { id } = await params;
  const subjectFields = await listSubjectFields();
  let question;

  try {
    question = await getQuestionForEdit(id);
  } catch (error) {
    if (error instanceof QuestionDomainError && error.code === "QUESTION_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">Editar questao</h1>
          <p className="text-sm text-muted-foreground">
            Atualize enunciado, metadados e alternativas da questao.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/professor/questoes">Voltar para lista</Link>
        </Button>
      </div>

      {subjectFields.length === 0 ? (
        <Alert role="status">
          <Info aria-hidden="true" />
          <div>
            <AlertTitle>Nenhuma grande area cadastrada</AlertTitle>
            <AlertDescription>
              Cadastre uma grande area antes de editar questoes.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados da questao</CardTitle>
          <CardDescription>
            As alternativas sao substituidas em conjunto ao salvar alteracoes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm
            subjectFields={subjectFields}
            question={question}
            afterSaveHref="/app/professor/questoes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
