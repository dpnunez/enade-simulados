import { z } from "zod";

import {
  createMarkdownImageObjectKey,
  validateMarkdownImageFile,
} from "./markdown-image.schema";
import type { ObjectStorageAdapter } from "./object-storage";

export type MarkdownImageUploadErrorCode =
  | "VALIDATION_ERROR"
  | "STORAGE_UPLOAD_ERROR";

export class MarkdownImageUploadDomainError extends Error {
  constructor(
    public readonly code: MarkdownImageUploadErrorCode,
    public readonly cause?: unknown,
  ) {
    super(code);
    this.name = "MarkdownImageUploadDomainError";
  }
}

export type MarkdownImageUploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type MarkdownImageUploadInput = {
  file: MarkdownImageUploadFile;
  actorUserId: string;
};

export type MarkdownImageUploadResult = Awaited<
  ReturnType<typeof uploadMarkdownImage>
>;

export async function uploadMarkdownImage(
  input: MarkdownImageUploadInput,
  storage: ObjectStorageAdapter,
) {
  let file;

  try {
    file = validateMarkdownImageFile(input.file);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new MarkdownImageUploadDomainError("VALIDATION_ERROR", error);
    }

    throw error;
  }

  const key = createMarkdownImageObjectKey({
    filename: file.name,
    contentType: file.type,
    userId: input.actorUserId,
  });

  try {
    return await storage.uploadObject({
      key,
      body: await input.file.arrayBuffer(),
      contentType: file.type,
      cacheControl: "31536000",
    });
  } catch (error) {
    throw new MarkdownImageUploadDomainError("STORAGE_UPLOAD_ERROR", error);
  }
}
