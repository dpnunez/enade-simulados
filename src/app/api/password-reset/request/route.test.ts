import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("@/features/password-reset/password-reset.service", () => ({
  requestPasswordReset: mocks.requestPasswordReset,
}));

import { POST } from "./route";

function createJsonRequest(body: unknown) {
  return {
    json: vi.fn(async () => body),
  } as unknown as Request;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("password reset request route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestPasswordReset.mockResolvedValue({ sent: true });
  });

  it("validates the request body", async () => {
    const response = await POST(createJsonRequest({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("returns generic success for known accounts", async () => {
    mocks.requestPasswordReset.mockResolvedValue({ sent: true });

    const response = await POST(createJsonRequest({ email: "student@enade.local" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      success: true,
      message: "Se o email estiver cadastrado, enviaremos um link de redefinicao.",
    });
  });

  it("returns the same generic success for unknown accounts", async () => {
    mocks.requestPasswordReset.mockResolvedValue({ sent: false });

    const response = await POST(createJsonRequest({ email: "missing@enade.local" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      success: true,
      message: "Se o email estiver cadastrado, enviaremos um link de redefinicao.",
    });
  });

  it("maps delivery failures without revealing account existence", async () => {
    mocks.requestPasswordReset.mockRejectedValue(new Error("SMTP unavailable"));

    const response = await POST(createJsonRequest({ email: "student@enade.local" }));

    expect(response.status).toBe(502);
    expect(await json(response)).toEqual({
      success: false,
      error: "PASSWORD_RESET_DELIVERY_ERROR",
    });
  });
});
