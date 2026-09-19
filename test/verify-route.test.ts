import { describe, expect, it } from "vitest";

import { POST } from "../app/api/verify/route";

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
          application: {
            brandName: null,
            classType: null,
            producerBottler: null,
            countryOfOrigin: null,
            abv: null,
            netContents: null,
            isImported: false,
          },
        }),
      }),
    );

    expect(response.status).toBe(413);
  });
});
