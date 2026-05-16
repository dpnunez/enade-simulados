import Link from "next/link";
import { ArrowRight, LogIn, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16">
      <Card className="w-full overflow-hidden">
        <CardHeader className="space-y-4 bg-gradient-to-br from-primary/5 via-background to-background sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              shadcn pronto
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Auth por role
            </Badge>
          </div>

          <CardTitle className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            ENADE ENG
          </CardTitle>
          <CardDescription className="max-w-2xl text-base sm:text-lg">
            MVP com autenticação por email e senha usando Better Auth, Prisma
            e um design system baseado em shadcn/ui.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 px-6 py-8 sm:grid-cols-[1.4fr_0.9fr] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              O que já está pronto
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Login com usuários seed determinísticos</li>
              <li>• Navegação protegida por sessão e por role</li>
              <li>• Base visual consistente com componentes reutilizáveis</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-muted/40 p-5">
            <p className="text-sm font-medium">Atalhos</p>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <Button asChild className="justify-between">
                <Link href="/login">
                  Ir para login
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/app">
                  Ir para área privada
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 sm:px-8">
          <p className="text-xs text-muted-foreground">
            Layout inicial preparado para crescer sem perder consistência.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
