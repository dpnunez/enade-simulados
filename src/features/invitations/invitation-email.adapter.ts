import type { Role } from "@prisma-generated-client";
import { appendFile, mkdir } from "node:fs/promises";

import { sendSmtpEmail } from "@infra/email/smtp-mailer";
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
    await sendSmtpEmail({
      from,
      to: input.email,
      subject: "Convite para acessar a plataforma ENADE Engenharia",
      text: [
        "Voce recebeu um convite para acessar a plataforma ENADE Engenharia.",
        `Perfil: ${input.role}`,
        `Acesse: ${inviteUrl}`,
      ].join("\n\n"),
      html: [
        "<p>Voce recebeu um convite para acessar a plataforma ENADE Engenharia.</p>",
        `<p><strong>Perfil:</strong> ${input.role}</p>`,
        `<p><a href="${inviteUrl}">Acessar convite</a></p>`,
      ].join(""),
    });

    return;
  }

  throw new Error(`Unsupported INVITATION_EMAIL_DELIVERY: ${delivery}`);
}
