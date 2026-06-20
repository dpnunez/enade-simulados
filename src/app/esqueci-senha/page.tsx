import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { RequestPasswordResetForm } from "./_components/request-password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-6 py-12">
      <Card className="w-full border-0 shadow-lg shadow-foreground/5 ring-1 ring-border/80">
        <CardHeader className="space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              Recuperação de acesso
            </p>
            <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          </div>
          <CardDescription>
            Informe o email usado na plataforma. Se ele estiver cadastrado,
            enviaremos um link seguro para você criar uma nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RequestPasswordResetForm />
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 border-t text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>O link expira por segurança e pode ser usado apenas uma vez.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
