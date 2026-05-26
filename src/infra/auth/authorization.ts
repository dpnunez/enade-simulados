import type { Role } from "@prisma-generated-client";

type SessionWithRole = {
  user: {
    role: string;
  };
};

export function hasRole(session: SessionWithRole | null, role: Role) {
  if (!session) return false;
  return session.user.role === role;
}

export function hasAnyRole(session: SessionWithRole | null, roles: Role[]) {
  if (!session) return false;
  return roles.some((role) => role === session.user.role);
}
