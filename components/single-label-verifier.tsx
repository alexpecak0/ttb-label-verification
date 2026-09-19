"use client";

import { useState } from "react";

import { prepareImage } from "../lib/downscale";
import type { ApplicationData, LabelResult } from "../lib/types";

export interface VerificationResponse {
  elapsedMs: number;
  result: LabelResult;
}

interface DisplayedVerificationResponse extends VerificationResponse {
  endToEndElapsedMs: number;
}

export type VerifyLabel = (
  file: File,
  application: ApplicationData,
) => Promise<VerificationResponse>;

async function verifySelectedFile(
  file: File,
  application: ApplicationData,
): Promise<VerificationResponse> {
  const image = await prepareImage(file);
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, application }),
  });

  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "We could not verify this label. Please try again.";
    throw new Error(message);
  }

  return body as VerificationResponse;
}

export function SingleLabelVerifier({
  application,
  file,
  onFileChange,
  verify = verifySelectedFile,
}: {
  application: ApplicationData;
  file: File | null;
  onFileChange: (file: File | null) => void;
  verify?: VerifyLabel;
}) {
  const [response, setResponse] = useState<DisplayedVerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleVerify() {
    if (!file) {
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResponse(null);
    try {
      const startedAt = performance.now();
      const output = await verify(file, application);
      setResponse({
        ...output,
        endToEndElapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not verify this label. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section>
      <h2>Verify one label</h2>
      <p>Choose a JPEG or PNG label image to compare against these application details.</p>
      <label htmlFor="label-image">Choose label image</label>
      <input
        accept="image/jpeg,image/png"
        id="label-image"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        type="file"
      />
      {file ? <p>{file.name}</p> : null}
      <button disabled={!file || isVerifying} onClick={handleVerify} type="button">
        {isVerifying ? "Verifying…" : "Verify label"}
      </button>
      <p aria-live="polite">{isVerifying ? "Preparing and verifying label…" : ""}</p>
      {error ? <p role="alert">{error}</p> : null}
      {response ? <pre>{JSON.stringify(response, null, 2)}</pre> : null}
    </section>
  );
}
