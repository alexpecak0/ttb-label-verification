// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { prepareImage } from "../lib/downscale";
import { verifyLabel } from "../lib/verify-client";
import { SAMPLE_APPLICATION } from "../lib/sample-application";

vi.mock("../lib/downscale", () => ({
  prepareImage: vi.fn(),
}));

describe("verifyLabel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the supplied application with the prepared image to the one-label route", async () => {
    vi.mocked(prepareImage).mockResolvedValue({
      base64: "prepared-image",
      fileName: "label.png",
      mimeType: "image/jpeg",
      width: 1600,
      height: 1200,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ elapsedMs: 123, result: { overallStatus: "pass", fields: [] } }),
        { status: 200 },
      ),
    );

    const response = await verifyLabel(
      new File(["image"], "label.png", { type: "image/png" }),
      SAMPLE_APPLICATION,
    );

    expect(response).toEqual({
      elapsedMs: 123,
      result: { overallStatus: "pass", fields: [] },
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image: {
          base64: "prepared-image",
          fileName: "label.png",
          mimeType: "image/jpeg",
          width: 1600,
          height: 1200,
        },
        application: SAMPLE_APPLICATION,
      }),
    });
  });
});
