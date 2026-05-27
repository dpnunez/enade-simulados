import knex from "knex";
export const INVITATION_E2E_EMAIL_PREFIX = "invite-e2e+";
import { readFileSync } from "node:fs";

export function buildInvitationEmail(label: string) {
  return `${INVITATION_E2E_EMAIL_PREFIX}${label}@enade.local`;
}

export async function ereaseInvitationRelatedData() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  await db("Invitation").del();
  await db("User")
    .where("email", "like", `${INVITATION_E2E_EMAIL_PREFIX}%`)
    .del();
  await db.destroy();
}

export async function getInvitationTokenFromFileAndDeleteFile() {
  const invitationLogFileName = process.env.INVITATION_EMAIL_LOG_FILE_NAME;
  const invitationLogDir = process.env.INVITATION_EMAIL_LOG_DIR;
  if (!invitationLogFileName || !invitationLogDir) {
    throw new Error(
      "INVITATION_EMAIL_LOG_FILE_NAME ou INVITATION_EMAIL_LOG_DIR não configurados.",
    );
  }

  const logFilePath = `${invitationLogDir}/${invitationLogFileName}`;
  const content = readFileSync(logFilePath, "utf8").trim();
  if (!content) {
    throw new Error("Nenhum convite foi registrado no log.");
  }

  // content is a json in first line

  const invitationData = JSON.parse(content.split("\n").pop() as string);

  const token = new URL(invitationData.inviteUrl).pathname
    .split("/")
    .filter(Boolean)
    .at(-1);
  if (!token) {
    throw new Error("Token não encontrado no inviteUrl.");
  }

  return token;
}
