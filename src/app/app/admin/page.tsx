import { requireRole } from "@auth/session";
import { prisma } from "@infra/db/prisma";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPendingInvitations } from "@/features/invitations/invitation.service";

import { InvitationsTable } from "./_components/invitations-table";
import { InviteForm } from "./_components/invite-form";

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    listPendingInvitations(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Convidar usuário</CardTitle>
          <CardDescription>Envie convites para STUDENT e TEACHER.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <InvitationsTable invitations={invitations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{user.name || user.email}</p>
                  <p className="text-muted-foreground">
                    {user.email} • {user.role} • {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
