"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SimulationRankingRow } from "@/features/simulation-ranking/simulation-ranking.service";
import {
  simulationRankingDateFilterSchema,
  type ParsedSimulationRankingQuery,
} from "@/features/simulation-ranking/simulation-ranking.schema";

type RankingResponse = {
  success: boolean;
  rows: SimulationRankingRow[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error?: string;
};

const sortableColumnIds = new Set([
  "weightedScore",
  "accuracyPercent",
  "completedForms",
  "studentName",
]);

const pageSizeOptions = [10, 20, 50, 100];

type RankingDateFilter = Pick<
  ParsedSimulationRankingQuery,
  "startDate" | "endDate"
>;
type RankingDateFilterForm = z.input<typeof simulationRankingDateFilterSchema>;

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function headerLabel(label: string, sorted: false | "asc" | "desc") {
  const Icon =
    sorted === "asc"
      ? ChevronUp
      : sorted === "desc"
        ? ChevronDown
        : ChevronsUpDown;

  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
    </span>
  );
}

export function RankingTable() {
  const [rows, setRows] = useState<SimulationRankingRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "weightedScore", desc: true },
  ]);
  const [appliedDateFilter, setAppliedDateFilter] =
    useState<RankingDateFilter>({});
  const form = useForm<RankingDateFilterForm, unknown, RankingDateFilter>({
    resolver: zodResolver(simulationRankingDateFilterSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
    },
  });

  function applyDateFilter(values: RankingDateFilter) {
    setAppliedDateFilter(values);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function clearDateFilter() {
    form.reset({ startDate: "", endDate: "" });
    setAppliedDateFilter({});
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const columns = useMemo<ColumnDef<SimulationRankingRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Pos.",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="secondary">#{row.original.rank}</Badge>
        ),
      },
      {
        accessorKey: "studentName",
        header: ({ column }) =>
          headerLabel("Estudante", column.getIsSorted()),
        cell: ({ row }) => (
          <div className="min-w-48 space-y-1">
            <div className="font-medium">{row.original.studentName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.studentEmail}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "weightedScore",
        header: ({ column }) => headerLabel("Pontos", column.getIsSorted()),
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.weightedScore}</span>
        ),
      },
      {
        accessorKey: "completedForms",
        header: ({ column }) =>
          headerLabel("Formularios", column.getIsSorted()),
      },
      {
        accessorKey: "correctAnswers",
        header: "Acertos",
        enableSorting: false,
      },
      {
        accessorKey: "wrongAnswers",
        header: "Erros",
        enableSorting: false,
      },
      {
        accessorKey: "totalQuestions",
        header: "Questoes",
        enableSorting: false,
      },
      {
        accessorKey: "accuracyPercent",
        header: ({ column }) => headerLabel("Acerto", column.getIsSorted()),
        cell: ({ row }) => `${formatPercent(row.original.accuracyPercent)}%`,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount,
    pageCount,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setPagination((current) => ({ ...current, pageIndex: 0 }));
      setSorting(updater);
    },
  });

  useEffect(() => {
    const abortController = new AbortController();
    const activeSort = sorting[0] ?? { id: "weightedScore", desc: true };
    const sort = sortableColumnIds.has(activeSort.id)
      ? activeSort.id
      : "weightedScore";
    const params = new URLSearchParams({
      page: String(pagination.pageIndex + 1),
      pageSize: String(pagination.pageSize),
      sort,
      direction: activeSort.desc ? "desc" : "asc",
    });
    if (appliedDateFilter.startDate) {
      params.set("startDate", appliedDateFilter.startDate);
    }
    if (appliedDateFilter.endDate) {
      params.set("endDate", appliedDateFilter.endDate);
    }

    async function loadRanking() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/teacher/simulation-ranking?${params.toString()}`,
          {
            signal: abortController.signal,
          },
        );
        const payload = (await response.json()) as RankingResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "RANKING_LOAD_FAILED");
        }

        setRows(payload.rows);
        setRowCount(payload.rowCount);
        setPageCount(payload.pageCount);
      } catch (loadError) {
        if (abortController.signal.aborted) return;

        setRows([]);
        setRowCount(0);
        setPageCount(0);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "RANKING_LOAD_FAILED",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRanking();

    return () => abortController.abort();
  }, [appliedDateFilter, pagination.pageIndex, pagination.pageSize, sorting]);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>
            Nao foi possivel carregar o ranking agora.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={form.handleSubmit(applyDateFilter)} noValidate>
        <FieldGroup className="gap-4 sm:flex-row sm:items-end">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Data inicial</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  ref={field.ref}
                  value={typeof field.value === "string" ? field.value : ""}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? `${field.name}-error` : undefined
                  }
                />
                {fieldState.invalid ? (
                  <FieldError
                    id={`${field.name}-error`}
                    errors={[fieldState.error]}
                  />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Data final</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  ref={field.ref}
                  value={typeof field.value === "string" ? field.value : ""}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? `${field.name}-error` : undefined
                  }
                />
                {fieldState.invalid ? (
                  <FieldError
                    id={`${field.name}-error`}
                    errors={[fieldState.error]}
                  />
                ) : null}
              </Field>
            )}
          />
          <Field orientation="horizontal" className="w-auto gap-2">
            <Button type="submit">Aplicar filtros</Button>
            <Button type="button" variant="outline" onClick={clearDateFilter}>
              Limpar filtros
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      className="h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                      variant="ghost"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Carregando ranking...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum simulado finalizado encontrado.
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
            ? "0 estudantes"
            : `${rowCount} estudantes - pagina ${pagination.pageIndex + 1} de ${Math.max(pageCount, 1)}`}
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
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Proxima
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
