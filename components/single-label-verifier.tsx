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

export type VerifyLabel = (file: File) => Promise<VerificationResponse>;

const SAMPLE_APPLICATION: ApplicationData = {
  brandName: "Stone's Throw",
  classType: "Kentucky Straight Bourbon Whiskey",
  producerBottler: "Stone's Throw Distilling & Co., Frankfort, Kentucky",
  countryOfOrigin: "United States",
  abv: "45% Alc./Vol.",
  netContents: "750 mL",
  isImported: false,
};

async function verifySelectedFile(file: File): Promise<VerificationResponse> {
  const image = await prepareImage(file);
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, application: SAMPLE_APPLICATION }),
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
  verify = verifySelectedFile,
}: {
  verify?: VerifyLabel;
}) {
  const [file, setFile] = useState<File | null>(null);
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
      const output = await verify(file);
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
      <p>This phase uses the bundled sample application details.</p>
      <label htmlFor="label-image">Choose label image</label>
      <input
        accept="image/jpeg,image/png"
        id="label-image"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        type="file"
      />
      <button disabled={!file || isVerifying} onClick={handleVerify} type="button">
        {isVerifying ? "Verifying…" : "Verify label"}
      </button>
      <p aria-live="polite">{isVerifying ? "Preparing and verifying label…" : ""}</p>
      {error ? <p role="alert">{error}</p> : null}
      {response ? <pre>{JSON.stringify(response, null, 2)}</pre> : null}
    </section>
  );
}
