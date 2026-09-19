// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createBatchCsv } from "../lib/export-csv";

describe("createBatchCsv", () => {
  it("includes each field's status, reason, and extracted label value", () => {
    const csv = createBatchCsv([
      {
        id: "label-0",
        file: new File(["image"], "label.png", { type: "image/png" }),
        progress: "done" as const,
        result: {
          elapsedMs: 123,
          endToEndElapsedMs: 321,
          result: {
            overallStatus: "fail" as const,
            fields: [
              {
                field: "Brand name",
                check: "match" as const,
                status: "fail" as const,
                reason: "Brand differs",
                labelValue: "STONE'S THROW",
                applicationValue: "Stone's Throw",
              },
            ],
          },
        },
      },
    ]);

    expect(csv).toContain(
      "label.png,done,fail,321,Brand name,match,fail,Brand differs,STONE'S THROW,Stone's Throw",
    );
  });

  it("escapes commas and quotes in a field reason", () => {
    const csv = createBatchCsv([
      {
        id: "label-0",
        file: new File(["image"], "label.png", { type: "image/png" }),
        progress: "failed" as const,
        error: 'Try again, then click "Verify labels".',
      },
    ]);

    expect(csv).toContain('"Try again, then click ""Verify labels""."');
  });
});
