"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

type Props = { invitations: InvitationItem[] };

export function InvitationsTable({ invitations }: Props) {
  const [items, setItems] = useState(invitations);

  async function cancel(invitationId: string) {
    const response = await fetch(`/api/invitations/${invitationId}/cancel`, { method: "POST" });
    const payload = await response.json();
    if (response.ok && payload.success) {
      setItems((current) => current.filter((invite) => invite.id !== invitationId));
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((invite) => (
        <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
          <div className="text-sm">
            <p className="font-medium">{invite.email}</p>
            <p className="text-muted-foreground">
              {invite.role} • {invite.status} • {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => cancel(invite.id)}>
            Cancelar
          </Button>
        </div>
      ))}
    </div>
  );
}
