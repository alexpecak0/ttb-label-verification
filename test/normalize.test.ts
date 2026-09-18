import { describe, expect, it } from "vitest";

import { normalizeText } from "../lib/normalize";

describe("normalizeText", () => {
  it("treats case, curly apostrophes, ampersands, and repeated whitespace as equivalent", () => {
    expect(normalizeText("  STONE'S  THROW & Co. ")).toBe(
      "stone's throw and co.",
    );
    expect(normalizeText("Stone’s Throw and Co.")).toBe(
      "stone's throw and co.",
    );
  });
});
