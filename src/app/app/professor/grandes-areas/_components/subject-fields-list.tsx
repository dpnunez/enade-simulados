"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubjectFieldListItem } from "@/features/subject-fields/subject-field.service";

import { SubjectFieldForm } from "./subject-field-form";

type SubjectFieldsListProps = {
  subjectFields: SubjectFieldListItem[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function creatorLabel(subjectField: SubjectFieldListItem) {
  return subjectField.createdBy.name ?? subjectField.createdBy.email;
}

function questionCountLabel(count: number) {
  return count === 1 ? "1 questao" : `${count} questoes`;
}

export function SubjectFieldsList({ subjectFields }: SubjectFieldsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(subjectFields);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function updateSavedItem(saved: Partial<SubjectFieldListItem> & { id: string }) {
    setItems((current) =>
      current.map((item) =>
        item.id === saved.id
          ? {
              ...item,
              ...saved,
              createdBy: item.createdBy,
            }
          : item,
      ),
    );
    setEditingId(null);
  }

  async function deleteSubjectField(subjectFieldId: string) {
    setDeletingId(subjectFieldId);
    setDeleteError(null);

    const response = await fetch(`/api/subject-fields/${subjectFieldId}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    setDeletingId(null);

    if (!response.ok || !payload.success) {
      if (payload.error === "SUBJECT_FIELD_NOT_FOUND") {
        setDeleteError("Esta grande area nao foi encontrada. Atualize a lista e tente novamente.");
      } else {
        setDeleteError("Nao foi possivel deletar a grande area.");
      }
      return;
    }

    setItems((current) => current.filter((item) => item.id !== subjectFieldId));
    setConfirmingDeleteId(null);
    setEditingId((current) => (current === subjectFieldId ? null : current));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Nenhuma grande area cadastrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((subjectField) => {
        const isEditing = editingId === subjectField.id;
        const isConfirmingDelete = confirmingDeleteId === subjectField.id;
        const isDeleting = deletingId === subjectField.id;

        return (
          <Card key={subjectField.id} className="rounded-md">
            <CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-sm border"
                    style={{ backgroundColor: subjectField.colorHex }}
                    aria-label={`Cor ${subjectField.colorHex}`}
                  />
                  <CardTitle className="break-words text-lg">
                    {subjectField.title}
                  </CardTitle>
                  <Badge variant="outline">{subjectField.colorHex}</Badge>
                  <Badge variant="secondary">
                    {questionCountLabel(subjectField._count.questions)}
                  </Badge>
                </div>
                <p className="break-words text-sm text-muted-foreground">
                  {subjectField.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isEditing ? "secondary" : "outline"}
                  onClick={() => setEditingId(isEditing ? null : subjectField.id)}
                  aria-expanded={isEditing}
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmingDeleteId(subjectField.id);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Deletar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {deleteError && isConfirmingDelete ? (
                <Alert variant="destructive" role="alert">
                  <AlertIcon />
                  <div>
                    <AlertTitle>Falha ao deletar</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                  </div>
                </Alert>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Criada por {creatorLabel(subjectField)}. Atualizada em{" "}
                {formatDate(subjectField.updatedAt)}.
              </p>
              {isConfirmingDelete ? (
                <div className="space-y-3 rounded-md border border-destructive/40 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Confirmar delecao</p>
                    <p className="text-sm text-muted-foreground">
                      Esta acao remove a grande area "{subjectField.title}" do catalogo.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => deleteSubjectField(subjectField.id)}
                    >
                      {isDeleting ? "Deletando..." : "Confirmar delecao"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => {
                        setConfirmingDeleteId(null);
                        setDeleteError(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}
              {isEditing ? (
                <div className="rounded-md border p-4">
                  <SubjectFieldForm
                    subjectField={subjectField}
                    onSaved={updateSavedItem}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
