// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SingleLabelVerifier } from "../components/single-label-verifier";
import type { VerificationResponse } from "../components/single-label-verifier";

describe("SingleLabelVerifier", () => {
  it("uploads one image and renders the raw verification response", async () => {
    const user = userEvent.setup();
    const verify = async (): Promise<VerificationResponse> => ({
      result: { overallStatus: "pass", fields: [] },
      elapsedMs: 123,
    });

    render(<SingleLabelVerifier verify={verify} />);
    await user.upload(
      screen.getByLabelText("Choose label image"),
      new File(["fixture"], "label.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Verify label" }));

    expect(await screen.findByText(/"overallStatus": "pass"/)).toBeInTheDocument();
    expect(screen.getByText(/"endToEndElapsedMs": \d+/)).toBeInTheDocument();
  });
});
