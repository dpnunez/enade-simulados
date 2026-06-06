import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  uploadObject: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@auth/server", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/infra/storage/supabase-storage.adapter", () => ({
  supabaseMarkdownImageStorage: {
    uploadObject: mocks.uploadObject,
  },
}));

import { POST } from "./route";

function createRequest(file?: File) {
  const formData = new FormData();

  if (file) {
    formData.set("file", file);
  }

  return {
    formData: vi.fn(async () => formData),
  } as unknown as Request;
}

function createFile(parts: BlobPart[], name: string, options: FilePropertyBag) {
  const file = new File(parts, name, options);
  Object.defineProperty(file, "arrayBuffer", {
    value: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
  });
  return file;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("markdown image upload route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "teacher_1", role: "TEACHER" },
    });
    mocks.uploadObject.mockImplementation(async (input) => ({
      url: `https://storage.example/${input.key}`,
      key: input.key,
      contentType: input.contentType,
      size: 3,
    }));
  });

  it("rejects unauthenticated users before reading storage", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(createRequest(createFile(["png"], "a.png", { type: "image/png" })));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects authenticated non-teachers", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "student_1", role: "STUDENT" },
    });

    const response = await POST(createRequest(createFile(["png"], "a.png", { type: "image/png" })));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects missing files", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("maps validation errors from the upload service", async () => {
    const response = await POST(
      createRequest(createFile(["svg"], "a.svg", { type: "image/svg+xml" })),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("maps service storage errors without leaking provider details", async () => {
    mocks.uploadObject.mockRejectedValue(new Error("raw provider details"));

    const response = await POST(createRequest(createFile(["png"], "a.png", { type: "image/png" })));

    expect(response.status).toBe(502);
    expect(await json(response)).toEqual({
      success: false,
      error: "STORAGE_UPLOAD_ERROR",
    });
  });

  it("returns the uploaded image metadata on success", async () => {
    const response = await POST(createRequest(createFile(["png"], "a.png", { type: "image/png" })));

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({
      success: true,
      image: {
        url: expect.stringMatching(/^https:\/\/storage\.example\/markdown-images\//),
        key: expect.stringMatching(/^markdown-images\/teacher_1\//),
        contentType: "image/png",
        size: 3,
      },
    });
  });
});
