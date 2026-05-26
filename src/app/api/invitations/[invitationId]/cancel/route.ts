import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import { InvitationDomainError, cancelInvitation } from "@/features/invitations/invitation.service";

export async function POST(
  _request: Request,
  context: RouteContext<'/api/invitations/[invitationId]/cancel'>,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!hasRole(session, "ADMIN")) {
    return Response.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { invitationId } = await context.params;

  try {
    const invitation = await cancelInvitation({ invitationId });
    return Response.json({ success: true, invitation });
  } catch (error) {
    if (error instanceof InvitationDomainError) {
      return Response.json({ success: false, error: error.code }, { status: 409 });
    }
    throw error;
  }
}
