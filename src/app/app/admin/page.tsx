import { redirect } from "next/navigation";

import { requireRole } from "@auth/session";

export default async function AdminPage() {
  await requireRole("ADMIN");
  redirect("/app/admin/usuarios");
}
