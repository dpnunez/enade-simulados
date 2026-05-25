import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/`,
      },
      {
        find: /^@auth\/(.*)$/,
        replacement: `${fileURLToPath(new URL("./src/infra/auth", import.meta.url))}/$1`,
      },
      {
        find: /^@infra\/(.*)$/,
        replacement: `${fileURLToPath(new URL("./src/infra", import.meta.url))}/$1`,
      },
      {
        find: /^@prisma-generated-client$/,
        replacement: fileURLToPath(
          new URL("./src/generated/prisma/client", import.meta.url),
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
    ],
    setupFiles: ["./src/tests/setup/vitest.ts"],
    poolOptions: {
      threads: {
        isolate: true,
      },
    },
  },
});
