// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SingleLabelVerifier } from "../components/single-label-verifier";
import type { VerificationResponse } from "../components/single-label-verifier";
import { SAMPLE_APPLICATION } from "../lib/sample-application";

describe("SingleLabelVerifier", () => {
  it("uploads one image and renders the raw verification response", async () => {
    const user = userEvent.setup();
    const file = new File(["fixture"], "label.png", { type: "image/png" });
    const verify = vi.fn(async (): Promise<VerificationResponse> => ({
      result: { overallStatus: "pass", fields: [] },
      elapsedMs: 123,
    }));

    render(
      <SingleLabelVerifier
        application={SAMPLE_APPLICATION}
        file={file}
        onFileChange={vi.fn()}
        verify={verify}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Verify label" }));

    expect(await screen.findByText(/"overallStatus": "pass"/)).toBeInTheDocument();
    expect(screen.getByText(/"endToEndElapsedMs": \d+/)).toBeInTheDocument();
    expect(verify).toHaveBeenCalledWith(file, SAMPLE_APPLICATION);
  });
});
