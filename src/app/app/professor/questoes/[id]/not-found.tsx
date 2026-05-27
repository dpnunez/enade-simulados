import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuestaoNotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Questao nao encontrada</CardTitle>
        <CardDescription>
          O registro pode ter sido removido ou o identificador informado e invalido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/app/professor/questoes">Voltar para lista</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
