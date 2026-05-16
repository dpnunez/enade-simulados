import type { Role } from "@prisma-generated-client";

export const ROLES = {
  ADMIN: "ADMIN",
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
} as const satisfies Record<Role, Role>;
