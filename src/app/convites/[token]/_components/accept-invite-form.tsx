"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
  acceptInvitationSchema,
  type AcceptInvitationInput,
} from "@/features/invitations/invitation.schema";

type Props = { token: string; email: string; role: string };
type FormValues = AcceptInvitationInput;

export function AcceptInviteForm({ token, email, role }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { token, name: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      if (payload.error === "NAME_ALREADY_REGISTERED") {
        form.setError("name", { message: "Este nick já está em uso." });
        setError("Este nick já está em uso.");
        return;
      }
      setError("Não foi possível concluir seu cadastro com este convite.");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertIcon />
          <div>
            <AlertTitle>Falha no cadastro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" value={email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Papel</Label>
        <Input id="invite-role" value={role} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nick</Label>
        <Input id="name" autoComplete="username" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button
        data-testid="accept-invite-button"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Finalizando..." : "Concluir cadastro"}
      </Button>
    </form>
  );
}
