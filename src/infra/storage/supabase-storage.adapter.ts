import { createClient } from "@supabase/supabase-js";

import type {
  ObjectStorageAdapter,
  ObjectStorageUploadInput,
} from "@/features/uploads/object-storage";
import { env } from "@infra/env";

export type SupabaseStorageConfig = {
  url: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
};

export class SupabaseStorageUploadError extends Error {
  constructor(public readonly cause?: unknown) {
    super("STORAGE_UPLOAD_ERROR");
    this.name = "SupabaseStorageUploadError";
  }
}

export function createSupabaseStorageConfig(): SupabaseStorageConfig {
  return {
    url: env.SUPABASE_URL,
    secretKey: env.SUPABASE_SECRET_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
    publicUrl: env.SUPABASE_STORAGE_PUBLIC_URL,
  };
}

export function createSupabaseStorageClient(config = createSupabaseStorageConfig()) {
  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBodySize(body: ObjectStorageUploadInput["body"]) {
  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (body instanceof Blob) {
    return body.size;
  }

  return body.byteLength;
}

export function createSupabaseStorageAdapter(
  config = createSupabaseStorageConfig(),
): ObjectStorageAdapter {
  const client = createSupabaseStorageClient(config);

  return {
    async uploadObject(input) {
      const { error } = await client.storage.from(config.bucket).upload(
        input.key,
        input.body,
        {
          cacheControl: input.cacheControl,
          contentType: input.contentType,
          upsert: false,
        },
      );

      if (error) {
        throw new SupabaseStorageUploadError(error);
      }

      return {
        url: `${config.publicUrl}/${input.key}`,
        key: input.key,
        contentType: input.contentType,
        size: getBodySize(input.body),
      };
    },
  };
}

export const supabaseMarkdownImageStorage = {
  uploadObject(input: ObjectStorageUploadInput) {
    return createSupabaseStorageAdapter().uploadObject(input);
  },
} satisfies ObjectStorageAdapter;
