import { confirmPasswordResetSchema } from "@/features/password-reset/password-reset.schema";
import {
  PasswordResetDomainError,
  confirmPasswordReset,
} from "@/features/password-reset/password-reset.service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = confirmPasswordResetSchema.safeParse(body);

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
    await confirmPasswordReset(parsed.data);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof PasswordResetDomainError) {
      return Response.json(
        {
          success: false,
          error: "PASSWORD_RESET_UNAVAILABLE",
        },
        { status: 400 },
      );
    }

    throw error;
  }
}
