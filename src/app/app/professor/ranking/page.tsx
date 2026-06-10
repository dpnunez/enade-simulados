import { requireRole } from "@auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RankingTable } from "./_components/ranking-table";

export default async function TeacherSimulationRankingPage() {
  await requireRole("TEACHER");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Ranking de simulados
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare desempenho acumulado dos estudantes em simulados finalizados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estudantes</CardTitle>
          <CardDescription>
            Pontos consideram acertos ponderados por dificuldade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankingTable />
        </CardContent>
      </Card>
    </div>
  );
}
