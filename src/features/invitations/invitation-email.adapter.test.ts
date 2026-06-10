import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

async function loadAdapter() {
  vi.resetModules();
  return import("./invitation-email.adapter");
}

describe("invitation-email.adapter", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: "postgresql://user:password@localhost:5432/enade_test",
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      PASSWORD_RESET_EMAIL_DELIVERY: "console",
      PASSWORD_RESET_EMAIL_FROM: "Equipe <noreply@enade.local>",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("builds invitation URL from APP_BASE_URL and token", async () => {
    process.env.APP_BASE_URL = "https://enade.local";
    const { buildInvitationUrl } = await loadAdapter();

    const url = buildInvitationUrl("token-123");

    expect(url).toBe("https://enade.local/convites/token-123");
  });

  it("uses console delivery without external SMTP", async () => {
    process.env.INVITATION_EMAIL_DELIVERY = "console";
    process.env.INVITATION_EMAIL_FROM = "Equipe <noreply@enade.local>";

    const infoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const { sendInvitationEmail } = await loadAdapter();

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
    process.env.SMTP_HOST = "";
    process.env.SMTP_PORT = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";

    const { sendInvitationEmail } = await loadAdapter();

    await expect(
      sendInvitationEmail({
        email: "user@test.com",
        role: "TEACHER",
        token: "abc",
      }),
    ).rejects.toThrow("Missing SMTP_HOST for SMTP delivery.");
  });
});
