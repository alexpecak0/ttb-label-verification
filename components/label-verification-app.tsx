"use client";

import { useState } from "react";

import { ApplicationForm } from "./application-form";
import { BatchLabelVerifier } from "./batch-label-verifier";
import { createBatchItems } from "../lib/batch";
import type { BatchItem } from "../lib/batch";
import { EMPTY_APPLICATION, SAMPLE_APPLICATION } from "../lib/sample-application";
import type { ApplicationData } from "../lib/types";
import type { VerificationResponse } from "../lib/verify-client";

export type LoadSample = () => Promise<File>;

async function loadBundledSample(): Promise<File> {
  const response = await fetch("/sample-label.png");
  if (!response.ok) {
    throw new Error("We could not load the sample label. Please try again.");
  }

  const image = await response.blob();
  return new File([image], "sample-label.png", { type: "image/png" });
}

export function LabelVerificationApp({
  loadSample = loadBundledSample,
}: {
  loadSample?: LoadSample;
}) {
  const [application, setApplication] = useState<ApplicationData>(EMPTY_APPLICATION);
  const [items, setItems] = useState<BatchItem<VerificationResponse>[]>([]);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  async function handleLoadSample() {
    setIsLoadingSample(true);
    setSampleError(null);
    try {
      const sampleFile = await loadSample();
      setApplication(SAMPLE_APPLICATION);
      setItems(createBatchItems<VerificationResponse>([sampleFile]));
    } catch (caughtError) {
      setSampleError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not load the sample label. Please try again.",
      );
    } finally {
      setIsLoadingSample(false);
    }
  }

  return (
    <div className="cols">
      <ApplicationForm
        isLoadingSample={isLoadingSample}
        onChange={setApplication}
        onLoadSample={handleLoadSample}
        value={application}
      />
      <div>
        {sampleError ? <p role="alert">{sampleError}</p> : null}
        <BatchLabelVerifier
          application={application}
          items={items}
          onItemsChange={setItems}
        />
      </div>
    </div>
  );
}
