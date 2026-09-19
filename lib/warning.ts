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
  if (observation.value === null || observation.confidence < CONFIDENCE_THRESHOLD) {
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

function checkPrefixUppercase(warning: WarningExtraction): FieldResult {
  const reason = "The GOVERNMENT WARNING prefix must be uppercase.";
  if (
    warning.transcription.confidence < CONFIDENCE_THRESHOLD ||
    warning.prefixIsUppercase.confidence < CONFIDENCE_THRESHOLD
  ) {
    return {
      field: "governmentWarningPrefixUppercase",
      check: "presence",
      status: "review",
      labelValue: warning.transcription.value,
      applicationValue: true,
      reason: `${reason} It could not be determined with sufficient confidence.`,
    };
  }

  if (
    warning.transcription.value !== null &&
    !/^GOVERNMENT\s+WARNING\b/.test(collapseWhitespace(warning.transcription.value))
  ) {
    return {
      field: "governmentWarningPrefixUppercase",
      check: "presence",
      status: "fail",
      labelValue: warning.transcription.value,
      applicationValue: true,
      reason,
    };
  }

  return resultForBoolean(
    "governmentWarningPrefixUppercase",
    warning.prefixIsUppercase,
    true,
    reason,
  );
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
            collapseWhitespace(transcription.value).toUpperCase() ===
              GOVERNMENT_WARNING.toUpperCase()
              ? "pass"
              : "fail",
          labelValue: transcription.value,
          applicationValue: GOVERNMENT_WARNING,
          reason: "Warning wording must exactly match the canonical text, aside from letter case and layout whitespace.",
        };

  return [
    wording,
    checkPrefixUppercase(warning),
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
