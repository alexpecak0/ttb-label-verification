import { afterEach, describe, expect, it, vi } from "vitest";

const createMessage = vi.fn();
const createdClientOptions = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    constructor(options: unknown) {
      createdClientOptions(options);
    }

    messages = { create: createMessage };
  },
}));

import { GOVERNMENT_WARNING } from "../lib/constants";
import {
  extractLabel,
  VisionToolInputSchema,
  toLabelExtraction,
} from "../lib/vision";

afterEach(() => {
  createMessage.mockReset();
  createdClientOptions.mockReset();
  delete process.env.ANTHROPIC_API_KEY;
});

const validToolInput = {
  brandName: { value: "STONE'S THROW", confidence: 0.99 },
  classType: { value: "Kentucky Straight Bourbon Whiskey", confidence: 0.99 },
  producerBottler: {
    value: "Stone's Throw Distilling & Co., Frankfort, Kentucky",
    confidence: 0.98,
  },
  countryOfOrigin: { value: "United States", confidence: 0.98 },
  abv: { value: "45% Alc./Vol. (90 Proof)", confidence: 0.99 },
  netContents: { value: "750 mL", confidence: 0.99 },
  governmentWarning: {
    transcription: { value: GOVERNMENT_WARNING, confidence: 0.99 },
    prefixIsUppercase: { value: true, confidence: 0.99 },
    prefixIsBold: { value: true, confidence: 0.99 },
    remainderIsBold: { value: false, confidence: 0.99 },
  },
};

describe("vision extraction schema", () => {
  it("rejects a partial tool result", () => {
    expect(() => VisionToolInputSchema.parse({ brandName: validToolInput.brandName })).toThrow();
  });

  it("maps validated observations to a comparison-ready extraction", () => {
    const extraction = toLabelExtraction(VisionToolInputSchema.parse(validToolInput));

    expect(extraction.brandName).toBe("STONE'S THROW");
    expect(extraction.fieldConfidence.brandName).toBe(0.99);
    expect(extraction.governmentWarning.prefixIsBold).toEqual({
      value: true,
      confidence: 0.99,
    });
  });

  it("reports provider truncation distinctly from an invalid structured result", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMessage.mockResolvedValue({ stop_reason: "max_tokens", content: [] });

    await expect(
      extractLabel({ base64: "image", mimeType: "image/jpeg" }),
    ).rejects.toThrow("The extraction response was truncated. Please retry this label.");
  });

  it("disables SDK retries so rate-limit attempts are bounded by the app", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMessage.mockResolvedValue({
      stop_reason: "end_turn",
      content: [
        {
          type: "tool_use",
          name: "record_label_extraction",
          input: validToolInput,
        },
      ],
    });

    await extractLabel({ base64: "image", mimeType: "image/jpeg" });

    expect(createdClientOptions).toHaveBeenCalledWith({
      apiKey: "test-key",
      maxRetries: 0,
    });
  });
});
