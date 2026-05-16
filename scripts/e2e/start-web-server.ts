import dotenv from "dotenv";
import { spawn } from "node:child_process";

dotenv.config({
  override: true,
  path: ".env.test",
});

const build = spawn("pnpm", ["exec", "next", "build"], {
  env: process.env,
  stdio: "inherit",
});

build.on("exit", (buildCode) => {
  if (buildCode !== 0) {
    process.exit(buildCode ?? 1);
    return;
  }

  const child = spawn("pnpm", ["exec", "next", "start", "-p", "3001"], {
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
  });
});
