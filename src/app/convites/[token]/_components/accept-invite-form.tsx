"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { HTTPError } from "ky";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { PasswordRequirements } from "@/components/password-requirements";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
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
  acceptInvitationSchema,
  type AcceptInvitationInput,
} from "@/features/invitations/invitation.schema";
import { http } from "@infra/http/client";

type Props = { token: string; email: string; role: string };
type FormValues = AcceptInvitationInput;

type AcceptInvitationResponse = {
  success?: boolean;
  error?: string;
};

function getRoleLabel(role: string) {
  if (role === "TEACHER") return "Professor";
  if (role === "STUDENT") return "Aluno";
  return role;
}

function getInvitationErrorMessage(
  requestError: HTTPError,
  payload: AcceptInvitationResponse | null,
) {
  if (payload?.error === "NAME_ALREADY_REGISTERED") {
    return "Este nick já está em uso.";
  }

  if (payload?.error === "VALIDATION_ERROR" || requestError.response.status === 400) {
    return "Revise os dados do formulário e tente novamente.";
  }

  if (requestError.response.status === 409) {
    return "Este convite não está mais disponível.";
  }

  return "Não foi possível concluir seu cadastro com este convite.";
}

export function AcceptInviteForm({ token, email, role }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] =
    useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      token,
      name: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const passwordValue = useWatch({
    control: form.control,
    name: "password",
  });

  async function onSubmit(values: FormValues) {
    setError(null);

    try {
      const payload = await http
        .post("invitations/accept", {
          json: values,
        })
        .json<AcceptInvitationResponse>();

      if (!payload.success) {
        if (payload.error === "NAME_ALREADY_REGISTERED") {
          form.setError("name", { message: "Este nick já está em uso." });
        }

        setError("Não foi possível concluir seu cadastro com este convite.");
        return;
      }
    } catch (requestError) {
      if (requestError instanceof HTTPError) {
        const payload = await requestError.response
          .json<AcceptInvitationResponse>()
          .catch(() => null);
        const message = getInvitationErrorMessage(requestError, payload);

        if (payload?.error === "NAME_ALREADY_REGISTERED") {
          form.setError("name", { message });
        }

        setError(message);
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível concluir seu cadastro com este convite.",
      );
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Falha no cadastro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <input type="hidden" {...form.register("token")} />

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="invite-email">Email do convite</FieldLabel>
          <InputGroup data-disabled="true">
            <InputGroupAddon>
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput id="invite-email" value={email} disabled readOnly />
          </InputGroup>
          <FieldDescription>
            Este será o email usado para entrar na plataforma.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="invite-role">Perfil de acesso</FieldLabel>
          <InputGroup data-disabled="true">
            <InputGroupAddon>
              <GraduationCap aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="invite-role"
              value={getRoleLabel(role)}
              disabled
              readOnly
            />
          </InputGroup>
        </Field>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nick</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <User aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  autoComplete="username"
                  placeholder="Como voce quer aparecer na plataforma"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "invite-name-error" : "invite-name-help"
                  }
                />
              </InputGroup>
              <FieldDescription id="invite-name-help">
                Use de 3 a 30 caracteres. Letras, numeros, espacos, ponto,
                hifen e sublinhado sao permitidos.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError id="invite-name-error" errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
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
                      ? "invite-password-requirements invite-password-error"
                      : "invite-password-requirements"
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      isPasswordVisible
                        ? "Ocultar valor do campo"
                        : "Mostrar valor do campo"
                    }
                    onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
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
                  id="invite-password-error"
                  errors={[fieldState.error]}
                />
              ) : null}
            </Field>
          )}
        />

        <PasswordRequirements
          id="invite-password-requirements"
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
                  type={isPasswordConfirmationVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid
                      ? "invite-password-confirmation-error"
                      : undefined
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      isPasswordConfirmationVisible
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    onClick={() =>
                      setIsPasswordConfirmationVisible((isVisible) => !isVisible)
                    }
                  >
                    {isPasswordConfirmationVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError
                  id="invite-password-confirmation-error"
                  errors={[fieldState.error]}
                />
              ) : null}
            </Field>
          )}
        />

        <Button
          data-testid="accept-invite-button"
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          {form.formState.isSubmitting ? "Finalizando..." : "Concluir cadastro"}
        </Button>
      </FieldGroup>
    </form>
  );
}
