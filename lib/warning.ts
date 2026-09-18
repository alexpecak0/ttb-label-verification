import { CONFIDENCE_THRESHOLD, GOVERNMENT_WARNING } from "./constants";
import type { FieldResult, WarningExtraction } from "./types";

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function resultForBoolean(
  field: string,
  observation: WarningExtraction[keyof Omit<WarningExtraction, "transcription">],
  expected: boolean,
  reason: string,
): FieldResult {
  if (observation.confidence < CONFIDENCE_THRESHOLD) {
    return {
      field,
      check: "presence",
      status: "review",
      labelValue: observation.value,
      applicationValue: expected,
      reason: `${reason} could not be determined with sufficient confidence.`,
    };
  }

  return {
    field,
    check: "presence",
    status: observation.value === expected ? "pass" : "fail",
    labelValue: observation.value,
    applicationValue: expected,
    reason,
  };
}

export function checkGovernmentWarning(
  warning: WarningExtraction,
): FieldResult[] {
  const transcription = warning.transcription;
  const wording: FieldResult =
    transcription.confidence < CONFIDENCE_THRESHOLD
      ? {
          field: "governmentWarningWording",
          check: "presence",
          status: "review",
          labelValue: transcription.value,
          applicationValue: GOVERNMENT_WARNING,
          reason: "Warning wording could not be transcribed with sufficient confidence.",
        }
      : {
          field: "governmentWarningWording",
          check: "presence",
          status:
            transcription.value !== null &&
            collapseWhitespace(transcription.value) === GOVERNMENT_WARNING
              ? "pass"
              : "fail",
          labelValue: transcription.value,
          applicationValue: GOVERNMENT_WARNING,
          reason: "Warning wording must exactly match the canonical text, aside from layout whitespace.",
        };

  return [
    wording,
    resultForBoolean(
      "governmentWarningPrefixUppercase",
      warning.prefixIsUppercase,
      true,
      "The GOVERNMENT WARNING prefix must be uppercase.",
    ),
    resultForBoolean(
      "governmentWarningPrefixBold",
      warning.prefixIsBold,
      true,
      "The GOVERNMENT WARNING prefix must be bold.",
    ),
    resultForBoolean(
      "governmentWarningRemainderNotBold",
      warning.remainderIsBold,
      false,
      "The warning text after the prefix must not be bold.",
    ),
  ];
}
