import { redirect } from "next/navigation";

import { getRoleHomePath, requireAuth } from "@auth/session";
import type { Role } from "@prisma-generated-client";

export default async function PrivateHomePage() {
  const session = await requireAuth();

  redirect(getRoleHomePath(session.user.role as Role));
}
