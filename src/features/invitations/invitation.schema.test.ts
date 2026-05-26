import { describe, expect, it } from "vitest";

import {
  acceptInvitationSchema,
  cancelInvitationSchema,
  createInvitationSchema,
} from "./invitation.schema";

describe("invitation.schema", () => {
  describe("createInvitationSchema", () => {
    it("normalizes valid invitation input", () => {
      const input = createInvitationSchema.parse({
        email: "  Teacher@Enade.Local  ",
        role: "TEACHER",
      });

      expect(input).toEqual({
        email: "teacher@enade.local",
        role: "TEACHER",
      });
    });

    it("allows student invitations", () => {
      expect(
        createInvitationSchema.safeParse({
          email: "student@example.com",
          role: "STUDENT",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = createInvitationSchema.safeParse({
        email: "not-an-email",
        role: "STUDENT",
      });

      expect(result.success).toBe(false);
    });

    it("rejects admin invitations", () => {
      const result = createInvitationSchema.safeParse({
        email: "admin@example.com",
        role: "ADMIN",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("cancelInvitationSchema", () => {
    it("accepts non-empty invitation ids", () => {
      expect(
        cancelInvitationSchema.safeParse({ invitationId: "invite_123" })
          .success,
      ).toBe(true);
    });

    it("rejects missing invitation ids", () => {
      expect(
        cancelInvitationSchema.safeParse({ invitationId: "" }).success,
      ).toBe(false);
    });
  });

  describe("acceptInvitationSchema", () => {
    it("accepts a token and strong enough password", () => {
      expect(
        acceptInvitationSchema.safeParse({
          token: "raw-token",
          password: "password123",
        }).success,
      ).toBe(true);
    });

    it("rejects missing tokens", () => {
      expect(
        acceptInvitationSchema.safeParse({
          token: "",
          password: "password123",
        }).success,
      ).toBe(false);
    });

    it("rejects weak passwords", () => {
      expect(
        acceptInvitationSchema.safeParse({
          token: "raw-token",
          password: "short",
        }).success,
      ).toBe(false);
    });
  });
});
