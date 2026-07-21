"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import {
  questionInputSchema,
  type QuestionInput,
} from "@/features/questions/question.schema";
import type { QuestionEditable } from "@/features/questions/question.service";
import { cn } from "@/lib/utils";
import { uploadQuestionMarkdownImage } from "./question-image-upload";

export type QuestionSubjectFieldOption = {
  id: string;
  title: string;
};

type SavedQuestion = QuestionEditable;

type QuestionFormProps = {
  subjectFields: QuestionSubjectFieldOption[];
  question?: QuestionEditable;
  onSaved?: (question: SavedQuestion) => void;
  onCancel?: () => void;
  afterSaveHref?: string;
  className?: string;
};

const emptyAlternative = {
  contentMarkdown: "",
  isCorrect: false,
};

const emptyValues: QuestionInput = {
  descriptionMarkdown: "",
  difficulty: "MEDIUM",
  source: null,
  year: null,
  subjectFieldId: "",
  correctAnswerExplanation: null,
  alternatives: [
    { ...emptyAlternative, isCorrect: true },
    emptyAlternative,
    emptyAlternative,
    emptyAlternative,
    emptyAlternative,
  ],
};

function valuesFromQuestion(question: QuestionEditable | undefined): QuestionInput {
  if (!question) return emptyValues;

  return {
    descriptionMarkdown: question.descriptionMarkdown,
    difficulty: question.difficulty,
    source: question.source,
    year: question.year,
    subjectFieldId: question.subjectFieldId,
    correctAnswerExplanation: question.correctAnswerExplanation,
    alternatives: question.alternatives.map((alternative) => ({
      contentMarkdown: alternative.contentMarkdown,
      isCorrect: alternative.isCorrect,
    })),
  };
}

function messageForError(error: string) {
  if (error === "QUESTION_SUBJECT_FIELD_NOT_FOUND") {
    return "A grande area selecionada nao foi encontrada. Atualize a lista e tente novamente.";
  }
  if (error === "QUESTION_NOT_FOUND") {
    return "Esta questao nao foi encontrada. Volte para a lista e tente novamente.";
  }
  if (error === "QUESTION_DUPLICATE_CONTENT") {
    return "Ja existe uma questao com este enunciado.";
  }
  if (error === "QUESTION_RELATION_IN_USE") {
    return "Esta questao ja possui respostas vinculadas. Edite sem remover alternativas ja usadas.";
  }
  if (error === "VALIDATION_ERROR") {
    return "Revise os dados da questao e tente novamente.";
  }
  return "Nao foi possivel salvar a questao.";
}

