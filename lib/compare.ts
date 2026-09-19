import { CONFIDENCE_THRESHOLD } from "./constants";
import { normalizeText } from "./normalize";
import { parseAbvPercent } from "./parseAbv";
import { areNetContentsEquivalent, parseNetContents } from "./parseNetContents";
import { checkGovernmentWarning } from "./warning";
import type {
  ApplicationData,
  FieldResult,
  FieldStatus,
  LabelExtraction,
  LabelResult,
} from "./types";

function compareText(
  field: string,
  labelValue: string | null,
  applicationValue: string | null,
  confidence: number,
): FieldResult {
  if (labelValue === null || applicationValue === null) {
    return {
      field,
      check: "match",
      status: "not_provided",
      labelValue,
      applicationValue,
      reason: "A label or application value was not provided.",
    };
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      field,
      check: "match",
      status: "review",
      labelValue,
      applicationValue,
      reason: "The label value could not be read with sufficient confidence.",
    };
  }

  return {
    field,
    check: "match",
    status:
      normalizeText(labelValue) === normalizeText(applicationValue)
        ? "pass"
        : "fail",
    labelValue,
    applicationValue,
    reason: "Values are compared case-insensitively after standard text normalization.",
  };
}

function compareAbv(
  labelValue: string | null,
  applicationValue: string | null,
  confidence: number,
): FieldResult {
  if (labelValue === null || applicationValue === null) {
    return {
      field: "abv",
      check: "match",
      status: "not_provided",
      labelValue,
      applicationValue,
      reason: "A label or application ABV was not provided.",
    };
  }

  const labelAbv = parseAbvPercent(labelValue);
  const applicationAbv = parseAbvPercent(applicationValue);
  if (labelAbv === null || applicationAbv === null) {
    return {
      field: "abv",
      check: "match",
      status: "review",
      labelValue,
      applicationValue,
      reason: "ABV could not be parsed from one of the provided values.",
    };
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      field: "abv",
      check: "match",
      status: "review",
      labelValue,
      applicationValue,
      reason: "The label ABV could not be read with sufficient confidence.",
    };
  }

  return {
    field: "abv",
    check: "match",
    status: labelAbv === applicationAbv ? "pass" : "fail",
    labelValue,
    applicationValue,
    reason: "ABV is compared as a percentage; proof is not used.",
  };
}

function compareNetContents(
  labelValue: string | null,
  applicationValue: string | null,
  confidence: number,
): FieldResult {
  if (labelValue === null || applicationValue === null) {
    return {
      field: "netContents",
      check: "match",
      status: "not_provided",
      labelValue,
      applicationValue,
      reason: "A label or application net contents value was not provided.",
    };
  }

  if (
    parseNetContents(labelValue) === null ||
    parseNetContents(applicationValue) === null
  ) {
    return {
      field: "netContents",
      check: "match",
      status: "review",
      labelValue,
      applicationValue,
      reason: "Net contents could not be parsed from one of the provided values.",
    };
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      field: "netContents",
      check: "match",
      status: "review",
      labelValue,
      applicationValue,
      reason: "The label net contents could not be read with sufficient confidence.",
    };
  }

  return {
    field: "netContents",
    check: "match",
    status: areNetContentsEquivalent(labelValue, applicationValue) ? "pass" : "fail",
    labelValue,
    applicationValue,
    reason: "Net contents are converted to milliliters before comparison.",
  };
}

function checkCountryOfOrigin(
  labelValue: string | null,
  application: ApplicationData,
  confidence: number,
): FieldResult {
  if (!application.isImported) {
    return {
      field: "countryOfOrigin",
      check: "presence",
      status: "not_applicable",
      labelValue,
      applicationValue: application.countryOfOrigin,
      reason: "Country of origin is required only for imported products.",
    };
  }

  if (labelValue === null) {
    return {
      field: "countryOfOrigin",
      check: "presence",
      status: confidence < CONFIDENCE_THRESHOLD ? "review" : "fail",
      labelValue,
      applicationValue: application.countryOfOrigin,
      reason:
        confidence < CONFIDENCE_THRESHOLD
          ? "Country of origin could not be read with sufficient confidence."
          : "Imported products require country of origin on the label.",
    };
  }

  return compareText("countryOfOrigin", labelValue, application.countryOfOrigin, confidence);
}

export function aggregateStatus(results: FieldResult[]): FieldStatus {
  if (results.some(({ status }) => status === "fail")) {
    return "fail";
  }

  if (results.some(({ status }) => status === "review")) {
    return "review";
  }

  return "pass";
}

export function compareLabel(
  label: LabelExtraction,
  application: ApplicationData,
): LabelResult {
  const fields = [
    compareText("brandName", label.brandName, application.brandName, label.fieldConfidence.brandName),
    compareText("classType", label.classType, application.classType, label.fieldConfidence.classType),
    compareText(
      "producerBottler",
      label.producerBottler,
      application.producerBottler,
      label.fieldConfidence.producerBottler,
    ),
    checkCountryOfOrigin(label.countryOfOrigin, application, label.fieldConfidence.countryOfOrigin),
    compareAbv(label.abv, application.abv, label.fieldConfidence.abv),
    compareNetContents(label.netContents, application.netContents, label.fieldConfidence.netContents),
    ...checkGovernmentWarning(label.governmentWarning),
  ];

  return { fields, overallStatus: aggregateStatus(fields) };
}
