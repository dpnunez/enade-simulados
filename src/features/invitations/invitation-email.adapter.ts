import type { Role } from "@prisma-generated-client";
import { appendFile, mkdir } from "node:fs/promises";

import { env } from "@infra/env";
import { getAppBaseUrl } from "@infra/url/app-base-url";

export interface SendInvitationEmailInput {
  email: string;
  role: Role;
  token: string;
}

export function buildInvitationUrl(token: string) {
  return new URL(
    `/convites/${encodeURIComponent(token)}`,
    getAppBaseUrl(),
  ).toString();
}

export async function sendInvitationEmail(input: SendInvitationEmailInput) {
  const delivery = env.INVITATION_EMAIL_DELIVERY;
  const from = env.INVITATION_EMAIL_FROM;
  const inviteUrl = buildInvitationUrl(input.token);

  if (delivery === "console") {
    console.info("[invitation-email]", {
      from,
      to: input.email,
      role: input.role,
      inviteUrl,
    });

    const logFileName = env.INVITATION_EMAIL_LOG_FILE_NAME;
    const logDir = env.INVITATION_EMAIL_LOG_DIR;
    if (logFileName && logDir) {
      const logEntry =
        JSON.stringify({
          from,
          to: input.email,
          role: input.role,
          inviteUrl,
        }) + "\n";

      await mkdir(logDir, { recursive: true });
      await appendFile(`${logDir}/${logFileName}`, logEntry, {
        encoding: "utf8",
      });
    }

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
      if (!env[key]) throw new Error(`Missing ${key} for SMTP delivery.`);
    }

    throw new Error("SMTP delivery not implemented yet.");
  }

  throw new Error(`Unsupported INVITATION_EMAIL_DELIVERY: ${delivery}`);
}
