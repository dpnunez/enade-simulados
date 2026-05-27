import { requireRole } from "@auth/session";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listSubjectFields } from "@/features/subject-fields/subject-field.service";

import { SubjectFieldForm } from "./_components/subject-field-form";
import { SubjectFieldsList } from "./_components/subject-fields-list";

export default async function GrandesAreasPage() {
  await requireRole("TEACHER");

  const subjectFields = await listSubjectFields();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Gerenciar grandes areas
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e mantenha os agrupadores amplos usados no catalogo academico.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar grande area</CardTitle>
          <CardDescription>
            Informe titulo, descricao e uma cor hexadecimal para identificar a area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectFieldForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grandes areas cadastradas</CardTitle>
          <CardDescription>
            Registros mais recentemente atualizados aparecem primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectFieldsList subjectFields={subjectFields} />
        </CardContent>
      </Card>
    </div>
  );
}
