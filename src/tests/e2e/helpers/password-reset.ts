import { readFileSync, unlinkSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import knex from "knex";

import { TEST_USERS } from "../fixtures/users";

export async function resetStudentPasswordResetState() {
  const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });

  try {
    const student = await db("User")
      .select("id")
      .where({ email: TEST_USERS.student.email })
      .first();

    if (!student) return;

    const passwordHash = await hashPassword(TEST_USERS.student.password);

    await db("Account")
      .where({
        userId: student.id,
        providerId: "credential",
      })
      .update({ password: passwordHash });

    await db("Session").where({ userId: student.id }).del();
    await db("PasswordResetToken").where({ userId: student.id }).del();
  } finally {
    await db.destroy();
  }
}

export function getPasswordResetUrlFromFileAndDeleteFile() {
  const resetLogFileName = process.env.PASSWORD_RESET_EMAIL_LOG_FILE_NAME;
  const resetLogDir = process.env.PASSWORD_RESET_EMAIL_LOG_DIR;
  if (!resetLogFileName || !resetLogDir) {
    throw new Error(
      "PASSWORD_RESET_EMAIL_LOG_FILE_NAME ou PASSWORD_RESET_EMAIL_LOG_DIR não configurados.",
    );
  }

  const logFilePath = `${resetLogDir}/${resetLogFileName}`;
  const content = readFileSync(logFilePath, "utf8").trim();
  if (!content) {
    throw new Error("Nenhum reset de senha foi registrado no log.");
  }

  unlinkSync(logFilePath);

  const resetData = JSON.parse(content.split("\n").pop() as string);
  if (!resetData.resetUrl) {
    throw new Error("resetUrl não encontrado no log de reset.");
  }

  return String(resetData.resetUrl);
}
