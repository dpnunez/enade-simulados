import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

import { requireAuth } from "@auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "./logout-button";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sessão ativa
            </Badge>
            <CardTitle className="text-2xl">{session.user.email}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <UserRound className="h-4 w-4" />
              Role atual:
              <Badge variant="outline">{session.user.role}</Badge>
            </CardDescription>
          </div>

          <LogoutButton />
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />
          <nav className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/app">Base privada</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/admin">Admin</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/student">Student</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/teacher">Teacher</Link>
            </Button>
          </nav>
        </CardContent>
      </Card>

      <div>{children}</div>
    </div>
  );
}
