"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "../../_components/invite-form";
import {
  INVITATIONS_QUERY_KEY,
  InvitationsTable,
} from "./invitations-table";

export function AdminInvitationsClient() {
  const queryClient = useQueryClient();
  const [refreshVersion, setRefreshVersion] = useState(0);

  async function refreshInvitations() {
    setRefreshVersion((current) => current + 1);
    await queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Convidar usuário</CardTitle>
          <CardDescription>
            Envie convites para alunos e professores acessarem a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm onCreated={refreshInvitations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites pendentes</CardTitle>
          <CardDescription>
            Acompanhe convites em aberto e cancele acessos que não devem mais ser usados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationsTable refreshSignal={refreshVersion} />
        </CardContent>
      </Card>
    </div>
  );
}
