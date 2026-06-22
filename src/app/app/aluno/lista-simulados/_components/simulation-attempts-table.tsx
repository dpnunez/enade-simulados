"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SimulationAttemptListRow = {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  scorePercent: number;
  startedAt: string;
  completedAt: string | null;
  subjectFields: Array<{
    id: string;
    title: string;
    colorHex: string;
  }>;
};

type AttemptsResponse = {
  success: boolean;
  rows: SimulationAttemptListRow[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error?: string;
};

const pageSizeOptions = [10, 20, 50, 100];

function formatDateTime(value: string | null) {
  if (!value) return "Ainda em andamento";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchAttempts(
  pagination: PaginationState,
): Promise<AttemptsResponse> {
  const params = new URLSearchParams({
    page: String(pagination.pageIndex + 1),
    pageSize: String(pagination.pageSize),
  });
  const response = await fetch(`/api/student/simulated-exams?${params}`);
  const payload = (await response.json()) as AttemptsResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "SIMULATION_ATTEMPTS_LOAD_FAILED");
  }

  return payload;
}

export function SimulationAttemptsTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const attemptsQuery = useQuery({
    queryKey: ["student-simulation-attempts", pagination],
    queryFn: () => fetchAttempts(pagination),
  });
  const rows = attemptsQuery.data?.rows ?? [];
  const rowCount = attemptsQuery.data?.rowCount ?? 0;
  const pageCount = attemptsQuery.data?.pageCount ?? 0;

  const columns = useMemo<ColumnDef<SimulationAttemptListRow>[]>(
    () => [
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "COMPLETED" ? "default" : "secondary"
            }
          >
            {row.original.status === "COMPLETED"
              ? "Finalizado"
              : "Em andamento"}
          </Badge>
        ),
      },
      {
        accessorKey: "subjectFields",
        header: "Grandes areas",
        cell: ({ row }) => {
          const visibleSubjectFields = row.original.subjectFields.slice(0, 2);
          const hiddenSubjectFieldCount =
            row.original.subjectFields.length - visibleSubjectFields.length;

          return (
            <div className="flex min-w-48 flex-wrap gap-1.5">
              {visibleSubjectFields.map((subjectField) => (
                <Badge key={subjectField.id} variant="outline">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: subjectField.colorHex }}
                  />
                  {subjectField.title}
                </Badge>
              ))}
              {hiddenSubjectFieldCount > 0 ? (
                <Badge variant="secondary">
                  +{hiddenSubjectFieldCount} areas
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "startedAt",
        header: "Inicio",
        cell: ({ row }) => formatDateTime(row.original.startedAt),
      },
      {
        accessorKey: "completedAt",
        header: "Finalizacao",
        cell: ({ row }) => formatDateTime(row.original.completedAt),
      },
      {
        accessorKey: "answeredCount",
        header: "Progresso/resultado",
        cell: ({ row }) =>
          row.original.status === "COMPLETED"
            ? `${row.original.correctCount}/${row.original.totalQuestions} acertos (${row.original.scorePercent}%)`
            : `${row.original.answeredCount}/${row.original.totalQuestions} respondidas`,
      },
      {
        id: "action",
        header: "Acao",
        cell: ({ row }) => {
          const isCompleted = row.original.status === "COMPLETED";

          return (
            <Button asChild size="sm" variant={isCompleted ? "outline" : "default"}>
              <Link href={`/app/aluno/simulados/${row.original.id}`}>
                {isCompleted ? "Revisar resultado" : "Retomar e finalizar"}
              </Link>
            </Button>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-4">
      {attemptsQuery.isError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Falha ao carregar simulados</AlertTitle>
            <AlertDescription>
              Nao foi possivel carregar a lista agora.
            </AlertDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => attemptsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {attemptsQuery.isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Carregando simulados...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32">
                <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <ClipboardList aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      Nenhum simulado criado ainda.
                    </span>
                    <span>Gere um simulado para iniciar sua pratica.</span>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/app/aluno/simulados/novo">Gerar simulado</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          {rowCount === 0
            ? "0 simulados"
            : `${rowCount} simulados - pagina ${pagination.pageIndex + 1} de ${Math.max(pageCount, 1)}`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span>Linhas</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-foreground"
              value={pagination.pageSize}
              onChange={(event) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                })
              }
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || attemptsQuery.isFetching}
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || attemptsQuery.isFetching}
          >
            Proxima
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
