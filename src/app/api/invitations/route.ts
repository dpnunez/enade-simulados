import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";
import { prisma } from "@infra/db/prisma";

import { sendInvitationEmail } from "@/features/invitations/invitation-email.adapter";
import { createInvitationSchema } from "@/features/invitations/invitation.schema";
import {
  InvitationDomainError,
  createInvitation,
  listPendingInvitations,
} from "@/features/invitations/invitation.service";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!hasRole(session, "ADMIN")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    listPendingInvitations(),
  ]);

  return Response.json({ success: true, users, invitations });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!hasRole(session, "ADMIN")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = createInvitationSchema.safeParse(body);
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

  try {
    const { invitation, token } = await createInvitation(parsed.data);
    await sendInvitationEmail({
      email: invitation.email,
      role: invitation.role,
      token,
    });
    return Response.json({ success: true, invitation });
  } catch (error) {
    if (error instanceof InvitationDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: 409 },
      );
    }
    throw error;
  }
}
