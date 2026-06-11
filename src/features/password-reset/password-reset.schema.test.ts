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
        password: "Password-123",
        passwordConfirmation: "Password-123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: "raw-token",
        password: "Password-123",
        passwordConfirmation: "Password-123",
      });
    });

    it("rejects missing tokens", () => {
      expect(
        confirmPasswordResetSchema.safeParse({
          token: "   ",
          password: "Password-123",
          passwordConfirmation: "Password-123",
        }).success,
      ).toBe(false);
    });

    it.each([
      ["minimum length", "short"],
      ["uppercase letter", "password-123"],
      ["lowercase letter", "PASSWORD-123"],
      ["special character", "Password123"],
    ])("rejects passwords missing %s requirement", (_requirement, password) => {
      const result = confirmPasswordResetSchema.safeParse({
        token: "raw-token",
        password,
        passwordConfirmation: password,
      });

      expect(result.success).toBe(false);
    });

    it("rejects password confirmation mismatch", () => {
      expect(
        confirmPasswordResetSchema.safeParse({
          token: "raw-token",
          password: "Password-123",
          passwordConfirmation: "Different-123",
        }).success,
      ).toBe(false);
    });
  });
});
