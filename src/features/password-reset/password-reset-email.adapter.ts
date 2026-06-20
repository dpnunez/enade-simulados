import { appendFile, mkdir } from "node:fs/promises";

import { sendSmtpEmail } from "@infra/email/smtp-mailer";
import { env } from "@infra/env";
import { getAppBaseUrl } from "@infra/url/app-base-url";

export interface SendPasswordResetEmailInput {
  email: string;
  token: string;
}

export function buildPasswordResetUrl(token: string) {
  return new URL(
    `/redefinir-senha/${encodeURIComponent(token)}`,
    getAppBaseUrl(),
  ).toString();
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const delivery = env.PASSWORD_RESET_EMAIL_DELIVERY;
  const from = env.PASSWORD_RESET_EMAIL_FROM;
  const resetUrl = buildPasswordResetUrl(input.token);

  if (delivery === "console") {
    console.info("[password-reset-email]", {
      from,
      to: input.email,
      resetUrl,
    });

    const logFileName = env.PASSWORD_RESET_EMAIL_LOG_FILE_NAME;
    const logDir = env.PASSWORD_RESET_EMAIL_LOG_DIR;
    if (logFileName && logDir) {
      const logEntry =
        JSON.stringify({
          from,
          to: input.email,
          resetUrl,
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
      subject: "Redefinicao de senha da plataforma ENADE Engenharia",
      text: [
        "Recebemos uma solicitacao para redefinir sua senha na plataforma ENADE Engenharia.",
        `Acesse: ${resetUrl}`,
        "Se voce nao solicitou essa redefinicao, ignore este email.",
      ].join("\n\n"),
      html: [
        "<p>Recebemos uma solicitacao para redefinir sua senha na plataforma ENADE Engenharia.</p>",
        `<p><a href="${resetUrl}">Redefinir senha</a></p>`,
        "<p>Se voce nao solicitou essa redefinicao, ignore este email.</p>",
      ].join(""),
    });

    return;
  }

  throw new Error(`Unsupported PASSWORD_RESET_EMAIL_DELIVERY: ${delivery}`);
}
