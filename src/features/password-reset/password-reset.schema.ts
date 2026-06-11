import { z } from "zod";

import {
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT_MESSAGES,
  PASSWORD_SPECIAL_CHARACTER_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from "./password-policy";

const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Informe um email válido.")
  .transform((email) => email.toLowerCase());

const nonEmptyStringSchema = z.string().trim().min(1, "Campo obrigatório.");
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENT_MESSAGES.minLength)
  .regex(PASSWORD_UPPERCASE_PATTERN, PASSWORD_REQUIREMENT_MESSAGES.uppercase)
  .regex(PASSWORD_LOWERCASE_PATTERN, PASSWORD_REQUIREMENT_MESSAGES.lowercase)
  .regex(
    PASSWORD_SPECIAL_CHARACTER_PATTERN,
    PASSWORD_REQUIREMENT_MESSAGES.specialCharacter,
  );

export const requestPasswordResetSchema = z.object({
  email: normalizedEmailSchema,
});

export const confirmPasswordResetSchema = z
  .object({
    token: nonEmptyStringSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ["passwordConfirmation"],
    error: "As senhas não conferem.",
  });

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
