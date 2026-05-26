import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationDomainError, resolveInvitationToken } from "@/features/invitations/invitation.service";

import { AcceptInviteForm } from "./_components/accept-invite-form";

export default async function InviteTokenPage({ params }: PageProps<"/convites/[token]">) {
  const { token } = await params;

  try {
    const invitation = await resolveInvitationToken(token);

    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Cadastro por convite</CardTitle>
          </CardHeader>
          <CardContent>
            <AcceptInviteForm token={token} email={invitation.email} role={invitation.role} />
          </CardContent>
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof InvitationDomainError) {
      return (
        <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Convite inválido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Este convite não está mais disponível.</p>
            </CardContent>
          </Card>
        </main>
      );
    }

    throw error;
  }
}
