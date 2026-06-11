import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { RequestPasswordResetForm } from "./_components/request-password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-3">
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Informe o email usado na sua conta para receber o link de
            redefinição.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RequestPasswordResetForm />
          <Button asChild variant="ghost" className="px-0">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
