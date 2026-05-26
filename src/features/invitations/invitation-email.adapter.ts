import type { Role } from "@prisma-generated-client";

export interface SendInvitationEmailInput {
  email: string;
  role: Role;
  token: string;
}

export function buildInvitationUrl(token: string) {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return new URL(`/convites/${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function sendInvitationEmail(input: SendInvitationEmailInput) {
  const delivery = process.env.INVITATION_EMAIL_DELIVERY ?? "console";
  const from = process.env.INVITATION_EMAIL_FROM ?? "noreply@enade.local";
  const inviteUrl = buildInvitationUrl(input.token);

  if (delivery === "console") {
    console.info("[invitation-email]", {
      from,
      to: input.email,
      role: input.role,
      inviteUrl,
    });
    return;
  }

  if (delivery === "smtp") {
    const required = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
    ] as const;
    for (const key of required) {
      if (!process.env[key])
        throw new Error(`Missing ${key} for SMTP delivery.`);
    }

    throw new Error("SMTP delivery not implemented yet.");
  }

  throw new Error(`Unsupported INVITATION_EMAIL_DELIVERY: ${delivery}`);
}
