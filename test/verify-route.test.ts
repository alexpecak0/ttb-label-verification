import { afterEach, describe, expect, it } from "vitest";

import { POST } from "../app/api/verify/route";

const originalApiKey = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
});

const validApplication = {
  brandName: null,
  classType: null,
  producerBottler: null,
  countryOfOrigin: null,
  abv: null,
  netContents: null,
  isImported: false,
};

describe("POST /api/verify", () => {
  it("rejects an incomplete one-label request before extraction", async () => {
    const response = await POST(
      new Request("http://localhost/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: { base64: "abc", mimeType: "image/jpeg" } }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Provide one prepared label image and its application details.",
    });
  });

  it("rejects an oversized image payload before extraction", async () => {
    const response = await POST(
      new Request("http://localhost/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: {
            base64: "a".repeat(4 * 1024 * 1024 + 1),
            mimeType: "image/jpeg",
          },
          application: validApplication,
        }),
      }),
    );

    expect(response.status).toBe(413);
  });

  it("reports an unconfigured extraction service instead of a label review", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const response = await POST(
      new Request("http://localhost/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: { base64: "fixture", mimeType: "image/jpeg" },
          application: validApplication,
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "Label extraction is temporarily unavailable. Please contact the app administrator.",
    });
  });
});
