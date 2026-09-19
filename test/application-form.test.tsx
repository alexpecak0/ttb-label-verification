// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ApplicationForm } from "../components/application-form";
import type { ApplicationData } from "../lib/types";

const emptyApplication: ApplicationData = {
  brandName: null,
  classType: null,
  producerBottler: null,
  countryOfOrigin: null,
  abv: null,
  netContents: null,
  isImported: false,
};

function FormHarness() {
  const [application, setApplication] = useState(emptyApplication);

  return (
    <ApplicationForm
      onChange={setApplication}
      onLoadSample={vi.fn()}
      value={application}
    />
  );
}

describe("ApplicationForm", () => {
  it("requires country of origin only after Imported product is selected", async () => {
    const user = userEvent.setup();

    render(<FormHarness />);

    const country = screen.getByLabelText("Country of origin");
    expect(country).not.toBeRequired();
    expect(screen.queryByLabelText(/beverage type/i)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Imported product"));

    expect(country).toBeRequired();
  });
});
