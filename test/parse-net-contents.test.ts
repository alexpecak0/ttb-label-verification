import { describe, expect, it } from "vitest";

import {
  areNetContentsEquivalent,
  parseNetContents,
} from "../lib/parseNetContents";

describe("parseNetContents", () => {
  it("parses metric and US fluid-ounce volumes into milliliters", () => {
    expect(parseNetContents("750 mL")).toMatchObject({ milliliters: 750 });
    expect(parseNetContents("25.4 fl oz")?.milliliters).toBeCloseTo(
      751.1676508875,
      10,
    );
  });

  it("accepts equivalent values expressed with different units", () => {
    expect(areNetContentsEquivalent("750 mL", "25.4 fl oz")).toBe(true);
  });

  it.each([
    ["1 L", "750 mL", false],
    ["2 L", "1.75 L", false],
    ["0.75 L", "750 mL", true],
    ["12 FL. OZ.", "355 mL", true],
  ])("compares %s and %s without over-allowing rounding", (first, second, expected) => {
    expect(areNetContentsEquivalent(first, second)).toBe(expected);
  });

  it("rejects a materially different volume", () => {
    expect(areNetContentsEquivalent("750 mL", "700 mL")).toBe(false);
  });
});
