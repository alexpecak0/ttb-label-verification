import { describe, expect, it } from "vitest";

import { GOVERNMENT_WARNING } from "../lib/constants";
import { checkGovernmentWarning } from "../lib/warning";
import type { WarningExtraction } from "../lib/types";

function compliantWarning(): WarningExtraction {
  return {
    transcription: { value: GOVERNMENT_WARNING, confidence: 0.99 },
    prefixIsUppercase: { value: true, confidence: 0.99 },
    prefixIsBold: { value: true, confidence: 0.99 },
    remainderIsBold: { value: false, confidence: 0.99 },
  };
}

describe("checkGovernmentWarning", () => {
  it("passes the canonical wording and required styling", () => {
    expect(checkGovernmentWarning(compliantWarning()).map(({ status }) => status)).toEqual([
      "pass",
      "pass",
      "pass",
      "pass",
    ]);
  });

  it("fails a paraphrase even when the model believes it is clear", () => {
    const warning = compliantWarning();
    warning.transcription.value = "GOVERNMENT WARNING: Please drink responsibly.";

    expect(checkGovernmentWarning(warning)[0]).toMatchObject({ status: "fail" });
  });

  it("accepts a fully capitalized transcription when every word is canonical", () => {
    const warning = compliantWarning();
    warning.transcription.value = GOVERNMENT_WARNING.toUpperCase();

    expect(checkGovernmentWarning(warning)[0]).toMatchObject({ status: "pass" });
  });

  it("fails the caps sub-check when a confident transcription uses title case", () => {
    const warning = compliantWarning();
    warning.transcription.value = GOVERNMENT_WARNING.replace(
      "GOVERNMENT WARNING:",
      "Government Warning:",
    );
    warning.prefixIsUppercase.value = true;

    expect(checkGovernmentWarning(warning)[1]).toMatchObject({ status: "fail" });
  });

  it("sends an uncertain boldness observation to review", () => {
    const warning = compliantWarning();
    warning.prefixIsBold.confidence = 0.7;

    expect(checkGovernmentWarning(warning)[2]).toMatchObject({ status: "review" });
  });

  it("sends an unavailable boldness observation to review", () => {
    const warning = compliantWarning();
    warning.prefixIsBold.value = null;

    expect(checkGovernmentWarning(warning)[2]).toMatchObject({ status: "review" });
  });

  it("fails when the entire warning is confidently observed as bold", () => {
    const warning = compliantWarning();
    warning.remainderIsBold.value = true;

    expect(checkGovernmentWarning(warning)[3]).toMatchObject({ status: "fail" });
  });
});
