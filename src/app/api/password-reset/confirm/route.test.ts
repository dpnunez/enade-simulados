import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  confirmPasswordReset: vi.fn(),
  PasswordResetDomainError: class PasswordResetDomainError extends Error {
    constructor(public readonly code: string) {
      super(code);
      this.name = "PasswordResetDomainError";
    }
  },
}));

vi.mock("@/features/password-reset/password-reset.service", () => {
  return {
    confirmPasswordReset: mocks.confirmPasswordReset,
    PasswordResetDomainError: mocks.PasswordResetDomainError,
  };
});

import { PasswordResetDomainError } from "@/features/password-reset/password-reset.service";
import { POST } from "./route";

function createJsonRequest(body: unknown) {
  return {
    json: vi.fn(async () => body),
  } as unknown as Request;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("password reset confirm route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmPasswordReset.mockResolvedValue(undefined);
  });

  it("validates the request body", async () => {
    const response = await POST(
      createJsonRequest({
        token: "raw-token",
        password: "short",
        passwordConfirmation: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR",
    });
    expect(mocks.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it("confirms a valid password reset", async () => {
    const response = await POST(
      createJsonRequest({
        token: "raw-token",
        password: "New-password!",
        passwordConfirmation: "New-password!",
      }),
    );

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true });
    expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({
      token: "raw-token",
      password: "New-password!",
      passwordConfirmation: "New-password!",
    });
  });

  it("maps domain token errors to a generic unavailable response", async () => {
    mocks.confirmPasswordReset.mockRejectedValue(
      new PasswordResetDomainError("PASSWORD_RESET_TOKEN_EXPIRED"),
    );

    const response = await POST(
      createJsonRequest({
        token: "raw-token",
        password: "New-password!",
        passwordConfirmation: "New-password!",
      }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      success: false,
      error: "PASSWORD_RESET_UNAVAILABLE",
    });
  });
});
