import { describe, expect, it, vi } from "vitest";

import { retryOnRateLimit } from "../lib/retry";

describe("retryOnRateLimit", () => {
  it("retries a rate-limited operation with exponential delays", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("rate limited"), { status: 429 }))
      .mockResolvedValueOnce("extracted");
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(retryOnRateLimit(operation, sleep)).resolves.toBe("extracted");
    expect(sleep).toHaveBeenCalledWith(250);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
