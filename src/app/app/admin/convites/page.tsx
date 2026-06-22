import { requireRole } from "@auth/session";

import { AdminInvitationsClient } from "./_components/admin-invitations-client";

export default async function AdminInvitationsPage() {
  await requireRole("ADMIN");

  return <AdminInvitationsClient />;
}
