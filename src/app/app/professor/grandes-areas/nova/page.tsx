import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

import { SubjectFieldForm } from "../_components/subject-field-form";

export default async function NovaGrandeAreaPage() {
  await requireRole("TEACHER");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar grande area</CardTitle>
          <CardDescription>
            Use um titulo claro e uma descricao curta para orientar o cadastro de
            questoes.
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/app/professor/grandes-areas">
                <ArrowLeft aria-hidden="true" />
                Voltar para listagem
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <SubjectFieldForm afterSaveHref="/app/professor/grandes-areas" />
        </CardContent>
      </Card>
    </div>
  );
}
