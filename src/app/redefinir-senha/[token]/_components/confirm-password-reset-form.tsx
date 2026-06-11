"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  confirmPasswordResetSchema,
  type ConfirmPasswordResetInput,
} from "@/features/password-reset/password-reset.schema";
import { http } from "@infra/http/client";

import { PasswordRequirements } from "./password-requirements";

type Props = {
  token: string;
};

type PasswordResetConfirmResponse = {
  success?: boolean;
};

type PasswordResetErrorResponse = {
  message?: string;
};

function getPasswordResetErrorMessage(
  requestError: HTTPError,
  payload: PasswordResetErrorResponse | null,
) {
  if (requestError.response.status === 400) {
    return "Este link não está mais disponível. Solicite uma nova redefinição.";
  }

  return payload?.message || "Não foi possível redefinir a senha agora.";
}

export function ConfirmPasswordResetForm({ token }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const form = useForm<ConfirmPasswordResetInput>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: {
      token,
      password: "",
      passwordConfirmation: "",
    },
  });
  const passwordValue = useWatch({
    control: form.control,
    name: "password",
  });

  async function onSubmit(values: ConfirmPasswordResetInput) {
    setError(null);

    try {
      const payload = await http
        .post("password-reset/confirm", {
          json: values,
        })
        .json<PasswordResetConfirmResponse>();

      if (!payload.success) {
        setError("Não foi possível redefinir a senha agora.");
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
          : "Não foi possível redefinir a senha agora.",
      );
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Falha ao redefinir senha</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <input type="hidden" {...form.register("token")} />

      <FieldGroup className="gap-5">
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nova senha</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Lock aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite uma senha segura"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid
                      ? "password-requirements password-reset-password-error"
                      : "password-requirements"
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                    }
                    onClick={() =>
                      setIsPasswordVisible((isVisible) => !isVisible)
                    }
                  >
                    {isPasswordVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError
                  id="password-reset-password-error"
                  errors={[fieldState.error]}
                />
              ) : null}
            </Field>
          )}
        />

        <PasswordRequirements
          id="password-requirements"
          password={passwordValue ?? ""}
        />

        <Controller
          name="passwordConfirmation"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirmar senha</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Lock aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={isConfirmationVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid
                      ? "password-reset-confirmation-error"
                      : undefined
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      isConfirmationVisible
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    onClick={() =>
                      setIsConfirmationVisible((isVisible) => !isVisible)
                    }
                  >
                    {isConfirmationVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError
                  id="password-reset-confirmation-error"
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
          {form.formState.isSubmitting ? "Salvando..." : "Salvar nova senha"}
          {!form.formState.isSubmitting ? (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          ) : null}
        </Button>
      </FieldGroup>
    </form>
  );
}
