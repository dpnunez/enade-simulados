import { Plus } from "lucide-react";
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

import { QuestionsTable } from "./_components/questions-table";

export default async function QuestoesPage() {
  await requireRole("TEACHER");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Questoes cadastradas</CardTitle>
          <CardDescription>
            Navegue por paginas, ordene dados e acesse edicao ou delecao.
          </CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/app/professor/questoes/nova">
                <Plus aria-hidden="true" />
                Criar questao
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <QuestionsTable />
        </CardContent>
      </Card>
    </div>
  );
}
