import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";
import { adminUsersQuerySchema } from "@/features/admin-users/admin-user.schema";
import { listAdminUsers } from "@/features/admin-users/admin-user.service";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!hasRole(session, "ADMIN")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const parsed = adminUsersQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const users = await listAdminUsers(parsed.data);

  return Response.json({ success: true, ...users });
}
