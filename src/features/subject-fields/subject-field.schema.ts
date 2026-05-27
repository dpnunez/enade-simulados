import { z } from "zod";

const titleMinLength = 2;
const titleMaxLength = 120;
const descriptionMinLength = 10;
const descriptionMaxLength = 500;

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSubjectFieldTitle(title: string) {
  return normalizeWhitespace(title).toLowerCase();
}

const displayTitleSchema = z
  .string()
  .transform(normalizeWhitespace)
  .pipe(
    z
      .string()
      .min(titleMinLength, "Informe um titulo com pelo menos 2 caracteres.")
      .max(titleMaxLength, "Informe um titulo com no maximo 120 caracteres."),
  );

const descriptionSchema = z
  .string()
  .transform(normalizeWhitespace)
  .pipe(
    z
      .string()
      .min(descriptionMinLength, "Informe uma descricao com pelo menos 10 caracteres.")
      .max(descriptionMaxLength, "Informe uma descricao com no maximo 500 caracteres."),
  );

const colorHexSchema = z
  .string()
  .trim()
  .transform((color) => color.toUpperCase())
  .pipe(
    z
      .string()
      .regex(/^#[0-9A-F]{6}$/, "Informe uma cor hexadecimal no formato #RRGGBB."),
  );

export const subjectFieldInputSchema = z
  .object({
    title: displayTitleSchema,
    description: descriptionSchema,
    colorHex: colorHexSchema,
  })
  .transform((input) => ({
    ...input,
    titleNormalized: normalizeSubjectFieldTitle(input.title),
  }));

export const subjectFieldIdSchema = z.string().trim().min(1, "Grande area invalida.");

export type SubjectFieldInput = z.input<typeof subjectFieldInputSchema>;
export type ParsedSubjectFieldInput = z.output<typeof subjectFieldInputSchema>;
