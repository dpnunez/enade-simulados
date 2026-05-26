import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildInvitationUrl,
  sendInvitationEmail,
} from "./invitation-email.adapter";

const ORIGINAL_ENV = process.env;

describe("invitation-email.adapter", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("builds invitation URL from APP_BASE_URL and token", () => {
    process.env.APP_BASE_URL = "https://enade.local";

    const url = buildInvitationUrl("token-123");

    expect(url).toBe("https://enade.local/convites/token-123");
  });

  it("uses console delivery without external SMTP", async () => {
    process.env.INVITATION_EMAIL_DELIVERY = "console";
    process.env.INVITATION_EMAIL_FROM = "Equipe <noreply@enade.local>";

    const infoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    await sendInvitationEmail({
      email: "user@test.com",
      role: "STUDENT",
      token: "abc",
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      "[invitation-email]",
      expect.objectContaining({
        from: "Equipe <noreply@enade.local>",
        to: "user@test.com",
        role: "STUDENT",
      }),
    );
  });

  it("throws when smtp delivery is configured without required settings", async () => {
    process.env.INVITATION_EMAIL_DELIVERY = "smtp";
    delete process.env.SMTP_HOST;

    await expect(
      sendInvitationEmail({
        email: "user@test.com",
        role: "TEACHER",
        token: "abc",
      }),
    ).rejects.toThrow("Missing SMTP_HOST for SMTP delivery.");
  });
});
