import { describe, expect, it } from "vitest";

import { GOVERNMENT_WARNING } from "../lib/constants";
import {
  VisionToolInputSchema,
  toLabelExtraction,
} from "../lib/vision";

const validToolInput = {
  brandName: { value: "STONE'S THROW", confidence: 0.99 },
  classType: { value: "Kentucky Straight Bourbon Whiskey", confidence: 0.99 },
  producerBottler: {
    value: "Stone's Throw Distilling & Co., Frankfort, Kentucky",
    confidence: 0.98,
  },
  countryOfOrigin: { value: "United States", confidence: 0.98 },
  abv: { value: "45% Alc./Vol. (90 Proof)", confidence: 0.99 },
  netContents: { value: "750 mL", confidence: 0.99 },
  governmentWarning: {
    transcription: { value: GOVERNMENT_WARNING, confidence: 0.99 },
    prefixIsUppercase: { value: true, confidence: 0.99 },
    prefixIsBold: { value: true, confidence: 0.99 },
    remainderIsBold: { value: false, confidence: 0.99 },
  },
};

describe("vision extraction schema", () => {
  it("rejects a partial tool result", () => {
    expect(() => VisionToolInputSchema.parse({ brandName: validToolInput.brandName })).toThrow();
  });

  it("maps validated observations to a comparison-ready extraction", () => {
    const extraction = toLabelExtraction(VisionToolInputSchema.parse(validToolInput));

    expect(extraction.brandName).toBe("STONE'S THROW");
    expect(extraction.fieldConfidence.brandName).toBe(0.99);
    expect(extraction.governmentWarning.prefixIsBold).toEqual({
      value: true,
      confidence: 0.99,
    });
  });
});
