import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { connection } from "next/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PasswordResetDomainError,
  resolvePasswordResetToken,
} from "@/features/password-reset/password-reset.service";

import { ConfirmPasswordResetForm } from "./_components/confirm-password-reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: PageProps<"/redefinir-senha/[token]">) {
  await connection();

  const { token } = await params;
  const resetToken = await getPasswordResetTokenOrNull(token);

  if (resetToken) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-6 py-12">
        <Card className="w-full border-0 shadow-lg shadow-foreground/5 ring-1 ring-border/80">
          <CardHeader className="space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Nova senha</CardTitle>
            <CardDescription>
              Escolha uma senha forte para proteger sua conta e voltar a acessar
              a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmPasswordResetForm token={token} />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-3">
          <CardTitle>Link indisponível</CardTitle>
          <CardDescription>
            Este link de redefinição não está mais disponível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost" className="px-0">
            <Link href="/esqueci-senha">
              <ArrowLeft className="h-4 w-4" />
              Solicitar novo link
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

async function getPasswordResetTokenOrNull(token: string) {
  try {
    return await resolvePasswordResetToken(token);
  } catch (error) {
    if (error instanceof PasswordResetDomainError) return null;
    throw error;
  }
}
