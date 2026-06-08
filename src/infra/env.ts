import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalTrimmedString = z.string().trim().optional().default("");

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    APP_BASE_URL: z.url().default("http://localhost:3000"),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_RATE_LIMIT_DISABLED: booleanString,
    INVITATION_EMAIL_DELIVERY: z.enum(["console", "smtp"]).default("console"),
    INVITATION_EMAIL_FROM: z.string().min(1).default("noreply@enade.local"),
    INVITATION_EMAIL_LOG_DIR: optionalTrimmedString,
    INVITATION_EMAIL_LOG_FILE_NAME: optionalTrimmedString,
    SMTP_HOST: optionalTrimmedString,
    SMTP_PORT: optionalTrimmedString,
    SMTP_USER: optionalTrimmedString,
    SMTP_PASSWORD: optionalTrimmedString,
    SMTP_SECURE: booleanString,
    SUPABASE_URL: optionalTrimmedString,
    SUPABASE_SECRET_KEY: optionalTrimmedString,
    SUPABASE_STORAGE_BUCKET: optionalTrimmedString,
    SUPABASE_STORAGE_PUBLIC_URL: optionalTrimmedString.transform((value) =>
      value.replace(/\/+$/, ""),
    ),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
});
