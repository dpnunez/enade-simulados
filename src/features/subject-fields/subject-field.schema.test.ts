import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  normalizeSubjectFieldTitle,
  subjectFieldInputSchema,
} from "./subject-field.schema";

describe("subject-field.schema", () => {
  it("accepts valid input and cleans display fields", () => {
    const parsed = subjectFieldInputSchema.parse({
      title: "  Calculo   Aplicado  ",
      description: "  Area para materias de calculo.  ",
      colorHex: "#2563EB",
    });

    expect(parsed).toEqual({
      title: "Calculo Aplicado",
      description: "Area para materias de calculo.",
      colorHex: "#2563EB",
      titleNormalized: "calculo aplicado",
    });
  });

  it("rejects empty title", () => {
    expect(() =>
      subjectFieldInputSchema.parse({
        title: "   ",
        description: "Descricao valida.",
        colorHex: "#2563EB",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects empty or short description", () => {
    expect(() =>
      subjectFieldInputSchema.parse({
        title: "Calculo",
        description: "curta",
        colorHex: "#2563EB",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects invalid colors", () => {
    expect(() =>
      subjectFieldInputSchema.parse({
        title: "Calculo",
        description: "Descricao valida.",
        colorHex: "2563EB",
      }),
    ).toThrow(z.ZodError);
  });

  it("normalizes lowercase color to uppercase", () => {
    const parsed = subjectFieldInputSchema.parse({
      title: "Calculo",
      description: "Descricao valida.",
      colorHex: "#2563eb",
    });

    expect(parsed.colorHex).toBe("#2563EB");
  });

  it("rejects shorthand colors", () => {
    expect(() =>
      subjectFieldInputSchema.parse({
        title: "Calculo",
        description: "Descricao valida.",
        colorHex: "#FFF",
      }),
    ).toThrow(z.ZodError);
  });

  it("normalizes equivalent title examples", () => {
    expect(normalizeSubjectFieldTitle("Calculo")).toBe("calculo");
    expect(normalizeSubjectFieldTitle("  calculo  ")).toBe("calculo");
    expect(normalizeSubjectFieldTitle("Calculo   Diferencial")).toBe(
      "calculo diferencial",
    );
  });
});
