"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { HTTPError } from "ky";
import { z } from "zod";

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
import { http } from "@infra/http/client";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu email.")
    .email("Informe um email válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginInput = z.infer<typeof loginSchema>;

type AuthErrorResponse = {
  message?: string;
};

function getLoginErrorMessage(
  requestError: HTTPError,
  authError: AuthErrorResponse | null,
) {
  if (requestError.response.status === 401) {
    return "Email ou senha inválidos.";
  }

  return authError?.message || "Falha ao autenticar.";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);

    try {
      await http.post("auth/sign-in/email", {
        json: {
          email: values.email,
          password: values.password,
        },
      });
    } catch (requestError) {
      if (requestError instanceof HTTPError) {
        const authError = await requestError.response
          .json<AuthErrorResponse>()
          .catch(() => null);

        setError(getLoginErrorMessage(requestError, authError));
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Falha ao autenticar.",
      );
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

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
                        placeholder="seu.email@instituicao.edu.br"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? "email-error" : undefined
                        }
                      />
                    </InputGroup>
                    {fieldState.invalid ? (
                      <FieldError
                        id="email-error"
                        errors={[fieldState.error]}
                      />
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
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? "password-error" : undefined
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
                        id="password-error"
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
                {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
                {!form.formState.isSubmitting ? (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                ) : null}
              </Button>
              <div className="flex justify-end">
                <Link
                  href="/esqueci-senha"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </FieldGroup>
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
