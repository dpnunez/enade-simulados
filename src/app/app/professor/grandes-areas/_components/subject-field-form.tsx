"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  subjectFieldInputSchema,
  type SubjectFieldInput,
} from "@/features/subject-fields/subject-field.schema";
import type { SubjectFieldListItem } from "@/features/subject-fields/subject-field.service";
import { cn } from "@/lib/utils";

type SubjectFieldFormValue = Pick<
  SubjectFieldListItem,
  "id" | "title" | "description" | "colorHex"
>;
type SavedSubjectField = SubjectFieldFormValue & Partial<SubjectFieldListItem>;

type SubjectFieldFormProps = {
  subjectField?: SubjectFieldFormValue;
  onSaved?: (subjectField: SavedSubjectField) => void;
  onCancel?: () => void;
  afterSaveHref?: string;
  className?: string;
};

const emptyValues: SubjectFieldInput = {
  title: "",
  description: "",
  colorHex: "#2563EB",
};

function valuesFromSubjectField(
  subjectField: SubjectFieldFormValue | undefined,
): SubjectFieldInput {
  if (!subjectField) return emptyValues;
  return {
    title: subjectField.title,
    description: subjectField.description,
    colorHex: subjectField.colorHex,
  };
}

function messageForError(error: string) {
  if (error === "SUBJECT_FIELD_TITLE_EXISTS") {
    return "Ja existe uma grande area com este titulo.";
  }
  if (error === "SUBJECT_FIELD_NOT_FOUND") {
    return "Esta grande area nao foi encontrada. Atualize a lista e tente novamente.";
  }
  if (error === "VALIDATION_ERROR") {
    return "Revise os dados do formulario e tente novamente.";
  }
  return "Nao foi possivel salvar a grande area.";
}

export function SubjectFieldForm({
  subjectField,
  onSaved,
  onCancel,
  afterSaveHref,
  className,
}: SubjectFieldFormProps) {
  const router = useRouter();
  const formId = useId();
  const isEditing = Boolean(subjectField);
  const form = useForm<SubjectFieldInput>({
    resolver: zodResolver(subjectFieldInputSchema),
    defaultValues: valuesFromSubjectField(subjectField),
  });
  const colorHex = form.watch("colorHex");

  useEffect(() => {
    form.reset(valuesFromSubjectField(subjectField));
  }, [form, subjectField]);

  async function onSubmit(values: SubjectFieldInput) {
    try {
      const response = await fetch(
        isEditing
          ? `/api/subject-fields/${subjectField?.id}`
          : "/api/subject-fields",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        toast.error(messageForError(payload.error));
        return;
      }

      toast.success(
        isEditing
          ? "Grande area atualizada com sucesso."
          : "Grande area criada com sucesso.",
      );
      if (!isEditing) {
        form.reset(emptyValues);
      }
      onSaved?.(payload.subjectField);
      if (afterSaveHref) {
        router.push(afterSaveHref);
      }
      router.refresh();
    } catch {
      toast.error("Nao foi possivel salvar a grande area.");
      return;
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-title`}>Titulo</Label>
        <Input
          id={`${formId}-title`}
          placeholder="Calculo"
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-description`}>Descricao</Label>
        <textarea
          id={`${formId}-description`}
          rows={4}
          placeholder="Agrupa materias relacionadas a calculo diferencial e integral."
          aria-invalid={Boolean(form.formState.errors.description)}
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-color-picker`}>Cor</Label>
          <Input
            id={`${formId}-color-picker`}
            type="color"
            aria-label="Selecionar cor"
            className="h-10 p-1"
            value={colorHex}
            onChange={(event) =>
              form.setValue("colorHex", event.target.value.toUpperCase(), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-color-hex`}>Hexadecimal</Label>
          <Input
            id={`${formId}-color-hex`}
            placeholder="#2563EB"
            aria-invalid={Boolean(form.formState.errors.colorHex)}
            {...form.register("colorHex")}
          />
          {form.formState.errors.colorHex ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.colorHex.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Salvando..."
            : isEditing
              ? "Salvar alteracoes"
              : "Criar grande area"}
        </Button>
        {isEditing && onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
