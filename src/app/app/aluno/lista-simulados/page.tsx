import Link from "next/link";
import { Plus } from "lucide-react";

import { requireRole } from "@auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SimulationAttemptsTable } from "./_components/simulation-attempts-table";

export default async function ListaSimuladosPage() {
  await requireRole("STUDENT");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            Lista de simulados
          </h1>
          <p className="text-sm text-muted-foreground">
            Retome simulados em andamento ou revise resultados finalizados.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/aluno/simulados/novo">
            <Plus aria-hidden="true" />
            Novo simulado
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulados</CardTitle>
          <CardDescription>
            Tentativas mais recentes aparecem primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimulationAttemptsTable />
        </CardContent>
      </Card>
    </div>
  );
}