function alternativeLabel(index: number) {
  return `Alternativa ${String.fromCharCode(65 + index)}`;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function QuestionForm({
  subjectFields,
  question,
  onSaved,
  onCancel,
  afterSaveHref,
  className,
}: QuestionFormProps) {
  const router = useRouter();
  const formId = useId();
  const isEditing = Boolean(question);
  const descriptionDraftRef = useRef(valuesFromQuestion(question).descriptionMarkdown);
  const [descriptionResetKey, setDescriptionResetKey] = useState(0);
  const form = useForm<QuestionInput>({
    resolver: zodResolver(questionInputSchema),
    defaultValues: valuesFromQuestion(question),
  });
  const alternatives = useFieldArray({
    control: form.control,
    name: "alternatives",
  });

  useEffect(() => {
    const nextValues = valuesFromQuestion(question);
    descriptionDraftRef.current = nextValues.descriptionMarkdown;
    form.reset(nextValues);
    setDescriptionResetKey((current) => current + 1);
  }, [form, question]);

  function syncDescriptionDraft() {
    form.setValue("descriptionMarkdown", descriptionDraftRef.current, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  }

  function markCorrect(index: number) {
    alternatives.fields.forEach((_, alternativeIndex) => {
      form.setValue(`alternatives.${alternativeIndex}.isCorrect`, alternativeIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  function addAlternative() {
    if (alternatives.fields.length >= 8) return;
    alternatives.append(emptyAlternative);
  }

  function removeAlternative(index: number) {
    if (alternatives.fields.length <= 2) return;
    const removedWasCorrect = form.getValues(`alternatives.${index}.isCorrect`);
    alternatives.remove(index);
    if (removedWasCorrect) {
      const nextIndex = index === 0 ? 0 : index - 1;
      window.setTimeout(() => markCorrect(nextIndex));
    }
  }

  async function onSubmit(values: QuestionInput) {
    try {
      const response = await fetch(
        isEditing ? `/api/questions/${question?.id}` : "/api/questions",
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
        isEditing ? "Questao atualizada com sucesso." : "Questao criada com sucesso.",
      );
      if (!isEditing) {
        descriptionDraftRef.current = emptyValues.descriptionMarkdown;
        form.reset(emptyValues);
        setDescriptionResetKey((current) => current + 1);
      }
      onSaved?.(payload.question);
      if (afterSaveHref) {
        router.push(afterSaveHref);
      }
      router.refresh();
    } catch {
      toast.error("Nao foi possivel salvar a questao.");
      return;
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    syncDescriptionDraft();
    void form.handleSubmit(onSubmit)(event);
  }

  if (subjectFields.length === 0) {
    return (
      <Alert role="status">
        <Info aria-hidden="true" />
        <div>
          <AlertTitle>Nenhuma grande area cadastrada</AlertTitle>
          <AlertDescription>
            Cadastre uma grande area antes de criar questoes.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className={cn("space-y-6", className)}>
      <FormSection
        title="Enunciado"
        description="Escreva o texto principal da questao. Markdown e upload de imagem continuam disponiveis."
      >
        <div className="space-y-2">
          <Label htmlFor={`${formId}-description`}>Texto da questao</Label>
          <Controller
            control={form.control}
            name="descriptionMarkdown"
            render={({ field }) => (
              <MarkdownEditor
                value={field.value}
                onChange={(value) => {
                  descriptionDraftRef.current = value;
                }}
                onBlur={syncDescriptionDraft}
                imageUploadHandler={uploadQuestionMarkdownImage}
                resetKey={descriptionResetKey}
                ariaLabel="Enunciado da questao"
                className={cn(
                  form.formState.errors.descriptionMarkdown &&
                    "border-destructive focus-within:ring-2 focus-within:ring-destructive/30",
                )}
              />
            )}
          />
          {form.formState.errors.descriptionMarkdown ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.descriptionMarkdown.message}
            </p>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Metadados"
        description="Classifique a questao para facilitar listagem, filtros e simulados."
      >
        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-subject-field`}>Grande area</Label>
          <select
            id={`${formId}-subject-field`}
            aria-invalid={Boolean(form.formState.errors.subjectFieldId)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("subjectFieldId")}
          >
            <option value="">Selecione</option>
            {subjectFields.map((subjectField) => (
              <option key={subjectField.id} value={subjectField.id}>
                {subjectField.title}
              </option>
            ))}
          </select>
          {form.formState.errors.subjectFieldId ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.subjectFieldId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-difficulty`}>Dificuldade</Label>
          <select
            id={`${formId}-difficulty`}
            aria-invalid={Boolean(form.formState.errors.difficulty)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("difficulty")}
          >
            <option value="EASY">Facil</option>
            <option value="MEDIUM">Media</option>
            <option value="HARD">Dificil</option>
          </select>
          {form.formState.errors.difficulty ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.difficulty.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-source`}>Fonte</Label>
          <select
            id={`${formId}-source`}
            aria-invalid={Boolean(form.formState.errors.source)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("source")}
          >
            <option value="">Sem fonte</option>
            <option value="ENADE">ENADE</option>
            <option value="MANUAL">Manual</option>
            <option value="ADAPTED">Adaptada</option>
            <option value="OTHER">Outra</option>
          </select>
          {form.formState.errors.source ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.source.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-year`}>Ano</Label>
          <Input
            id={`${formId}-year`}
            inputMode="numeric"
            placeholder="2026"
            aria-invalid={Boolean(form.formState.errors.year)}
            {...form.register("year")}
          />
          {form.formState.errors.year ? (
            <p className="text-sm text-destructive">{form.formState.errors.year.message}</p>
          ) : null}
        </div>
        </div>
      </FormSection>

      <FormSection
        title="Explicacao"
        description="Registre a justificativa que ajuda a revisar a resposta correta."
      >
        <div className="space-y-2">
          <Label htmlFor={`${formId}-explanation`}>Explicacao da resposta correta</Label>
          <textarea
            id={`${formId}-explanation`}
            rows={4}
            placeholder="Explique por que a alternativa correta resolve a questao."
            aria-invalid={Boolean(form.formState.errors.correctAnswerExplanation)}
            className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("correctAnswerExplanation")}
          />
          {form.formState.errors.correctAnswerExplanation ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.correctAnswerExplanation.message}
            </p>
          ) : null}
        </div>
      </FormSection>

      <fieldset className="space-y-4 rounded-md border p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <legend className="text-base font-medium">Alternativas</legend>
            <p className="text-sm text-muted-foreground">
              Marque exatamente uma correta. Voce pode adicionar, remover e reordenar.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAlternative}
            disabled={alternatives.fields.length >= 8}
          >
            <Plus aria-hidden="true" />
            Adicionar
          </Button>
        </div>
        {typeof form.formState.errors.alternatives?.message === "string" ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.alternatives.message}
          </p>
        ) : null}

        <div className="space-y-3">
          {alternatives.fields.map((alternative, index) => {
            const alternativeError = form.formState.errors.alternatives?.[index];

            return (
              <div key={alternative.id} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${formId}-alternative-${index}`}>
                      {alternativeLabel(index)}
                    </Label>
                    <textarea
                      id={`${formId}-alternative-${index}`}
                      rows={3}
                      placeholder="Texto da alternativa em markdown."
                      aria-invalid={Boolean(alternativeError?.contentMarkdown)}
                      className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register(`alternatives.${index}.contentMarkdown`)}
                    />
                    {alternativeError?.contentMarkdown ? (
                      <p className="text-sm text-destructive">
                        {alternativeError.contentMarkdown.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:max-w-56">
                    <Button
                      type="button"
                      variant={
                        form.watch(`alternatives.${index}.isCorrect`)
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => markCorrect(index)}
                    >
                      {form.watch(`alternatives.${index}.isCorrect`)
                        ? "Correta selecionada"
                        : "Marcar correta"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Mover ${alternativeLabel(index)} para cima`}
                      disabled={index === 0}
                      onClick={() => alternatives.move(index, index - 1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Mover ${alternativeLabel(index)} para baixo`}
                      disabled={index === alternatives.fields.length - 1}
                      onClick={() => alternatives.move(index, index + 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      aria-label={`Remover ${alternativeLabel(index)}`}
                      disabled={alternatives.fields.length <= 2}
                      onClick={() => removeAlternative(index)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Salvando..."
            : isEditing
              ? "Salvar alteracoes"
              : "Criar questao"}
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
