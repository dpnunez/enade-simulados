import { z } from "zod";

const invitationRoleSchema = z.enum(["STUDENT", "TEACHER"], {
  error: "Selecione aluno ou professor.",
});

const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Informe um email válido.")
  .transform((email) => email.toLowerCase());

const nonEmptyStringSchema = z.string().trim().min(1, "Campo obrigatório.");

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

export const cancelInvitationSchema = z.object({
  invitationId: nonEmptyStringSchema,
});

export const acceptInvitationSchema = z.object({
  token: nonEmptyStringSchema,
  name: nickNameSchema,
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
