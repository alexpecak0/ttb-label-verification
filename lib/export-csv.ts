import type { BatchItem } from "./batch";
import type { VerificationResponse } from "./verify-client";

export interface ExportableVerificationResponse extends VerificationResponse {
  endToEndElapsedMs?: number;
}

const header = [
  "fileName",
  "progress",
  "overallStatus",
  "elapsedMs",
  "field",
  "check",
  "status",
  "reason",
  "labelValue",
  "applicationValue",
];

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function toRow(values: Array<string | number | boolean | null | undefined>) {
  return values.map(escapeCsvValue).join(",");
}

export function createBatchCsv(
  items: Array<BatchItem<ExportableVerificationResponse>>,
) {
  const rows = [header.join(",")];

  for (const item of items) {
    const response = item.result;
    const fields = response?.result.fields ?? [];
    const elapsed = response?.endToEndElapsedMs ?? response?.elapsedMs;

    if (fields.length === 0) {
      rows.push(
        toRow([
          item.file.name,
          item.progress,
          response?.result.overallStatus,
          elapsed,
          "",
          "",
          "",
          item.error,
          "",
          "",
        ]),
      );
      continue;
    }

    for (const field of fields) {
      rows.push(
        toRow([
          item.file.name,
          item.progress,
          response?.result.overallStatus,
          elapsed,
          field.field,
          field.check,
          field.status,
          field.reason,
          field.labelValue,
          field.applicationValue,
        ]),
      );
    }
  }

  return rows.join("\r\n");
}
