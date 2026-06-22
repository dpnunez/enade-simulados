"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  LoaderCircle,
  Mail,
  Send,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from "@/features/invitations/invitation.schema";
import { http } from "@infra/http/client";

type CreateInvitationResponse = {
  success?: boolean;
  error?: string;
};

function getCreateInvitationErrorMessage(errorCode?: string, status?: number) {
  if (errorCode === "EMAIL_ALREADY_REGISTERED") {
    return "Este email já possui uma conta ativa.";
  }

  if (errorCode === "PENDING_INVITATION_EXISTS") {
    return "Já existe um convite pendente para este email.";
  }

  if (errorCode === "VALIDATION_ERROR" || status === 400) {
    return "Revise os dados do formulário e tente novamente.";
  }

  if (errorCode === "UNAUTHORIZED" || status === 401) {
    return "Sua sessão não tem permissão para enviar convites.";
  }

  return "Não foi possível criar o convite.";
}

type InviteFormProps = {
  onCreated?: () => void | Promise<void>;
};

export function InviteForm({ onCreated }: InviteFormProps) {
  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: "", role: "STUDENT" },
  });

  async function onSubmit(values: CreateInvitationInput) {
    try {
      const payload = await http
        .post("invitations", {
          json: values,
          throwHttpErrors: false,
        })
        .json<CreateInvitationResponse>();

      if (!payload.success) {
        toast.error(getCreateInvitationErrorMessage(payload.error));
        return;
      }
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível criar o convite.",
        {
          description:
            "Se o problema continuar, atualize a página e tente novamente.",
        },
      );
      return;
    }

    form.reset({ email: "", role: values.role });
    await onCreated?.();
    toast.success("O convite foi enviado para o email informado.");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
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
                  placeholder="professor@instituicao.edu.br"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "invite-email-error" : "invite-email-help"
                  }
                />
              </InputGroup>
              <FieldDescription id="invite-email-help">
                O convidado receberá um link para criar nick e senha.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError id="invite-email-error" errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="role"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Papel</FieldLabel>
              <div className="relative">
                <GraduationCap
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <select
                  {...field}
                  id={field.name}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "invite-role-error" : "invite-role-help"
                  }
                >
                  <option value="STUDENT">Aluno</option>
                  <option value="TEACHER">Professor</option>
                </select>
              </div>
              <FieldDescription id="invite-role-help">
                Escolha o perfil inicial de acesso à plataforma.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError id="invite-role-error" errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {form.formState.isSubmitting ? "Enviando..." : "Enviar convite"}
        </Button>
      </FieldGroup>
    </form>
  );
}
