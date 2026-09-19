import { describe, expect, it } from "vitest";

import { calculateResizeDimensions } from "../lib/downscale";

describe("calculateResizeDimensions", () => {
  it("limits landscape images to a 1600px long edge", () => {
    expect(calculateResizeDimensions(4000, 2000)).toEqual({ width: 1600, height: 800 });
  });

  it("preserves smaller image dimensions", () => {
    expect(calculateResizeDimensions(800, 1200)).toEqual({ width: 800, height: 1200 });
  });
});
