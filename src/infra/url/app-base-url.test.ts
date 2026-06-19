import { afterEach, describe, expect, it } from "vitest";

import { getAppBaseUrl, getAppBaseUrlHost } from "./app-base-url";

const ORIGINAL_ENV = process.env;

describe("app-base-url", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses NEXT_PUBLIC_URL when explicitly configured", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_URL: "https://enade.local/app",
      VERCEL_URL: "preview.vercel.app",
    };

    expect(getAppBaseUrl()).toBe("https://enade.local");
    expect(getAppBaseUrlHost()).toBe("enade.local");
  });

  it("uses VERCEL_URL when NEXT_PUBLIC_URL is not configured", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_URL: "",
      VERCEL_URL: "enade-git-feature.vercel.app",
    };

    expect(getAppBaseUrl()).toBe("https://enade-git-feature.vercel.app");
    expect(getAppBaseUrlHost()).toBe("enade-git-feature.vercel.app");
  });

  it("falls back to local development URL", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_URL: "",
      VERCEL_URL: "",
    };

    expect(getAppBaseUrl()).toBe("http://localhost:3000");
    expect(getAppBaseUrlHost()).toBe("localhost:3000");
  });
});
