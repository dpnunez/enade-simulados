import { describe, expect, it } from "vitest";

import {
  generateInvitationToken,
  hashInvitationToken,
} from "./invitation-token.service";

describe("invitation-token.service", () => {
  it("generates URL-safe high-entropy tokens", () => {
    const token = generateInvitationToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it("generates different tokens for separate invitations", () => {
    const tokens = new Set(
      Array.from({ length: 20 }, () => generateInvitationToken()),
    );

    expect(tokens.size).toBe(20);
  });

  it("hashes tokens deterministically without returning the raw token", () => {
    const token = "invite-token-example";
    const firstHash = hashInvitationToken(token);
    const secondHash = hashInvitationToken(token);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toBe(token);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
