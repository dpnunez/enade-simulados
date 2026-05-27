import Link from "next/link";
import { Plus } from "lucide-react";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listQuestions } from "@/features/questions/question.service";

import { QuestionsList } from "./_components/questions-list";

export default async function QuestoesPage() {
  await requireRole("TEACHER");

  const questions = await listQuestions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            Gerenciar questoes
          </h1>
          <p className="text-sm text-muted-foreground">
            Mantenha o banco de questoes objetivas usado nos simulados futuros.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/professor/questoes/nova">
            <Plus aria-hidden="true" />
            Criar questao
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questoes cadastradas</CardTitle>
          <CardDescription>
            Registros mais recentemente atualizados aparecem primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionsList questions={questions} />
        </CardContent>
      </Card>
    </div>
  );
}
