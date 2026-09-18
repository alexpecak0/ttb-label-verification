import { describe, expect, it } from "vitest";

import { GOVERNMENT_WARNING } from "../lib/constants";
import { compareLabel } from "../lib/compare";
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

function compliantLabel(): LabelExtraction {
  return {
    brandName: "STONE'S THROW",
    classType: "bourbon whiskey",
    producerBottler: "Stone’s Throw Distilling and Co.",
    countryOfOrigin: null,
    abv: "45% Alc./Vol. (90 Proof)",
    netContents: "25.4 fl oz",
    governmentWarning: {
      transcription: { value: GOVERNMENT_WARNING, confidence: 0.99 },
      prefixIsUppercase: { value: true, confidence: 0.99 },
      prefixIsBold: { value: true, confidence: 0.99 },
      remainderIsBold: { value: false, confidence: 0.99 },
    },
  };
}

describe("compareLabel", () => {
  it("passes normalized ordinary fields and unit-converted contents", () => {
    const result = compareLabel(compliantLabel(), application);

    expect(result.overallStatus).toBe("pass");
    expect(result.fields.find(({ field }) => field === "countryOfOrigin")).toMatchObject({
      status: "not_applicable",
    });
  });

  it("treats an unavailable ordinary field as not provided", () => {
    const label = compliantLabel();
    label.brandName = null;

    expect(compareLabel(label, application).fields[0]).toMatchObject({
      status: "not_provided",
    });
  });

  it("requires country of origin for imported products", () => {
    const importedApplication = { ...application, isImported: true };

    expect(
      compareLabel(compliantLabel(), importedApplication).fields.find(
        ({ field }) => field === "countryOfOrigin",
      ),
    ).toMatchObject({ status: "fail" });
  });

  it("uses worst-status aggregation", () => {
    const label = compliantLabel();
    label.abv = "40% Alc./Vol.";
    label.governmentWarning.prefixIsBold.confidence = 0.7;

    expect(compareLabel(label, application).overallStatus).toBe("fail");
  });

  it("returns review when all evaluated checks are uncertain", () => {
    const label = compliantLabel();
    label.governmentWarning.prefixIsBold.confidence = 0.7;

    expect(compareLabel(label, application).overallStatus).toBe("review");
  });
});
