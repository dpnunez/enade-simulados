import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;
const sendSmtpEmailMock = vi.fn();

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
      NEXT_PUBLIC_URL: "http://localhost:3000",
      PASSWORD_RESET_EMAIL_DELIVERY: "console",
      PASSWORD_RESET_EMAIL_FROM: "Equipe <noreply@enade.local>",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
    sendSmtpEmailMock.mockReset();
    vi.doUnmock("@infra/email/smtp-mailer");
  });

  it("builds invitation URL from explicit NEXT_PUBLIC_URL and token", async () => {
    process.env.NEXT_PUBLIC_URL = "https://enade.local";
    const { buildInvitationUrl } = await loadAdapter();

    const url = buildInvitationUrl("token-123");

    expect(url).toBe("https://enade.local/convites/token-123");
  });

  it("builds invitation URL from VERCEL_URL when NEXT_PUBLIC_URL is omitted", async () => {
    process.env.NEXT_PUBLIC_URL = "";
    process.env.VERCEL_URL = "enade-git-feature.vercel.app";
    const { buildInvitationUrl } = await loadAdapter();

    const url = buildInvitationUrl("token-123");

    expect(url).toBe(
      "https://enade-git-feature.vercel.app/convites/token-123",
    );
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

  it("sends invitation email through SMTP with invite link", async () => {
    process.env.INVITATION_EMAIL_DELIVERY = "smtp";
    process.env.INVITATION_EMAIL_FROM = "ENADE <sender@gmail.com>";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "sender@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    process.env.SMTP_SECURE = "true";
    vi.doMock("@infra/email/smtp-mailer", () => ({
      sendSmtpEmail: sendSmtpEmailMock,
    }));

    const { sendInvitationEmail } = await loadAdapter();

    await sendInvitationEmail({
      email: "student@example.com",
      role: "STUDENT",
      token: "token-123",
    });

    expect(sendSmtpEmailMock).toHaveBeenCalledWith({
      from: "ENADE <sender@gmail.com>",
      to: "student@example.com",
      subject: "Convite para acessar a plataforma ENADE Engenharia",
      text: expect.stringContaining(
        "http://localhost:3000/convites/token-123",
      ),
      html: expect.stringContaining(
        "http://localhost:3000/convites/token-123",
      ),
    });
  });
});
