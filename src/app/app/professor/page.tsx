import { requireRole } from "@auth/session";
import { BookOpenText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfessorPage() {
  const session = await requireRole("TEACHER");

  return (
    <Card>
      <CardHeader>
        <Badge variant="outline" className="w-fit gap-1.5">
          <BookOpenText className="h-3.5 w-3.5" />
          TEACHER
        </Badge>
        <CardTitle>Área PROFESSOR</CardTitle>
        <CardDescription>
          Espaço restrito aos usuários com role de docente.
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
