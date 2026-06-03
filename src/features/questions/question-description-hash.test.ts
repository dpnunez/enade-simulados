import { describe, expect, it } from "vitest";

import {
  createQuestionDescriptionHash,
  normalizeQuestionMarkdownForHash,
} from "./question-description-hash";

describe("question-description-hash", () => {
  it("normalizes leading, trailing, repeated whitespace and line endings", () => {
    expect(
      normalizeQuestionMarkdownForHash(" \r\n  Enunciado\tcom\r\n espacos \r "),
    ).toBe("Enunciado com espacos");
  });

  it("hashes equivalent whitespace variants to the same digest", () => {
    expect(createQuestionDescriptionHash("Enunciado com espacos")).toBe(
      createQuestionDescriptionHash("  Enunciado\r\ncom\t\t espacos  "),
    );
  });

  it("hashes meaningfully different text to a different digest", () => {
    expect(createQuestionDescriptionHash("Enunciado A")).not.toBe(
      createQuestionDescriptionHash("Enunciado B"),
    );
  });

  it("returns a lowercase SHA-256 hex digest", () => {
    expect(createQuestionDescriptionHash("Enunciado")).toMatch(/^[a-f0-9]{64}$/);
  });
});
