import { appendFile, mkdir } from "node:fs/promises";

import { env } from "@infra/env";

export interface SendPasswordResetEmailInput {
  email: string;
  token: string;
}

export function buildPasswordResetUrl(token: string) {
  return new URL(
    `/redefinir-senha/${encodeURIComponent(token)}`,
    env.APP_BASE_URL,
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

  throw new Error(`Unsupported PASSWORD_RESET_EMAIL_DELIVERY: ${delivery}`);
}
