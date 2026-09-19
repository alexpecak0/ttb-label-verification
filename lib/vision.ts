import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";
import { z } from "zod";

import type { LabelExtraction } from "./types";

const confidence = z.number().min(0).max(1);
const textObservation = z.object({
  value: z.string().nullable(),
  confidence,
});
const booleanObservation = z.object({
  value: z.boolean().nullable(),
  confidence,
});

export const VisionToolInputSchema = z.object({
  brandName: textObservation,
  classType: textObservation,
  producerBottler: textObservation,
  countryOfOrigin: textObservation,
  abv: textObservation,
  netContents: textObservation,
  governmentWarning: z.object({
    transcription: textObservation,
    prefixIsUppercase: booleanObservation,
    prefixIsBold: booleanObservation,
    remainderIsBold: booleanObservation,
  }),
});

type VisionToolInput = z.infer<typeof VisionToolInputSchema>;

export interface ExtractableImage {
  base64: string;
  mimeType: "image/jpeg" | "image/png";
}

export interface LabelExtractor {
  extractLabel(image: ExtractableImage): Promise<LabelExtraction>;
}

export class VisionExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionExtractionError";
  }
}

export function toLabelExtraction(input: VisionToolInput): LabelExtraction {
  return {
    brandName: input.brandName.value,
    classType: input.classType.value,
    producerBottler: input.producerBottler.value,
    countryOfOrigin: input.countryOfOrigin.value,
    abv: input.abv.value,
    netContents: input.netContents.value,
    fieldConfidence: {
      brandName: input.brandName.confidence,
      classType: input.classType.confidence,
      producerBottler: input.producerBottler.confidence,
      countryOfOrigin: input.countryOfOrigin.confidence,
      abv: input.abv.confidence,
      netContents: input.netContents.confidence,
    },
    governmentWarning: input.governmentWarning,
  };
}

const textObservationSchema = {
  type: "object",
  properties: {
    value: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["value", "confidence"],
  additionalProperties: false,
};

const booleanObservationSchema = {
  type: "object",
  properties: {
    value: { type: ["boolean", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["value", "confidence"],
  additionalProperties: false,
};

const LABEL_EXTRACTION_TOOL_NAME = "record_label_extraction";

const LABEL_EXTRACTION_TOOL: Tool = {
  name: LABEL_EXTRACTION_TOOL_NAME,
  description:
    "Record only what is visibly printed on an alcohol label and confidence for every observation. Do not make a compliance decision.",
  input_schema: {
    type: "object",
    properties: {
      brandName: textObservationSchema,
      classType: textObservationSchema,
      producerBottler: textObservationSchema,
      countryOfOrigin: textObservationSchema,
      abv: textObservationSchema,
      netContents: textObservationSchema,
      governmentWarning: {
        type: "object",
        properties: {
          transcription: textObservationSchema,
          prefixIsUppercase: booleanObservationSchema,
          prefixIsBold: booleanObservationSchema,
          remainderIsBold: booleanObservationSchema,
        },
        required: [
          "transcription",
          "prefixIsUppercase",
          "prefixIsBold",
          "remainderIsBold",
        ],
        additionalProperties: false,
      },
    },
    required: [
      "brandName",
      "classType",
      "producerBottler",
      "countryOfOrigin",
      "abv",
      "netContents",
      "governmentWarning",
    ],
    additionalProperties: false,
  },
};

export async function extractLabel(
  image: ExtractableImage,
): Promise<LabelExtraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new VisionExtractionError("The label extraction service is not configured.");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:
      "You are a literal visual transcription system. Never autocorrect, infer, paraphrase, or normalize text. Preserve the exact visible letters, capitalization, punctuation, and numbering character by character. You report observations only and never decide legal compliance.",
    tools: [LABEL_EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: LABEL_EXTRACTION_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: image.mimeType,
              data: image.base64,
            },
          },
          {
            type: "text",
            text:
              "Transcribe and observe this alcohol-label image. The warning transcription must be a literal visual reading, including lower- versus uppercase letters and every punctuation mark; do not apply normal English capitalization. Independently observe whether the first two warning words are uppercase, whether those words are bold, and whether the rest of the warning appears bold. Use null when a value is not visible; do not assess legal compliance.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === LABEL_EXTRACTION_TOOL_NAME,
  );

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new VisionExtractionError("The extraction service returned no structured label result.");
  }

  const parsed = VisionToolInputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new VisionExtractionError("The extraction service returned an invalid label result.");
  }

  return toLabelExtraction(parsed.data);
}
