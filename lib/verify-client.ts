import { prepareImage } from "./downscale";
import type { ApplicationData, LabelResult } from "./types";

export interface VerificationResponse {
  elapsedMs: number;
  result: LabelResult;
}

export async function verifyLabel(
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
