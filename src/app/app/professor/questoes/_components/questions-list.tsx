"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionListItem } from "@/features/questions/question.service";

type QuestionsListProps = {
  questions: QuestionListItem[];
};

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

function formatDate(date: Date) {
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

  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trim()}...`;
}

function metadata(question: QuestionListItem) {
  const values: string[] = [difficultyLabel[question.difficulty]];

  if (question.source) values.push(sourceLabel[question.source]);
  if (question.year) values.push(String(question.year));

  return values;
}

function correctAlternativeSummary(question: QuestionListItem) {
  const correctCount = question.alternatives.filter((alternative) => alternative.isCorrect).length;

  if (correctCount === 1) return "1 correta definida";
  return `${correctCount} corretas definidas`;
}

function deleteErrorMessage(error: string) {
  if (error === "QUESTION_NOT_FOUND") {
    return "Esta questao nao foi encontrada. Atualize a lista e tente novamente.";
  }

  return "Nao foi possivel deletar a questao.";
}

export function QuestionsList({ questions }: QuestionsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(questions);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteQuestion(questionId: string) {
    setDeletingId(questionId);
    setDeleteError(null);

    const response = await fetch(`/api/questions/${questionId}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    setDeletingId(null);

    if (!response.ok || !payload.success) {
      setDeleteError(deleteErrorMessage(payload.error));
      return;
    }

    setItems((current) => current.filter((question) => question.id !== questionId));
    setConfirmingDeleteId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Nenhuma questao cadastrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((question) => {
        const isConfirmingDelete = confirmingDeleteId === question.id;
        const isDeleting = deletingId === question.id;

        return (
          <Card key={question.id} className="rounded-md">
            <CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="break-words text-lg">
                    {question.subjectField.title}
                  </CardTitle>
                  {metadata(question).map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
                <p className="break-words text-sm text-muted-foreground">
                  {plainPreview(question.descriptionMarkdown)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild type="button" size="sm" variant="outline">
                  <Link href={`/app/professor/questoes/${question.id}`}>
                    <Pencil aria-hidden="true" />
                    Editar
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmingDeleteId(question.id);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Deletar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{question.alternatives.length} alternativas</span>
                <span aria-hidden="true">·</span>
                <span>{correctAlternativeSummary(question)}</span>
                <span aria-hidden="true">·</span>
                <span>Atualizada em {formatDate(question.updatedAt)}</span>
              </div>

              {deleteError && isConfirmingDelete ? (
                <Alert variant="destructive" role="alert">
                  <AlertIcon />
                  <div>
                    <AlertTitle>Falha ao deletar</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                  </div>
                </Alert>
              ) : null}

              {isConfirmingDelete ? (
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
                      disabled={isDeleting}
                      onClick={() => deleteQuestion(question.id)}
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
