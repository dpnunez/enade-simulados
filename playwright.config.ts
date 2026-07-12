import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3001";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],
  use: {
    baseURL,
    trace: "on",
  },
  globalSetup: "./src/tests/e2e/global-setup.ts",
  webServer: {
    command: "tsx scripts/e2e/start-web-server.ts",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
