"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { signIn } from "@auth/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu email.")
    .email("Informe um email válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);

    const response = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (response.error) {
      setError(response.error.message || "Falha ao autenticar.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <section className="flex min-h-[560px] items-center">
      <Card className="w-full overflow-visible border-0 px-4 py-8 shadow-none ring-0 sm:px-8">
        <CardHeader className="space-y-3 px-0">
          <Image
            src="/logo-eng.png"
            alt="Engenharia de Produção UFPel"
            width={220}
            height={48}
            priority
            className="mx-auto h-auto w-44 object-contain sm:w-52"
          />
          <CardTitle className="text-3xl">Entrar</CardTitle>
          <CardDescription>
            Informe suas credenciais para acessar sua área na plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-0">
          {error ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <div>
                <AlertTitle>Não foi possível entrar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu.email@instituicao.edu.br"
                  className="pl-9"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  aria-describedby={
                    form.formState.errors.email ? "email-error" : undefined
                  }
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="pl-9"
                  aria-invalid={Boolean(form.formState.errors.password)}
                  aria-describedby={
                    form.formState.errors.password
                      ? "password-error"
                      : undefined
                  }
                  {...form.register("password")}
                />
              </div>
              <div className="flex justify-end">
                <Link
                  href="/esqueci-senha"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              {form.formState.errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
              {!form.formState.isSubmitting ? (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              ) : null}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="px-0 pt-2">
          <p className="text-sm text-muted-foreground">
            Em caso de dificuldade no acesso, solicite suporte à coordenação do
            curso.
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
