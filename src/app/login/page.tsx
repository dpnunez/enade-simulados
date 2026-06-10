"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CircleAlert, Mail, Lock } from "lucide-react";

import { signIn } from "@auth/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    const response = await signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    setPending(false);

    if (response.error) {
      setError(response.error.message || "Falha ao autenticar.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl">Entrar</CardTitle>
          <CardDescription>
            Use um dos usuários de seed para acessar a área privada.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <div>
                <AlertTitle>Falha ao autenticar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@enade.local"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/esqueci-senha"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
              {!pending ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter className="flex-col items-start gap-4 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Os usuários disponíveis no seed foram preparados para os testes.
          </p>
          <Button asChild variant="ghost" className="px-0">
            <Link href="/">
              Voltar para a home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
