import { randomUUID } from "node:crypto";

import { z } from "zod";

export const ALLOWED_MARKDOWN_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const MAX_MARKDOWN_IMAGE_BYTES = 6 * 1024 * 1024;

const extensionByContentType = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
} satisfies Record<MarkdownImageContentType, string>;

const markdownImageFileSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ALLOWED_MARKDOWN_IMAGE_TYPES),
  size: z.number().int().positive().max(MAX_MARKDOWN_IMAGE_BYTES),
});

export type MarkdownImageContentType =
  (typeof ALLOWED_MARKDOWN_IMAGE_TYPES)[number];

export type MarkdownImageFile = z.infer<typeof markdownImageFileSchema>;

export function validateMarkdownImageFile(file: unknown) {
  return markdownImageFileSchema.parse(file);
}

function safeFilenameStem(filename: string) {
  const withoutExtension = filename.replace(/\.[^/.\\]+$/, "");
  const normalized = withoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

export function createMarkdownImageObjectKey(input: {
  filename: string;
  contentType: MarkdownImageContentType;
  userId: string;
}) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = extensionByContentType[input.contentType];
  const stem = safeFilenameStem(input.filename);

  return [
    "markdown-images",
    input.userId,
    year,
    month,
    `${randomUUID()}-${stem}.${extension}`,
  ].join("/");
}
