"use client";

import { useState } from "react";

import { ApplicationForm } from "./application-form";
import { SingleLabelVerifier } from "./single-label-verifier";
import { EMPTY_APPLICATION, SAMPLE_APPLICATION } from "../lib/sample-application";
import type { ApplicationData } from "../lib/types";

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
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  async function handleLoadSample() {
    setIsLoadingSample(true);
    setSampleError(null);
    try {
      const sampleFile = await loadSample();
      setApplication(SAMPLE_APPLICATION);
      setFile(sampleFile);
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
    <div className="grid gap-8">
      <ApplicationForm
        isLoadingSample={isLoadingSample}
        onChange={setApplication}
        onLoadSample={handleLoadSample}
        value={application}
      />
      {sampleError ? <p role="alert">{sampleError}</p> : null}
      <SingleLabelVerifier
        application={application}
        file={file}
        onFileChange={setFile}
      />
    </div>
  );
}
