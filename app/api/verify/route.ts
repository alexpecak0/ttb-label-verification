import { z } from "zod";

import { verifyOne } from "../../../lib/verify-one";
import { VisionServiceConfigurationError } from "../../../lib/vision";

const MAX_BASE64_IMAGE_CHARACTERS = 4 * 1024 * 1024;

export const runtime = "nodejs";

const verifyRequestSchema = z.object({
  image: z.object({
    base64: z.string().min(1).max(MAX_BASE64_IMAGE_CHARACTERS),
    mimeType: z.enum(["image/jpeg", "image/png"]),
    fileName: z.string().min(1).max(255).optional(),
  }),
  application: z.object({
    brandName: z.string().nullable(),
    classType: z.string().nullable(),
    producerBottler: z.string().nullable(),
    countryOfOrigin: z.string().nullable(),
    abv: z.string().nullable(),
    netContents: z.string().nullable(),
    isImported: z.boolean(),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Provide one prepared label image and its application details." },
      { status: 400 },
    );
  }

  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    const hasOversizedImage = parsed.error.issues.some(
      (issue) => issue.path.join(".") === "image.base64" && issue.code === "too_big",
    );
    return Response.json(
      {
        error: hasOversizedImage
          ? "Choose a smaller or more tightly cropped image before verifying."
          : "Provide one prepared label image and its application details.",
      },
      { status: hasOversizedImage ? 413 : 400 },
    );
  }

  try {
    const output = await verifyOne(parsed.data.image, parsed.data.application);
    return Response.json(output);
  } catch (error) {
    if (error instanceof VisionServiceConfigurationError) {
      return Response.json(
        {
          error:
            "Label extraction is temporarily unavailable. Please contact the app administrator.",
        },
        { status: 503 },
      );
    }

    return Response.json(
      {
        error:
          "We could not read this label. Please try a clear, well-lit image with the full warning visible.",
      },
      { status: 502 },
    );
  }
}
