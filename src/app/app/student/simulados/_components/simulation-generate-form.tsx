"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  simulationGenerationInputSchema,
  type SimulationGenerationInput,
} from "@/features/simulated-exams/simulated-exam.schema";
import type { listEligibleSubjectFields } from "@/features/simulated-exams/simulated-exam.service";
import { cn } from "@/lib/utils";

type SubjectFieldOption = Awaited<
  ReturnType<typeof listEligibleSubjectFields>
>[number];

type SimulationGenerateFormProps = {
  subjectFields: SubjectFieldOption[];
};

const defaultValues: SimulationGenerationInput = {
  subjectFieldIds: [],
  questionCount: 10,
};

function messageForError(error: string, metadata?: { availableQuestionCount?: number }) {
  if (error === "SIMULATION_NOT_ENOUGH_QUESTIONS") {
    return `Ha apenas ${metadata?.availableQuestionCount ?? 0} questoes disponiveis para este filtro.`;
  }
  if (error === "VALIDATION_ERROR") {
    return "Revise os dados do formulario e tente novamente.";
  }
  return "Nao foi possivel gerar o simulado.";
}

export function SimulationGenerateForm({
  subjectFields,
}: SimulationGenerateFormProps) {
  const router = useRouter();
  const formId = useId();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SimulationGenerationInput>({
    resolver: zodResolver(simulationGenerationInputSchema),
    defaultValues,
  });
  const selectedSubjectFieldIds = form.watch("subjectFieldIds");

  function toggleSubjectField(subjectFieldId: string, checked: boolean) {
    const nextIds = checked
      ? [...selectedSubjectFieldIds, subjectFieldId]
      : selectedSubjectFieldIds.filter((id) => id !== subjectFieldId);

    form.setValue("subjectFieldIds", nextIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: SimulationGenerationInput) {
    setError(null);

    const response = await fetch("/api/student/simulated-exams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setError(messageForError(payload.error, payload.metadata));
      return;
    }

    router.push(`/app/student/simulados/${payload.attempt.id}`);
    router.refresh();
  }

  if (subjectFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma grande area possui questoes disponiveis no momento.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertIcon />
          <div>
            <AlertTitle>Falha ao gerar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <Label>Grandes areas</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {subjectFields.map((subjectField) => {
            const inputId = `${formId}-${subjectField.id}`;
            const checked = selectedSubjectFieldIds.includes(subjectField.id);

            return (
              <Label
                key={subjectField.id}
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <Input
                  id={inputId}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={checked}
                  onChange={(event) =>
                    toggleSubjectField(subjectField.id, event.target.checked)
                  }
                />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: subjectField.colorHex }}
                    />
                    {subjectField.title}
                  </span>
                  <span className="block text-muted-foreground">
                    {subjectField._count.questions} questoes disponiveis
                  </span>
                </span>
              </Label>
            );
          })}
        </div>
        {form.formState.errors.subjectFieldIds ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.subjectFieldIds.message}
          </p>
        ) : null}
      </div>

      <div className="max-w-48 space-y-2">
        <Label htmlFor={`${formId}-question-count`}>Quantidade</Label>
        <Input
          id={`${formId}-question-count`}
          type="number"
          min={1}
          max={100}
          aria-invalid={Boolean(form.formState.errors.questionCount)}
          {...form.register("questionCount")}
        />
        {form.formState.errors.questionCount ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.questionCount.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Gerando..." : "Gerar simulado"}
      </Button>
    </form>
  );
}
