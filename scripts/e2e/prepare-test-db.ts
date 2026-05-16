import "dotenv/config";

import { spawnSync } from "node:child_process";

import { Client } from "pg";

function quoteIdentifier(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function getDatabaseName(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\/+/, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL precisa apontar para um database válido.");
  }

  return databaseName;
}

function getAdminDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  url.search = "";
  return url.toString();
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} falhou.`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definida.");
  }

  const databaseName = getDatabaseName(databaseUrl);
  const adminClient = new Client({
    connectionString: getAdminDatabaseUrl(databaseUrl),
  });

  await adminClient.connect();

  try {
    const result = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (result.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
      console.log(`Database de teste criado: ${databaseName}`);
    } else {
      console.log(`Database de teste já existe: ${databaseName}`);
    }
  } finally {
    await adminClient.end();
  }

  run("pnpm", ["prisma", "migrate", "deploy"]);
  run("pnpm", ["db:seed:users"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
