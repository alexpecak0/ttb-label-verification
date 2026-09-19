import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const fixtureNames = [
  "compliant-label.png",
  "title-case-warning.png",
  "all-bold-warning.png",
  "paraphrased-warning.png",
  "missing-warning.png",
  "abv-mismatch.png",
  "volume-conversion.png",
  "stone-throw-punctuation.png",
  "poor-photo.png",
];

describe("label fixture set", () => {
  it("contains every required PNG scenario", () => {
    for (const fixtureName of fixtureNames) {
      expect(existsSync(resolve("fixtures", fixtureName))).toBe(true);
    }
  });

  it("exposes the clean fixture as the bundled sample", () => {
    expect(existsSync(resolve("public", "sample-label.png"))).toBe(true);
  });
});
