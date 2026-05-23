import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({
  override: true,
  path: ".env.test",
});

export default async function globalSetup() {
  const result = spawnSync("pnpm", ["e2e:prepare"], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Falha ao preparar o banco de teste.");
  }
}
