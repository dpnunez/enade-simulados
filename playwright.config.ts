import { defineConfig } from "@playwright/test";

const baseURL = "http://localhost:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "tsx scripts/e2e/start-web-server.ts",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
