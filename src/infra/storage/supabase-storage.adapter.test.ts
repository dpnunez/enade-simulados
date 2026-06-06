import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const upload = vi.fn();
  const from = vi.fn(() => ({ upload }));
  const createClient = vi.fn(() => ({ storage: { from } }));

  return { createClient, from, upload };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

import {
  SupabaseStorageUploadError,
  createSupabaseStorageClient,
  createSupabaseStorageConfig,
  createSupabaseStorageAdapter,
} from "./supabase-storage.adapter";

const originalEnv = process.env;

describe("supabase-storage.adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SECRET_KEY: "supabase-secret-key",
      SUPABASE_STORAGE_BUCKET: "question-images",
      SUPABASE_STORAGE_PUBLIC_URL:
        "https://project.supabase.co/storage/v1/object/public/question-images/",
    };
  });

  it("creates storage config from env values without validating required fields", () => {
    process.env.SUPABASE_SECRET_KEY = "";

    expect(createSupabaseStorageConfig()).toEqual({
      url: "https://project.supabase.co",
      secretKey: "",
      bucket: "question-images",
      publicUrl: "https://project.supabase.co/storage/v1/object/public/question-images",
    });
  });

  it("creates a server-side Supabase client from env config", () => {
    createSupabaseStorageClient();

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "supabase-secret-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  });

  it("uploads objects with configured bucket and upsert disabled", async () => {
    mocks.upload.mockResolvedValue({ data: { path: "markdown-images/a.png" }, error: null });
    const adapter = createSupabaseStorageAdapter();

    const result = await adapter.uploadObject({
      key: "markdown-images/a.png",
      body: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
      cacheControl: "31536000",
    });

    expect(mocks.from).toHaveBeenCalledWith("question-images");
    expect(mocks.upload).toHaveBeenCalledWith(
      "markdown-images/a.png",
      new Uint8Array([1, 2, 3]),
      {
        cacheControl: "31536000",
        contentType: "image/png",
        upsert: false,
      },
    );
    expect(result).toEqual({
      url: "https://project.supabase.co/storage/v1/object/public/question-images/markdown-images/a.png",
      key: "markdown-images/a.png",
      contentType: "image/png",
      size: 3,
    });
  });

  it("maps provider upload errors without exposing raw internals", async () => {
    mocks.upload.mockResolvedValue({
      data: null,
      error: new Error("raw provider details"),
    });
    const adapter = createSupabaseStorageAdapter();

    await expect(
      adapter.uploadObject({
        key: "markdown-images/a.png",
        body: new Uint8Array([1]),
        contentType: "image/png",
      }),
    ).rejects.toThrow(SupabaseStorageUploadError);
  });
});
