import { redirect } from "next/navigation";

import { getCurrentSession, getRoleHomePath } from "@auth/session";
import type { Role } from "@prisma-generated-client";

export default async function Home() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getRoleHomePath(session.user.role as Role));
}
