import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ObjectStorageAdapter } from "./object-storage";
import {
  MarkdownImageUploadDomainError,
  uploadMarkdownImage,
} from "./markdown-image.service";

const validFile = {
  name: "grafico.png",
  type: "image/png",
  size: 1024,
  arrayBuffer: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
};

function createStorage(): ObjectStorageAdapter {
  return {
    uploadObject: vi.fn(async (input) => ({
      url: `https://storage.example/${input.key}`,
      key: input.key,
      contentType: input.contentType,
      size: validFile.size,
    })),
  };
}

describe("markdown-image.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates metadata and uploads through a generic adapter", async () => {
    const storage = createStorage();

    const result = await uploadMarkdownImage(
      { file: validFile, actorUserId: "teacher_1" },
      storage,
    );

    expect(result).toMatchObject({
      url: expect.stringMatching(/^https:\/\/storage\.example\/markdown-images\//),
      key: expect.stringMatching(/^markdown-images\/teacher_1\//),
      contentType: "image/png",
      size: 1024,
    });
    expect(storage.uploadObject).toHaveBeenCalledWith({
      key: result.key,
      body: expect.any(ArrayBuffer),
      contentType: "image/png",
      cacheControl: "31536000",
    });
  });

  it("rejects invalid files before calling storage", async () => {
    const storage = createStorage();

    await expect(
      uploadMarkdownImage(
        {
          file: { ...validFile, type: "image/svg+xml" },
          actorUserId: "teacher_1",
        },
        storage,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    } satisfies Partial<MarkdownImageUploadDomainError>);

    expect(storage.uploadObject).not.toHaveBeenCalled();
  });

  it("maps storage failures to stable domain errors", async () => {
    const storage: ObjectStorageAdapter = {
      uploadObject: vi.fn(async () => {
        throw new Error("provider exploded with internal details");
      }),
    };

    await expect(
      uploadMarkdownImage({ file: validFile, actorUserId: "teacher_1" }, storage),
    ).rejects.toMatchObject({
      code: "STORAGE_UPLOAD_ERROR",
    } satisfies Partial<MarkdownImageUploadDomainError>);
  });
});
