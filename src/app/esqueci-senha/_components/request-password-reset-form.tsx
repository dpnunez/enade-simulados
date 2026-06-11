"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, CircleAlert, Mail } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { HTTPError } from "ky";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/features/password-reset/password-reset.schema";
import { http } from "@infra/http/client";

type PasswordResetRequestResponse = {
  success?: boolean;
  message?: string;
};

type PasswordResetErrorResponse = {
  message?: string;
};

function getPasswordResetErrorMessage(
  requestError: HTTPError,
  payload: PasswordResetErrorResponse | null,
) {
  if (requestError.response.status === 400) {
    return "Informe um email válido.";
  }

  return payload?.message || "Não foi possível solicitar a redefinição agora.";
}

export function RequestPasswordResetForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    setError(null);
    setSuccess(null);

    try {
      const payload = await http
        .post("password-reset/request", {
          json: values,
        })
        .json<PasswordResetRequestResponse>();

      if (!payload.success) {
        setError("Não foi possível solicitar a redefinição agora.");
        return;
      }
    } catch (requestError) {
      if (requestError instanceof HTTPError) {
        const payload = await requestError.response
          .json<PasswordResetErrorResponse>()
          .catch(() => null);

        setError(getPasswordResetErrorMessage(requestError, payload));
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível solicitar a redefinição agora.",
      );
      return;
    }

    form.reset({ email: "" });
    setSuccess(
      "Se o email estiver cadastrado, enviaremos um link de redefinição.",
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Falha ao solicitar redefinição</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <div>
            <AlertTitle>Verifique seu email</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <FieldGroup className="gap-4">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Mail aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="seu.email@instituicao.edu.br"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid
                      ? "password-reset-email-error"
                      : undefined
                  }
                />
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError
                  id="password-reset-email-error"
                  errors={[fieldState.error]}
                />
              ) : null}
            </Field>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Enviando..."
            : "Enviar e-mail de redefinição"}
          {!form.formState.isSubmitting ? (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          ) : null}
        </Button>
      </FieldGroup>
    </form>
  );
}
