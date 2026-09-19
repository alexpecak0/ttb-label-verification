import { describe, expect, it } from "vitest";

import { GOVERNMENT_WARNING } from "../lib/constants";
import { verifyOne } from "../lib/verify-one";
import type { ApplicationData, LabelExtraction } from "../lib/types";

const application: ApplicationData = {
  brandName: "Stone's Throw",
  classType: "Bourbon Whiskey",
  producerBottler: "Stone's Throw Distilling & Co.",
  countryOfOrigin: "United States",
  abv: "45% Alc./Vol.",
  netContents: "750 mL",
  isImported: false,
};

const extraction: LabelExtraction = {
  brandName: "STONE'S THROW",
  classType: "bourbon whiskey",
  producerBottler: "Stone’s Throw Distilling and Co.",
  countryOfOrigin: null,
  abv: "45% Alc./Vol. (90 Proof)",
  netContents: "25.4 fl oz",
  fieldConfidence: {
    brandName: 0.99,
    classType: 0.99,
    producerBottler: 0.99,
    countryOfOrigin: 0.99,
    abv: 0.99,
    netContents: 0.99,
  },
  governmentWarning: {
    transcription: { value: GOVERNMENT_WARNING, confidence: 0.99 },
    prefixIsUppercase: { value: true, confidence: 0.99 },
    prefixIsBold: { value: true, confidence: 0.99 },
    remainderIsBold: { value: false, confidence: 0.99 },
  },
};

describe("verifyOne", () => {
  it("compares one extractor result and reports elapsed milliseconds", async () => {
    const output = await verifyOne(
      { base64: "fixture", mimeType: "image/jpeg" },
      application,
      { extractLabel: async () => extraction },
    );

    expect(output.result.overallStatus).toBe("pass");
    expect(output.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
