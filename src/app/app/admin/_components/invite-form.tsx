"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvitationSchema, type CreateInvitationInput } from "@/features/invitations/invitation.schema";

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: "", role: "STUDENT" },
  });

  async function onSubmit(values: CreateInvitationInput) {
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      if (payload.error === "EMAIL_ALREADY_REGISTERED") setError("Este email já possui uma conta ativa.");
      else if (payload.error === "PENDING_INVITATION_EXISTS") setError("Já existe um convite pendente para este email.");
      else if (payload.error === "VALIDATION_ERROR") setError("Revise os dados do formulário e tente novamente.");
      else setError("Não foi possível criar o convite.");
      return;
    }

    form.reset({ email: "", role: values.role });
    setSuccess("Convite criado com sucesso.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <div>
            <AlertTitle>Falha ao criar convite</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <div>
            <AlertTitle>Convite enviado</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </div>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" type="email" placeholder="teacher@enade.local" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Papel</Label>
        <select
          id="invite-role"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          {...form.register("role")}
        >
          <option value="STUDENT">STUDENT</option>
          <option value="TEACHER">TEACHER</option>
        </select>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enviando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
