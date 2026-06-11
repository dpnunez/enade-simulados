import { CircleAlert, UserRoundCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InvitationDomainError,
  resolveInvitationToken,
} from "@/features/invitations/invitation.service";

import { AcceptInviteForm } from "./_components/accept-invite-form";

export default async function InviteTokenPage({ params }: PageProps<"/convites/[token]">) {
  const { token } = await params;
  const invitation = await getInvitationOrNull(token);

  if (invitation) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-6 py-12">
        <Card className="w-full">
          <CardHeader className="gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted">
              <UserRoundCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <CardTitle>Finalize seu cadastro</CardTitle>
              <CardDescription>
                Seu convite foi encontrado. Confirme os dados abaixo e escolha
                como você quer acessar a plataforma.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AcceptInviteForm token={token} email={invitation.email} role={invitation.role} />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted">
            <CircleAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle>Convite inválido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este convite não está mais disponível. O link pode ter expirado, já
            ter sido usado ou cancelado. Peça para a coordenação enviar um novo
            convite.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

async function getInvitationOrNull(token: string) {
  try {
    return await resolveInvitationToken(token);
  } catch (error) {
    if (error instanceof InvitationDomainError) return null;
    throw error;
  }
}
