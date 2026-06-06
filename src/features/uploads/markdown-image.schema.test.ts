import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  MAX_MARKDOWN_IMAGE_BYTES,
  createMarkdownImageObjectKey,
  validateMarkdownImageFile,
} from "./markdown-image.schema";

const validImageFile = {
  name: "grafico.png",
  type: "image/png",
  size: 1024,
};

describe("markdown-image.schema", () => {
  it("accepts valid raster image files", () => {
    const parsed = validateMarkdownImageFile(validImageFile);

    expect(parsed).toEqual(validImageFile);
  });

  it("rejects SVG and arbitrary MIME types", () => {
    expect(() =>
      validateMarkdownImageFile({
        ...validImageFile,
        name: "icone.svg",
        type: "image/svg+xml",
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      validateMarkdownImageFile({
        ...validImageFile,
        type: "application/octet-stream",
      }),
    ).toThrow(z.ZodError);
  });

  it("rejects oversized image files", () => {
    expect(() =>
      validateMarkdownImageFile({
        ...validImageFile,
        size: MAX_MARKDOWN_IMAGE_BYTES + 1,
      }),
    ).toThrow(z.ZodError);
  });

  it("creates path-safe object keys from unsafe filenames", () => {
    const key = createMarkdownImageObjectKey({
      filename: "../Gráfico Final ção.PNG",
      contentType: "image/png",
      userId: "teacher_1",
    });

    expect(key).toMatch(
      /^markdown-images\/teacher_1\/\d{4}\/\d{2}\/[a-f0-9-]+-grafico-final-cao\.png$/,
    );
    expect(key).not.toContain("..");
    expect(key).not.toContain(" ");
  });

  it("creates unique extension-aware object keys", () => {
    const firstKey = createMarkdownImageObjectKey({
      filename: "chart",
      contentType: "image/webp",
      userId: "teacher_1",
    });
    const secondKey = createMarkdownImageObjectKey({
      filename: "chart",
      contentType: "image/webp",
      userId: "teacher_1",
    });

    expect(firstKey).toMatch(/\.webp$/);
    expect(secondKey).toMatch(/\.webp$/);
    expect(firstKey).not.toBe(secondKey);
  });
});
