"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
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
  confirmPasswordResetSchema,
  type ConfirmPasswordResetInput,
} from "@/features/password-reset/password-reset.schema";

type Props = {
  token: string;
};

export function ConfirmPasswordResetForm({ token }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm<ConfirmPasswordResetInput>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: {
      token,
      password: "",
      passwordConfirmation: "",
    },
  });

  async function onSubmit(values: ConfirmPasswordResetInput) {
    setError(null);

    const response = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setError("Este link não está mais disponível. Solicite uma nova redefinição.");
      return;
    }

    form.reset({
      token,
      password: "",
      passwordConfirmation: "",
    });
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <AlertTitle>Senha redefinida</AlertTitle>
            <AlertDescription>
              Use sua nova senha para entrar novamente.
            </AlertDescription>
          </div>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/login">
            Ir para o login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertIcon />
          <div>
            <AlertTitle>Falha ao redefinir senha</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <input type="hidden" {...form.register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password-reset-password">Nova senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password-reset-password"
            type="password"
            autoComplete="new-password"
            className="pl-9"
            {...form.register("password")}
          />
        </div>
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password-reset-confirmation">Confirmar senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password-reset-confirmation"
            type="password"
            autoComplete="new-password"
            className="pl-9"
            {...form.register("passwordConfirmation")}
          />
        </div>
        {form.formState.errors.passwordConfirmation ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.passwordConfirmation.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Salvando..." : "Salvar nova senha"}
        {!form.formState.isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
