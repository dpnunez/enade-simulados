import { Prisma, type Role } from "@prisma-generated-client";

import { prisma } from "@infra/db/prisma";

import {
  adminUsersQuerySchema,
  type AdminUsersQuery,
  type ParsedAdminUsersQuery,
} from "./admin-user.schema";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AdminUsersPage {
  rows: AdminUserRow[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function buildOrderBy(
  input: ParsedAdminUsersQuery,
): Prisma.UserOrderByWithRelationInput[] {
  return [{ [input.sort]: input.direction }, { id: "asc" }];
}

export async function listAdminUsers(
  input: AdminUsersQuery,
): Promise<AdminUsersPage> {
  const parsed = adminUsersQuerySchema.parse(input);
  const skip = (parsed.page - 1) * parsed.pageSize;

  const [users, rowCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: buildOrderBy(parsed),
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      skip,
      take: parsed.pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    rows: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    rowCount,
    page: parsed.page,
    pageSize: parsed.pageSize,
    pageCount: Math.ceil(rowCount / parsed.pageSize),
  };
}
