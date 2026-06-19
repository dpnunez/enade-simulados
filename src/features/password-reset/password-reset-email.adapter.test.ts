import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;
let tmpLogDir: string | null = null;

async function loadAdapter() {
  vi.resetModules();
  return import("./password-reset-email.adapter");
}

describe("password-reset-email.adapter", () => {
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

  afterEach(async () => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();

    if (tmpLogDir) {
      await rm(tmpLogDir, { force: true, recursive: true });
      tmpLogDir = null;
    }
  });

  it("builds reset URL from NEXT_PUBLIC_URL and token", async () => {
    process.env.NEXT_PUBLIC_URL = "https://enade.local";
    const { buildPasswordResetUrl } = await loadAdapter();

    const url = buildPasswordResetUrl("token-123");

    expect(url).toBe("https://enade.local/redefinir-senha/token-123");
  });

  it("requires reset email delivery envs", async () => {
    delete process.env.PASSWORD_RESET_EMAIL_DELIVERY;
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(loadAdapter()).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("uses console delivery with reset URL payload", async () => {
    const infoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const { sendPasswordResetEmail } = await loadAdapter();

    await sendPasswordResetEmail({
      email: "user@test.com",
      token: "abc",
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      "[password-reset-email]",
      expect.objectContaining({
        from: "Equipe <noreply@enade.local>",
        to: "user@test.com",
        resetUrl: "http://localhost:3000/redefinir-senha/abc",
      }),
    );
  });

  it("appends one JSON line when console log-file delivery is configured", async () => {
    tmpLogDir = await mkdtemp(join(tmpdir(), "password-reset-email-"));
    process.env.PASSWORD_RESET_EMAIL_DELIVERY = "console";
    process.env.PASSWORD_RESET_EMAIL_LOG_DIR = tmpLogDir;
    process.env.PASSWORD_RESET_EMAIL_LOG_FILE_NAME = "reset.log";

    vi.spyOn(console, "info").mockImplementation(() => undefined);

    const { sendPasswordResetEmail } = await loadAdapter();

    await sendPasswordResetEmail({
      email: "user@test.com",
      token: "abc",
    });

    const content = await readFile(join(tmpLogDir, "reset.log"), "utf8");
    const lines = content.trim().split("\n");

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({
      to: "user@test.com",
      resetUrl: "http://localhost:3000/redefinir-senha/abc",
    });
  });

  it("throws when smtp delivery is configured without required settings", async () => {
    process.env.PASSWORD_RESET_EMAIL_DELIVERY = "smtp";
    process.env.SMTP_HOST = "";
    process.env.SMTP_PORT = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";

    const { sendPasswordResetEmail } = await loadAdapter();

    await expect(
      sendPasswordResetEmail({
        email: "user@test.com",
        token: "abc",
      }),
    ).rejects.toThrow("Missing SMTP_HOST for SMTP delivery.");
  });
});
