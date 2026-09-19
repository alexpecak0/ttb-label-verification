import { compareLabel } from "./compare";
import {
  extractLabel,
  type ExtractableImage,
  type LabelExtractor,
  VisionExtractionError,
} from "./vision";
import type { ApplicationData, LabelResult } from "./types";

export interface VerifyOneResult {
  elapsedMs: number;
  result: LabelResult;
}

const anthropicExtractor: LabelExtractor = { extractLabel };

export function createExtractionReview(): LabelResult {
  return {
    overallStatus: "review",
    fields: [
      {
        field: "Label extraction",
        check: "presence",
        status: "review",
        labelValue: null,
        applicationValue: null,
        reason:
          "We could not reliably read this label. Please review the image manually or upload a clearer image.",
      },
    ],
  };
}

export async function verifyOne(
  image: ExtractableImage,
  application: ApplicationData,
  extractor: LabelExtractor = anthropicExtractor,
): Promise<VerifyOneResult> {
  const startedAt = performance.now();
  try {
    const extraction = await extractor.extractLabel(image);
    const result = compareLabel(extraction, application);

    return {
      result,
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    if (!(error instanceof VisionExtractionError)) {
      throw error;
    }

    return {
      result: createExtractionReview(),
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  }
}
