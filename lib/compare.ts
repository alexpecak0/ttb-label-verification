import { normalizeText } from "./normalize";
import { parseAbvPercent } from "./parseAbv";
import { areNetContentsEquivalent } from "./parseNetContents";
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
      status: "fail",
      labelValue,
      applicationValue: application.countryOfOrigin,
      reason: "Imported products require country of origin on the label.",
    };
  }

  return compareText("countryOfOrigin", labelValue, application.countryOfOrigin);
}

const STATUS_RANK: Record<FieldStatus, number> = {
  pass: 0,
  not_applicable: 0,
  not_provided: 0,
  review: 1,
  fail: 2,
};

export function aggregateStatus(results: FieldResult[]): FieldStatus {
  if (results.some(({ status }) => status === "fail")) {
    return "fail";
  }

  if (results.some(({ status }) => status === "review")) {
    return "review";
  }

  return results.reduce<FieldStatus>(
    (worst, result) =>
      STATUS_RANK[result.status] > STATUS_RANK[worst] ? result.status : worst,
    "pass",
  );
}

export function compareLabel(
  label: LabelExtraction,
  application: ApplicationData,
): LabelResult {
  const fields = [
    compareText("brandName", label.brandName, application.brandName),
    compareText("classType", label.classType, application.classType),
    compareText(
      "producerBottler",
      label.producerBottler,
      application.producerBottler,
    ),
    checkCountryOfOrigin(label.countryOfOrigin, application),
    compareAbv(label.abv, application.abv),
    compareNetContents(label.netContents, application.netContents),
    ...checkGovernmentWarning(label.governmentWarning),
  ];

  return { fields, overallStatus: aggregateStatus(fields) };
}
