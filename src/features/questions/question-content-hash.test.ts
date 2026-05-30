import { describe, expect, it } from "vitest";

import {
  createQuestionContentHash,
  normalizeQuestionMarkdownForHash,
} from "./question-content-hash";

describe("question-content-hash", () => {
  it("normalizes leading, trailing, repeated whitespace and line endings", () => {
    expect(
      normalizeQuestionMarkdownForHash(" \r\n  Enunciado\tcom\r\n espacos \r "),
    ).toBe("Enunciado com espacos");
  });

  it("hashes equivalent whitespace variants to the same digest", () => {
    expect(createQuestionContentHash("Enunciado com espacos")).toBe(
      createQuestionContentHash("  Enunciado\r\ncom\t\t espacos  "),
    );
  });

  it("hashes meaningfully different text to a different digest", () => {
    expect(createQuestionContentHash("Enunciado A")).not.toBe(
      createQuestionContentHash("Enunciado B"),
    );
  });

  it("returns a lowercase SHA-256 hex digest", () => {
    expect(createQuestionContentHash("Enunciado")).toMatch(/^[a-f0-9]{64}$/);
  });
});
