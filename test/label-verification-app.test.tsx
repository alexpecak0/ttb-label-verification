// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LabelVerificationApp } from "../components/label-verification-app";

describe("LabelVerificationApp", () => {
  it("loads the bundled sample details and image together", async () => {
    const user = userEvent.setup();
    const loadSample = async () =>
      new File(["fixture"], "sample-label.png", { type: "image/png" });

    render(<LabelVerificationApp loadSample={loadSample} />);

    await user.click(screen.getByRole("button", { name: "Load sample" }));

    expect(await screen.findByDisplayValue("Stone's Throw")).toBeInTheDocument();
    expect(screen.getByDisplayValue("750 mL")).toBeInTheDocument();
    expect(screen.getByText("sample-label.png")).toBeInTheDocument();
  });
});
