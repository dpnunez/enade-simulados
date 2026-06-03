import { createHash } from "node:crypto";

export function normalizeQuestionMarkdownForHash(markdown: string) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .trim()
    .replace(/\s+/g, " ");
}

export function createQuestionDescriptionHash(descriptionMarkdown: string) {
  return createHash("sha256")
    .update(normalizeQuestionMarkdownForHash(descriptionMarkdown), "utf8")
    .digest("hex");
}
