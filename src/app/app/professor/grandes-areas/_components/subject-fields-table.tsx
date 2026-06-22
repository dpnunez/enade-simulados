"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SubjectFieldForm } from "./subject-field-form";

type SubjectFieldRow = {
  id: string;
  title: string;
  description: string;
  colorHex: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    questions: number;
  };
};

type SubjectFieldsResponse =
  | { success: true; rows: SubjectFieldRow[] }
  | { success: false; error: string };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function questionCountLabel(count: number) {
  return count === 1 ? "1 questao" : `${count} questoes`;
}

function creatorLabel(subjectField: SubjectFieldRow) {
  return subjectField.createdBy.name ?? subjectField.createdBy.email;
}

async function fetchSubjectFields() {
  const response = await fetch("/api/subject-fields");
  const payload = (await response.json()) as SubjectFieldsResponse;

  if (!response.ok || !payload.success) {
    throw new Error("Nao foi possivel carregar as grandes areas.");
  }

  return payload.rows;
}

async function deleteSubjectField(subjectFieldId: string) {
  const response = await fetch(`/api/subject-fields/${subjectFieldId}`, {
    method: "DELETE",
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error === "SUBJECT_FIELD_NOT_FOUND"
        ? "Esta grande area nao foi encontrada. Atualize a lista e tente novamente."
        : "Nao foi possivel deletar a grande area.",
    );
  }

  return payload.subjectField;
}

export function SubjectFieldsTable() {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["subject-fields"],
    queryFn: fetchSubjectFields,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSubjectField,
    onSuccess: () => {
      toast.success("Grande area deletada com sucesso.");
      setConfirmingDeleteId(null);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["subject-fields"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const columns = useMemo<ColumnDef<SubjectFieldRow>[]>(
    () => [
      {
        accessorFn: (row) => `${row.title} ${row.description}`,
        id: "title",
        header: "Grande area",
        cell: ({ row }) => (
          <div className="flex min-w-56 items-start gap-3 whitespace-normal">
            <span
              className="mt-1 h-4 w-4 shrink-0 rounded-sm border"
              style={{ backgroundColor: row.original.colorHex }}
              aria-label={`Cor ${row.original.colorHex}`}
            />
            <div className="space-y-1">
              <div className="font-medium">{row.original.title}</div>
              <div className="max-w-xl text-muted-foreground">
                {row.original.description}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorFn: (row) => row._count.questions,
        id: "questions",
        header: "Questoes",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {questionCountLabel(row.original._count.questions)}
          </Badge>
        ),
      },
      {
        accessorFn: creatorLabel,
        id: "createdBy",
        header: "Criada por",
      },
      {
        accessorKey: "updatedAt",
        header: "Atualizada",
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: "Acoes",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant={editingId === row.original.id ? "secondary" : "outline"}
              onClick={() =>
                setEditingId((current) =>
                  current === row.original.id ? null : row.original.id,
                )
              }
            >
              <Pencil aria-hidden="true" />
              Editar
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
    [editingId],
  );

  const table = useReactTable({
    data: query.data ?? [],
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (query.isLoading) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        Carregando grandes areas...
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>Falha ao carregar</AlertTitle>
        <AlertDescription>
          Nao foi possivel carregar as grandes areas. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Filtrar por titulo, descricao ou criador"
          className="sm:max-w-sm"
        />
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Nenhuma grande area encontrada.
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
                  {editingId === row.original.id ? (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <div className="rounded-md border bg-muted/30 p-4">
                          <SubjectFieldForm
                            subjectField={row.original}
                            onSaved={() => {
                              setEditingId(null);
                              void queryClient.invalidateQueries({
                                queryKey: ["subject-fields"],
                              });
                            }}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {confirmingDeleteId === row.original.id ? (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <div className="space-y-3 rounded-md border border-destructive/40 p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Confirmar delecao</p>
                            <p className="text-sm text-muted-foreground">
                              Esta acao remove a grande area &quot;{row.original.title}
                              &quot; e tambem remove as questoes relacionadas.
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
    </div>
  );
}
