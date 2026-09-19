"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { createBatchItems, runBatch } from "../lib/batch";
import type { BatchItem } from "../lib/batch";
import { createBatchCsv } from "../lib/export-csv";
import type { ApplicationData } from "../lib/types";
import { verifyLabel } from "../lib/verify-client";
import type { VerificationResponse } from "../lib/verify-client";

export type VerifyLabels = (
  file: File,
  application: ApplicationData,
) => Promise<VerificationResponse>;

interface BatchLabelVerifierProps {
  application: ApplicationData;
  items: BatchItem<VerificationResponse>[];
  onItemsChange: Dispatch<SetStateAction<BatchItem<VerificationResponse>[]>>;
  verify?: VerifyLabels;
}

function displayValue(value: string | boolean | null) {
  if (value === null) {
    return "—";
  }
  return String(value);
}

export function BatchLabelVerifier({
  application,
  items,
  onItemsChange,
  verify = verifyLabel,
}: BatchLabelVerifierProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const files = items.map((item) => item.file);

  function chooseFiles(nextFiles: FileList | File[]) {
    onItemsChange(createBatchItems<VerificationResponse>(Array.from(nextFiles)));
  }

  async function handleVerify() {
    if (files.length === 0) {
      return;
    }

    setIsVerifying(true);
    onItemsChange(createBatchItems<VerificationResponse>(files));
    await runBatch(
      files,
      async (file) => {
        const startedAt = performance.now();
        const response = await verify(file, application);
        return {
          ...response,
          endToEndElapsedMs: Math.round(performance.now() - startedAt),
        };
      },
      (updatedItem) => {
        onItemsChange((previousItems) =>
          previousItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item,
          ),
        );
      },
    );
    setIsVerifying(false);
  }

  function handleExport() {
    const csv = createBatchCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ttb-label-verification-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="batch-verifier-heading">
      <h2 className="text-xl font-semibold" id="batch-verifier-heading">
        Verify labels
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Add one or more JPEG or PNG label images, then verify them together.
      </p>

      <div
        className="mt-4 rounded border-2 border-dashed border-slate-300 p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFiles(event.dataTransfer.files);
        }}
      >
        <p>Drop label images here</p>
        <label className="mt-3 inline-block cursor-pointer rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" htmlFor="label-images">
          Choose label images
        </label>
        <input
          accept="image/jpeg,image/png"
          className="sr-only"
          id="label-images"
          multiple
          onChange={(event) => chooseFiles(event.target.files ?? [])}
          type="file"
        />
      </div>

      <p className="mt-3" aria-live="polite">
        {files.length === 0
          ? "No label images selected."
          : `${files.length} label image${files.length === 1 ? "" : "s"} selected.`}
      </p>
      <button
        className="mt-3 rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={files.length === 0 || isVerifying}
        onClick={handleVerify}
        type="button"
      >
        {isVerifying ? "Verifying labels…" : "Verify labels"}
      </button>
      <button
        className="ml-3 rounded border border-slate-300 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!items.some((item) => item.progress === "done")}
        onClick={handleExport}
        type="button"
      >
        Export CSV
      </button>

      {items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="mb-2 text-left font-semibold">Batch results</caption>
            <thead>
              <tr className="border-b border-slate-300">
                <th className="p-2">File</th>
                <th className="p-2">Progress</th>
                <th className="p-2">Overall status</th>
                <th className="p-2">Elapsed</th>
                <th className="p-2">Field</th>
                <th className="p-2">Field status</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Label value</th>
                <th className="p-2">Application value</th>
              </tr>
            </thead>
            <tbody>
              {items.flatMap((item) => {
                const fields = item.result?.result.fields ?? [];
                const firstRow = (
                  <tr className="border-b border-slate-200" key={item.id}>
                    <td className="p-2">{item.file.name}</td>
                    <td className="p-2">{item.progress}</td>
                    <td className="p-2">{item.result?.result.overallStatus ?? "—"}</td>
                    <td className="p-2">
                      {item.result
                        ? `${item.result.endToEndElapsedMs ?? item.result.elapsedMs} ms`
                        : "—"}
                    </td>
                    <td className="p-2">{fields[0]?.field ?? "—"}</td>
                    <td className="p-2">{fields[0]?.status ?? "—"}</td>
                    <td className="p-2">{fields[0]?.reason ?? item.error ?? "—"}</td>
                    <td className="p-2">{displayValue(fields[0]?.labelValue ?? null)}</td>
                    <td className="p-2">{displayValue(fields[0]?.applicationValue ?? null)}</td>
                  </tr>
                );
                const remainingRows = fields.slice(1).map((field) => (
                  <tr className="border-b border-slate-200" key={`${item.id}-${field.field}`}>
                    <td className="p-2" />
                    <td className="p-2" />
                    <td className="p-2" />
                    <td className="p-2" />
                    <td className="p-2">{field.field}</td>
                    <td className="p-2">{field.status}</td>
                    <td className="p-2">{field.reason}</td>
                    <td className="p-2">{displayValue(field.labelValue)}</td>
                    <td className="p-2">{displayValue(field.applicationValue)}</td>
                  </tr>
                ));

                return [firstRow, ...remainingRows];
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
