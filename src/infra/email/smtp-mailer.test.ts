import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({
  sendMail: sendMailMock,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

async function loadMailer() {
  vi.resetModules();
  return import("./smtp-mailer");
}

describe("smtp-mailer", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: "postgresql://user:password@localhost:5432/enade_test",
      BETTER_AUTH_SECRET: "test-secret",
      NEXT_PUBLIC_URL: "http://localhost:3000",
      INVITATION_EMAIL_DELIVERY: "console",
      PASSWORD_RESET_EMAIL_DELIVERY: "console",
      PASSWORD_RESET_EMAIL_FROM: "Equipe <noreply@enade.local>",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "465",
      SMTP_USER: "sender@gmail.com",
      SMTP_PASSWORD: "app-password",
      SMTP_SECURE: "true",
    };

    createTransportMock.mockClear();
    sendMailMock.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("returns validated SMTP configuration from env", async () => {
    const { getSmtpConfig } = await loadMailer();

    expect(getSmtpConfig()).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: "sender@gmail.com",
      password: "app-password",
    });
  });

  it("throws a clear error when required SMTP config is missing", async () => {
    process.env.SMTP_PASSWORD = "";
    const { getSmtpConfig } = await loadMailer();

    expect(() => getSmtpConfig()).toThrow(
      "Missing SMTP_PASSWORD for SMTP delivery.",
    );
  });

  it("rejects non-numeric SMTP ports", async () => {
    process.env.SMTP_PORT = "not-a-number";
    const { getSmtpConfig } = await loadMailer();

    expect(() => getSmtpConfig()).toThrow(
      "Invalid SMTP_PORT for SMTP delivery.",
    );
  });

  it("rejects SMTP_SECURE=true with port 587", async () => {
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "true";
    const { getSmtpConfig } = await loadMailer();

    expect(() => getSmtpConfig()).toThrow(
      "Invalid SMTP configuration: SMTP_SECURE=true requires SMTP_PORT=465.",
    );
  });

  it("sends email through nodemailer without logging secrets", async () => {
    const infoSpy = vi.spyOn(console, "info");
    const errorSpy = vi.spyOn(console, "error");
    const { sendSmtpEmail } = await loadMailer();

    await sendSmtpEmail({
      from: "ENADE <sender@gmail.com>",
      to: "student@example.com",
      subject: "Convite",
      text: "Acesse http://localhost:3000/convites/token",
      html: '<a href="http://localhost:3000/convites/token">Convite</a>',
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "sender@gmail.com",
        pass: "app-password",
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "ENADE <sender@gmail.com>",
      to: "student@example.com",
      subject: "Convite",
      text: "Acesse http://localhost:3000/convites/token",
      html: '<a href="http://localhost:3000/convites/token">Convite</a>',
    });
    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
