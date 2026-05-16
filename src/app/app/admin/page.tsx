import { requireRole } from "@auth/session";
import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");

  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          ADMIN
        </Badge>
        <CardTitle>Área ADMIN</CardTitle>
        <CardDescription>
          Apenas usuários com permissão administrativa podem ver este conteúdo.
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
