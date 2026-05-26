import { createHash, randomBytes } from "node:crypto";

const INVITATION_TOKEN_BYTES = 32;

export function generateInvitationToken() {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
