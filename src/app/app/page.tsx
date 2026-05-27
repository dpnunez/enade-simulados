import { requireAuth } from "@auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PrivateHomePage() {
  const session = await requireAuth();

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Área privada
        </Badge>
        <CardTitle>Qualquer usuário autenticado pode ver esta página.</CardTitle>
        <CardDescription>
          Esta tela serve como ponto de entrada para navegação protegida.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Role atual: <span className="font-medium" data-testid="current-role">{session.user.role}</span>
        </p>
      </CardContent>
    </Card>
  );
}
