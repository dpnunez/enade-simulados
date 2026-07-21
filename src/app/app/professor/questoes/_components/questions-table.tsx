"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type QuestionSource = "ENADE" | "MANUAL" | "ADAPTED" | "OTHER";
type QuestionSort = "updatedAt" | "year" | "difficulty" | "subjectField";

type QuestionRow = {
  id: string;
  descriptionMarkdown: string;
  difficulty: Difficulty;
  source: QuestionSource | null;
  year: number | null;
  updatedAt: string;
  subjectField: {
    id: string;
    title: string;
    colorHex: string;
  };
  alternatives: {
    id: string;
    contentMarkdown: string;
    isCorrect: boolean;
  }[];
};

type QuestionsResponse =
  | {
      success: true;
      rows: QuestionRow[];
      rowCount: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }
  | { success: false; error: string };

const difficultyLabel = {
  EASY: "Facil",
  MEDIUM: "Media",
  HARD: "Dificil",
} as const;

const sourceLabel = {
  ENADE: "ENADE",
  MANUAL: "Manual",
  ADAPTED: "Adaptada",
  OTHER: "Outra",
} as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function plainPreview(markdown: string) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_\-\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= 96) return text;
  return `${text.slice(0, 93).trim()}...`;
}

function correctAlternativeCount(question: QuestionRow) {
  const correctCount = question.alternatives.filter(
    (alternative) => alternative.isCorrect,
  ).length;

  return correctCount;
}

function questionMetadata(question: QuestionRow) {
  const values: string[] = [difficultyLabel[question.difficulty]];

  if (question.source) values.push(sourceLabel[question.source]);
  if (question.year) values.push(String(question.year));

  values.push(`${question.alternatives.length} alt.`);
  values.push(`${correctAlternativeCount(question)} correta`);

  return values;
}

function sortFromState(sorting: SortingState) {
  const firstSort = sorting[0];
  const supportedSorts = new Set<QuestionSort>([
    "updatedAt",
    "year",
    "difficulty",
    "subjectField",
  ]);

  if (!firstSort || !supportedSorts.has(firstSort.id as QuestionSort)) {
    return { sort: "updatedAt" as QuestionSort, direction: "desc" as const };
  }

  return {
    sort: firstSort.id as QuestionSort,
    direction: firstSort.desc ? ("desc" as const) : ("asc" as const),
  };
}

async function fetchQuestions({
  page,
  pageSize,
  sorting,
}: {
  page: number;
  pageSize: number;
  sorting: SortingState;
}) {
  const sort = sortFromState(sorting);
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort: sort.sort,
    direction: sort.direction,
  });
  const response = await fetch(`/api/questions?${searchParams}`);
  const payload = (await response.json()) as QuestionsResponse;

  if (!response.ok || !payload.success) {
    throw new Error("Nao foi possivel carregar as questoes.");
  }

  return payload;
}

async function deleteQuestion(questionId: string) {
  const response = await fetch(`/api/questions/${questionId}`, {
    method: "DELETE",
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error === "QUESTION_NOT_FOUND"
        ? "Esta questao nao foi encontrada. Atualize a lista e tente novamente."
        : payload.error === "QUESTION_RELATION_IN_USE"
          ? "Esta questao ja foi usada em simulados e nao pode ser deletada."
        : "Nao foi possivel deletar a questao.",
    );
  }

  return payload.question;
}

export function QuestionsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["questions", page, pageSize, sorting],
    queryFn: () => fetchQuestions({ page, pageSize, sorting }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      toast.success("Questao deletada com sucesso.");
      setConfirmingDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const columns = useMemo<ColumnDef<QuestionRow>[]>(
    () => [
      {
        accessorKey: "subjectField",
        id: "subjectField",
        header: "Area",
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="block size-5 rounded-sm border"
                style={{ backgroundColor: row.original.subjectField.colorHex }}
                aria-label={`Grande area: ${row.original.subjectField.title}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {row.original.subjectField.title}
            </TooltipContent>
          </Tooltip>
        ),
      },
      {
        accessorKey: "descriptionMarkdown",
        header: "Enunciado",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-72 max-w-2xl space-y-2 whitespace-normal">
            <p className="text-sm leading-snug text-foreground">
              {plainPreview(row.original.descriptionMarkdown)}
            </p>
            <div className="flex flex-wrap gap-1">
              {questionMetadata(row.original).map((item) => (
                <Badge key={item} variant="outline" className="px-1.5 py-0 text-[11px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Atualizada",
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: "Acoes",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild type="button" size="sm" variant="outline">
              <Link href={`/app/professor/questoes/${row.original.id}`}>
                <Pencil aria-hidden="true" />
                Editar
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setConfirmingDeleteId(row.original.id)}
            >
              <Trash2 aria-hidden="true" />
              Deletar
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: query.data?.rows ?? [],
    columns,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
    pageCount: query.data?.pageCount ?? 1,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (query.isLoading) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        Carregando questoes...
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>Falha ao carregar</AlertTitle>
        <AlertDescription>
          Nao foi possivel carregar as questoes. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {query.data?.rowCount ?? 0} questoes cadastradas
        </p>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Nenhuma questao cadastrada.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.column.getCanSort() ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="-ml-3"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <ArrowUpDown aria-hidden="true" />
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
              {table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {confirmingDeleteId === row.original.id ? (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <div className="space-y-3 rounded-md border border-destructive/40 p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Confirmar delecao</p>
                            <p className="text-sm text-muted-foreground">
                              Esta acao remove a questao e suas alternativas do banco.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(row.original.id)}
                            >
                              {deleteMutation.isPending
                                ? "Deletando..."
                                : "Confirmar delecao"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={() => setConfirmingDeleteId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Itens por pagina</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-2"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {query.data?.page ?? page} de {query.data?.pageCount ?? 1}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= (query.data?.pageCount ?? 1) || query.isFetching}
            onClick={() =>
              setPage((current) =>
                Math.min(query.data?.pageCount ?? current, current + 1),
              )
            }
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}
