import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import { sendInvitationEmail } from "@/features/invitations/invitation-email.adapter";
import {
  createInvitationSchema,
  invitationsQuerySchema,
} from "@/features/invitations/invitation.schema";
import {
  InvitationDomainError,
  createInvitation,
  listPendingInvitationsPage,
} from "@/features/invitations/invitation.service";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!hasRole(session, "ADMIN")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const parsed = invitationsQuerySchema.safeParse(
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

  const invitations = await listPendingInvitationsPage(parsed.data);

  return Response.json({ success: true, ...invitations });
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
