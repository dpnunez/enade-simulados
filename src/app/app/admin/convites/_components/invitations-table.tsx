"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvitationRow } from "@/features/invitations/invitation.service";

type InvitationsResponse = {
  success: boolean;
  rows: InvitationRow[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error?: string;
};

export const INVITATIONS_QUERY_KEY = ["admin", "invitations"] as const;

const sortableColumnIds = new Set(["createdAt", "email", "role"]);
const pageSizeOptions = [10, 20, 50, 100];

const roleLabels = {
  ADMIN: "Admin",
  STUDENT: "Aluno",
  TEACHER: "Professor",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
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
      <Icon aria-hidden="true" />
    </span>
  );
}

async function fetchInvitations({
  pagination,
  sorting,
}: {
  pagination: PaginationState;
  sorting: SortingState;
}) {
  const activeSort = sorting[0] ?? { id: "createdAt", desc: true };
  const sort = sortableColumnIds.has(activeSort.id)
    ? activeSort.id
    : "createdAt";
  const params = new URLSearchParams({
    page: String(pagination.pageIndex + 1),
    pageSize: String(pagination.pageSize),
    sort,
    direction: activeSort.desc ? "desc" : "asc",
  });

  const response = await fetch(`/api/invitations?${params.toString()}`);
  const payload = (await response.json()) as InvitationsResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "INVITATIONS_LOAD_FAILED");
  }

  return payload;
}

async function cancelInvitation(invitationId: string) {
  const response = await fetch(`/api/invitations/${invitationId}/cancel`, {
    method: "POST",
  });
  const payload = (await response.json()) as { success?: boolean; error?: string };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "INVITATION_CANCEL_FAILED");
  }
}

export function InvitationsTable({
  refreshSignal,
}: {
  refreshSignal: number;
}) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const invitationsQuery = useQuery({
    queryKey: [...INVITATIONS_QUERY_KEY, pagination, sorting],
    queryFn: () => fetchInvitations({ pagination, sorting }),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
    },
  });

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setSorting([{ id: "createdAt", desc: true }]);
  }, [refreshSignal]);

  const columns = useMemo<ColumnDef<InvitationRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => headerLabel("Email", column.getIsSorted()),
        cell: ({ row }) => (
          <div className="min-w-56">
            <div className="font-medium">{row.original.email}</div>
            <div className="text-xs text-muted-foreground">
              Criado em {formatDate(row.original.createdAt)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => headerLabel("Papel", column.getIsSorted()),
        cell: ({ row }) => (
          <Badge variant="secondary">{roleLabels[row.original.role]}</Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => headerLabel("Criado em", column.getIsSorted()),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cancelMutation.mutate(row.original.id)}
            disabled={
              cancelMutation.isPending &&
              cancelMutation.variables === row.original.id
            }
          >
            {cancelMutation.isPending &&
            cancelMutation.variables === row.original.id
              ? "Cancelando..."
              : "Cancelar"}
          </Button>
        ),
      },
    ],
    [cancelMutation],
  );

  const rows = invitationsQuery.data?.rows ?? [];
  const rowCount = invitationsQuery.data?.rowCount ?? 0;
  const pageCount = invitationsQuery.data?.pageCount ?? 0;
  const isLoading = invitationsQuery.isLoading || invitationsQuery.isFetching;

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount,
    pageCount,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setPagination((current) => ({ ...current, pageIndex: 0 }));
      setSorting(updater);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {invitationsQuery.isError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Não foi possível carregar convites</AlertTitle>
            <AlertDescription>
              Tente novamente em instantes.
            </AlertDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => invitationsQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {cancelMutation.isError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Não foi possível cancelar o convite</AlertTitle>
            <AlertDescription>
              Atualize a lista e tente novamente.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      type="button"
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
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columns.length}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum convite pendente.
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
            ? "0 convites"
            : `${rowCount} convites - página ${pagination.pageIndex + 1} de ${Math.max(pageCount, 1)}`}
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
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Próxima
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
