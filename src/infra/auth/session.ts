import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@auth/server";
import type { Role } from "@prisma-generated-client";
import { hasRole } from "./authorization";

const ROLE_HOME_PATHS = {
  ADMIN: "/app/admin",
  STUDENT: "/app/student",
  TEACHER: "/app/teacher",
} as const satisfies Record<Role, string>;

export function getRoleHomePath(role: Role) {
  return ROLE_HOME_PATHS[role];
}

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

  if (!hasRole(session, role)) {
    redirect(getRoleHomePath(session.user.role as Role));
  }

  return session;
}
