import { requireRole } from "@auth/session";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { UsersTable } from "./_components/users-table";

export default async function AdminUsersPage() {
  await requireRole("ADMIN");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários cadastrados</CardTitle>
        <CardDescription>
          Consulte contas ativas por email, papel e data de criação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
