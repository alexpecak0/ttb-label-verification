import { compareLabel } from "./compare";
import { extractLabel, type ExtractableImage, type LabelExtractor } from "./vision";
import type { ApplicationData, LabelResult } from "./types";

export interface VerifyOneResult {
  elapsedMs: number;
  result: LabelResult;
}

const anthropicExtractor: LabelExtractor = { extractLabel };

export async function verifyOne(
  image: ExtractableImage,
  application: ApplicationData,
  extractor: LabelExtractor = anthropicExtractor,
): Promise<VerifyOneResult> {
  const startedAt = performance.now();
  const extraction = await extractor.extractLabel(image);
  const result = compareLabel(extraction, application);

  return {
    result,
    elapsedMs: Math.round(performance.now() - startedAt),
  };
}
