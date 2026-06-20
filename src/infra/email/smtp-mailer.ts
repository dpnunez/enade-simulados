import nodemailer from "nodemailer";

import { env } from "@infra/env";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface SendSmtpEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

const REQUIRED_SMTP_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
] as const;

export function getSmtpConfig(): SmtpConfig {
  for (const key of REQUIRED_SMTP_KEYS) {
    if (!env[key]) {
      throw new Error(`Missing ${key} for SMTP delivery.`);
    }
  }

  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP_PORT for SMTP delivery.");
  }

  if (env.SMTP_SECURE && port === 587) {
    throw new Error(
      "Invalid SMTP configuration: SMTP_SECURE=true requires SMTP_PORT=465.",
    );
  }

  return {
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  };
}

export async function sendSmtpEmail(input: SendSmtpEmailInput) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  await transporter.sendMail(input);
}
