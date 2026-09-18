import { describe, expect, it } from "vitest";

import { parseAbvPercent } from "../lib/parseAbv";

describe("parseAbvPercent", () => {
  it("extracts ABV without treating proof as the ABV", () => {
    expect(parseAbvPercent("45% Alc./Vol. (90 Proof)")).toBe(45);
  });

  it("does not infer ABV from proof-only text", () => {
    expect(parseAbvPercent("90 Proof")).toBeNull();
  });

  it("returns null for text without a percentage", () => {
    expect(parseAbvPercent("Premium whiskey")).toBeNull();
  });
});
