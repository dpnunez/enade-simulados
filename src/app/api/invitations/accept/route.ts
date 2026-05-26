import { acceptInvitationSchema } from "@/features/invitations/invitation.schema";
import { InvitationDomainError, acceptInvitation } from "@/features/invitations/invitation.service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = acceptInvitationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ success: false, error: "VALIDATION_ERROR", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await acceptInvitation(parsed.data);
    return Response.json({ success: true, user: result.user });
  } catch (error) {
    if (error instanceof InvitationDomainError) {
      return Response.json({ success: false, error: error.code }, { status: 409 });
    }
    throw error;
  }
}
