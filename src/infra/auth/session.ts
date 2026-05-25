import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@auth/server";
import type { Role } from "@prisma-generated-client";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect("/app");
  }

  return session;
}
