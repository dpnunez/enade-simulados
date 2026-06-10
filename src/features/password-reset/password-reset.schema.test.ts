import { describe, expect, it } from "vitest";

import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
} from "./password-reset.schema";

describe("password-reset.schema", () => {
  describe("requestPasswordResetSchema", () => {
    it("normalizes valid email input", () => {
      const input = requestPasswordResetSchema.parse({
        email: "  Student@Enade.Local  ",
      });

      expect(input).toEqual({ email: "student@enade.local" });
    });

    it("rejects invalid email", () => {
      const result = requestPasswordResetSchema.safeParse({
        email: "not-an-email",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("confirmPasswordResetSchema", () => {
    it("accepts matching valid passwords and trims token", () => {
      const result = confirmPasswordResetSchema.safeParse({
        token: "  raw-token  ",
        password: "password123",
        passwordConfirmation: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: "raw-token",
        password: "password123",
        passwordConfirmation: "password123",
      });
    });

    it("rejects missing tokens", () => {
      expect(
        confirmPasswordResetSchema.safeParse({
          token: "   ",
          password: "password123",
          passwordConfirmation: "password123",
        }).success,
      ).toBe(false);
    });

    it("rejects weak passwords", () => {
      expect(
        confirmPasswordResetSchema.safeParse({
          token: "raw-token",
          password: "short",
          passwordConfirmation: "short",
        }).success,
      ).toBe(false);
    });

    it("rejects password confirmation mismatch", () => {
      expect(
        confirmPasswordResetSchema.safeParse({
          token: "raw-token",
          password: "password123",
          passwordConfirmation: "different123",
        }).success,
      ).toBe(false);
    });
  });
});
