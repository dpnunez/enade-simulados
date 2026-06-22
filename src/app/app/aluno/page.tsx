import { requireRole } from "@auth/session";
import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentPage() {
  const session = await requireRole("STUDENT");

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          Aluno
        </Badge>
        <CardTitle>Área do aluno</CardTitle>
        <CardDescription>
          Espaço restrito aos usuários com perfil de estudante.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Role atual: <span className="font-medium">{session.user.role}</span>
        </p>
      </CardContent>
    </Card>
  );
}
