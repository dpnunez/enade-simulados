import { describe, expect, it } from "vitest";

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "./password-reset-token.service";

describe("password-reset-token.service", () => {
  it("generates URL-safe high-entropy tokens", () => {
    const token = generatePasswordResetToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it("generates different tokens for separate reset requests", () => {
    const tokens = new Set(
      Array.from({ length: 20 }, () => generatePasswordResetToken()),
    );

    expect(tokens.size).toBe(20);
  });

  it("hashes tokens deterministically without returning the raw token", () => {
    const token = "reset-token-example";
    const firstHash = hashPasswordResetToken(token);
    const secondHash = hashPasswordResetToken(token);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toBe(token);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
