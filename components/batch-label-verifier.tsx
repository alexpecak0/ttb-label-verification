"use client";

import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { createBatchItems, runBatch } from "../lib/batch";
import type { BatchItem } from "../lib/batch";
import { createBatchCsv } from "../lib/export-csv";
import { validateLabelFiles } from "../lib/file-validation";
import type { ApplicationData } from "../lib/types";
import { verifyLabel } from "../lib/verify-client";
import type { VerificationResponse } from "../lib/verify-client";
import { StatusBadge } from "./status-badge";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const files = items.map((item) => item.file);

  function chooseFiles(nextFiles: FileList | File[]) {
    const validation = validateLabelFiles(Array.from(nextFiles));
    setSelectionError(validation.error);
    onItemsChange(createBatchItems<VerificationResponse>(validation.accepted));
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleVerify() {
    if (files.length === 0) {
      return;
    }

    setIsVerifying(true);
    onItemsChange((previousItems) =>
      createBatchItems<VerificationResponse>(previousItems.map((item) => item.file)),
    );
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

  async function retryItem(item: BatchItem<VerificationResponse>) {
    onItemsChange((previousItems) =>
      previousItems.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, progress: "running", error: undefined, result: undefined }
          : currentItem,
      ),
    );

    try {
      const startedAt = performance.now();
      const result = await verify(item.file, application);
      onItemsChange((previousItems) =>
        previousItems.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, progress: "done", result: { ...result, endToEndElapsedMs: Math.round(performance.now() - startedAt) } }
            : currentItem,
        ),
      );
    } catch (error) {
      onItemsChange((previousItems) =>
        previousItems.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, progress: "failed", error: error instanceof Error ? error.message : "We could not verify this label. Please try again." }
            : currentItem,
        ),
      );
    }
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
    <section aria-labelledby="batch-verifier-heading" className="glass panel">
      <div className="panel-head">
        <h2 id="batch-verifier-heading">Verify labels</h2>
        <p className="hint">
          Add one or more JPEG or PNG label images, then verify them together.
        </p>
      </div>

      <div
        aria-label="Drop label images here"
        className="drop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFiles(event.dataTransfer.files);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <p>Drop label images here</p>
        <button className="btn" onClick={openFilePicker} type="button">
          Choose label images
        </button>
        <label className="sr-only" htmlFor="label-images">Choose label images</label>
        <input
          accept="image/jpeg,image/png"
          className="sr-only"
          id="label-images"
          multiple
          onChange={(event) => chooseFiles(event.target.files ?? [])}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <p className="picked" aria-live="polite">
        {files.length === 0
          ? "No label images selected."
          : `${files.length} label image${files.length === 1 ? "" : "s"} selected.`}
      </p>
      {selectionError ? <p role="alert">{selectionError}</p> : null}
      <div className="actions">
        <button
          className="btn btn-primary"
          disabled={files.length === 0 || isVerifying}
          onClick={handleVerify}
          type="button"
        >
          {isVerifying ? "Verifying labels…" : "Verify labels"}
        </button>
        <button
          className="btn"
          disabled={!items.some((item) => item.progress === "done")}
          onClick={handleExport}
          type="button"
        >
          Export CSV
        </button>
      </div>

      {items.length > 0 ? (
        <div className="results-wrap">
          <table className="results-table">
            <caption className="results-head">Batch results</caption>
            <thead>
              <tr>
                <th>File</th>
                <th>Progress</th>
                <th>Overall status</th>
                <th>Elapsed</th>
                <th>Field</th>
                <th>Field status</th>
                <th>Reason</th>
                <th>Label value</th>
                <th>Application value</th>
              </tr>
            </thead>
            <tbody>
              {items.flatMap((item) => {
                const fields = item.result?.result.fields ?? [];
                const firstRow = (
                  <tr className="row" key={item.id}>
                    <td>{item.file.name}</td>
                    <td><StatusBadge status={item.progress} /></td>
                    <td>{item.result ? <StatusBadge status={item.result.result.overallStatus} /> : "—"}</td>
                    <td>
                      {item.result
                        ? `${item.result.endToEndElapsedMs ?? item.result.elapsedMs} ms`
                        : "—"}
                    </td>
                    <td>{fields[0]?.field ?? "—"}</td>
                    <td>{fields[0] ? <StatusBadge status={fields[0].status} /> : "—"}</td>
                    <td>{fields[0]?.reason ?? item.error ?? "—"}</td>
                    <td>{displayValue(fields[0]?.labelValue ?? null)}</td>
                    <td>{displayValue(fields[0]?.applicationValue ?? null)}</td>
                  </tr>
                );
                const remainingRows = fields.slice(1).map((field) => (
                  <tr className="row" key={`${item.id}-${field.field}`}>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td>{field.field}</td>
                    <td><StatusBadge status={field.status} /></td>
                    <td>{field.reason}</td>
                    <td>{displayValue(field.labelValue)}</td>
                    <td>{displayValue(field.applicationValue)}</td>
                  </tr>
                ));

                return [
                  firstRow,
                  ...remainingRows,
                  ...(item.progress === "failed"
                    ? [
                        <tr className="row" key={`${item.id}-retry`}>
                          <td colSpan={9}>
                            <button className="btn" onClick={() => retryItem(item)} type="button">
                              Retry {item.file.name}
                            </button>
                          </td>
                        </tr>,
                      ]
                    : []),
                ];
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
