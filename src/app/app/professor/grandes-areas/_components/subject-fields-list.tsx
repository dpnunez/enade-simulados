"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

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

export function SubjectFieldsList({ subjectFields }: SubjectFieldsListProps) {
  const [items, setItems] = useState(subjectFields);
  const [editingId, setEditingId] = useState<string | null>(null);

  function updateSavedItem(saved: SubjectFieldListItem) {
    setItems((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    setEditingId(null);
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
                </div>
                <p className="break-words text-sm text-muted-foreground">
                  {subjectField.description}
                </p>
              </div>
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
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Criada por {creatorLabel(subjectField)}. Atualizada em{" "}
                {formatDate(subjectField.updatedAt)}.
              </p>
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
