import { z } from "zod";

const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Informe um email válido.")
  .transform((email) => email.toLowerCase());

const nonEmptyStringSchema = z.string().trim().min(1, "Campo obrigatório.");

export const requestPasswordResetSchema = z.object({
  email: normalizedEmailSchema,
});

export const confirmPasswordResetSchema = z
  .object({
    token: nonEmptyStringSchema,
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ["passwordConfirmation"],
    error: "As senhas não conferem.",
  });

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
