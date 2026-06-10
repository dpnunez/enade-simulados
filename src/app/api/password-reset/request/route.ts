import { requestPasswordResetSchema } from "@/features/password-reset/password-reset.schema";
import { requestPasswordReset } from "@/features/password-reset/password-reset.service";

const PASSWORD_RESET_REQUEST_MESSAGE =
  "Se o email estiver cadastrado, enviaremos um link de redefinicao.";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestPasswordResetSchema.safeParse(body);

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
    await requestPasswordReset(parsed.data);
    return Response.json({
      success: true,
      message: PASSWORD_RESET_REQUEST_MESSAGE,
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: "PASSWORD_RESET_DELIVERY_ERROR",
      },
      { status: 502 },
    );
  }
}
