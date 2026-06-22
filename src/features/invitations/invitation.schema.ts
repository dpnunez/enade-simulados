import { z } from "zod";

import {
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT_MESSAGES,
  PASSWORD_SPECIAL_CHARACTER_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from "@/features/auth/password-policy";

const invitationRoleSchema = z.enum(["STUDENT", "TEACHER"], {
  error: "Selecione aluno ou professor.",
});

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

export const nickNameSchema = z
  .string()
  .trim()
  .pipe(
    z
      .string()
      .min(3, "O nick deve ter pelo menos 3 caracteres.")
      .max(30, "O nick deve ter no máximo 30 caracteres.")
      .regex(
        /^[\p{L}\p{N}_. -]+$/u,
        "Use apenas letras, números, espaço, ponto, hífen ou sublinhado.",
      ),
  );

export const createInvitationSchema = z.object({
  email: normalizedEmailSchema,
  role: invitationRoleSchema,
});

export const invitationSortFields = ["createdAt", "email", "role"] as const;
export const invitationDirections = ["asc", "desc"] as const;

export const invitationsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Informe uma pagina inteira.")
    .min(1, "Informe uma pagina maior que zero.")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("Informe um tamanho de pagina inteiro.")
    .min(10, "Informe pelo menos 10 linhas por pagina.")
    .max(100, "Informe no maximo 100 linhas por pagina.")
    .default(20),
  sort: z.enum(invitationSortFields).default("createdAt"),
  direction: z.enum(invitationDirections).default("desc"),
});

export const cancelInvitationSchema = z.object({
  invitationId: nonEmptyStringSchema,
});

export const acceptInvitationSchema = z
  .object({
    token: nonEmptyStringSchema,
    name: nickNameSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ["passwordConfirmation"],
    error: "As senhas não conferem.",
  });

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationsQuery = z.input<typeof invitationsQuerySchema>;
export type ParsedInvitationsQuery = z.output<typeof invitationsQuerySchema>;
export type InvitationSortField = (typeof invitationSortFields)[number];
export type InvitationDirection = (typeof invitationDirections)[number];
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
