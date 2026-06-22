import Link from "next/link";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";

import { requireRole } from "@auth/session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <CardTitle>Editar questao</CardTitle>
          <CardDescription>
            As alternativas sao substituidas em conjunto ao salvar alteracoes.
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
            question={question}
            afterSaveHref="/app/professor/questoes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
