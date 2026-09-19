// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BatchLabelVerifier } from "../components/batch-label-verifier";
import type { BatchItem } from "../lib/batch";
import type { VerificationResponse } from "../lib/verify-client";
import { SAMPLE_APPLICATION } from "../lib/sample-application";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("BatchLabelVerifier", () => {
  afterEach(cleanup);

  it("renders a completed label while another label remains running", async () => {
    const user = userEvent.setup();
    const first = deferred<VerificationResponse>();
    const second = deferred<VerificationResponse>();
    const verify = (file: File) =>
      file.name === "first.png" ? first.promise : second.promise;

    function Harness() {
      const [items, setItems] = useState<BatchItem<VerificationResponse>[]>([]);

      return (
        <BatchLabelVerifier
          application={SAMPLE_APPLICATION}
          items={items}
          onItemsChange={setItems}
          verify={verify}
        />
      );
    }

    render(<Harness />);
    await user.upload(screen.getByLabelText("Choose label images"), [
      new File(["one"], "first.png", { type: "image/png" }),
      new File(["two"], "second.png", { type: "image/png" }),
    ]);
    await user.click(screen.getByRole("button", { name: "Verify labels" }));

    first.resolve({
      elapsedMs: 321,
      result: {
        overallStatus: "fail",
        fields: [
          {
            field: "Brand name",
            check: "match",
            status: "fail",
            reason: "Brand name differs.",
            labelValue: "STONE'S THROW",
            applicationValue: "Stone's Throw",
          },
        ],
      },
    });

    expect(await screen.findByText("done")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getAllByText("✕")[0]).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByText("fail")[0]).toBeInTheDocument();
    expect(screen.getByText("Brand name differs.")).toBeInTheDocument();
    expect(screen.getByText("STONE'S THROW")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled();
  });

  it("provides a keyboard-accessible drop zone", () => {
    function Harness() {
      const [items, setItems] = useState<BatchItem<VerificationResponse>[]>([]);
      return <BatchLabelVerifier application={SAMPLE_APPLICATION} items={items} onItemsChange={setItems} />;
    }

    render(<Harness />);
    expect(screen.getByRole("button", { name: "Drop label images here" })).toBeInTheDocument();
  });

  it("retries only a failed label", async () => {
    const user = userEvent.setup();
    let rejectFirst: (error: Error) => void = () => {};
    const firstAttempt = new Promise<VerificationResponse>((_, reject) => {
      rejectFirst = reject;
    });
    const verify = vi
      .fn()
      .mockImplementationOnce(() => firstAttempt)
      .mockResolvedValueOnce({ elapsedMs: 100, result: { overallStatus: "pass", fields: [] } });

    function Harness() {
      const [items, setItems] = useState<BatchItem<VerificationResponse>[]>([]);
      return <BatchLabelVerifier application={SAMPLE_APPLICATION} items={items} onItemsChange={setItems} verify={verify} />;
    }

    render(<Harness />);
    await user.upload(screen.getByLabelText("Choose label images"), new File(["one"], "retry.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Verify labels" }));
    rejectFirst(new Error("Try a clearer image."));
    expect(await screen.findByText("failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry retry.png" }));
    expect(await screen.findByText("done")).toBeInTheDocument();
    expect(verify).toHaveBeenCalledTimes(2);
  });
});
