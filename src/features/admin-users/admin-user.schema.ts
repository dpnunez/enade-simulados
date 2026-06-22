import { z } from "zod";

export const adminUsersSortFields = ["createdAt", "email", "name", "role"] as const;
export const adminUsersDirections = ["asc", "desc"] as const;

export const adminUsersQuerySchema = z.object({
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
  sort: z.enum(adminUsersSortFields).default("createdAt"),
  direction: z.enum(adminUsersDirections).default("desc"),
});

export type AdminUsersQuery = z.input<typeof adminUsersQuerySchema>;
export type ParsedAdminUsersQuery = z.output<typeof adminUsersQuerySchema>;
export type AdminUsersSortField = (typeof adminUsersSortFields)[number];
export type AdminUsersDirection = (typeof adminUsersDirections)[number];
