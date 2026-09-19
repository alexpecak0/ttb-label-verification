// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { runBatch } from "../lib/batch";

describe("runBatch", () => {
  it("processes 20 labels without starting more than five at once", async () => {
    const files = Array.from(
      { length: 20 },
      (_, index) => new File(["image"], `label-${index}.png`, { type: "image/png" }),
    );
    const resolvers: Array<(value: string) => void> = [];
    const pending = files.map(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    let active = 0;
    let maximum = 0;

    const verify = async (file: File) => {
      active += 1;
      maximum = Math.max(maximum, active);
      const index = Number(file.name.match(/\d+/)?.[0]);
      const result = await pending[index];
      active -= 1;
      return result;
    };

    const batch = runBatch(files, verify, () => {});

    expect(maximum).toBe(5);
    resolvers.forEach((resolve) => resolve("verified"));
    const results = await batch;

    expect(results).toHaveLength(20);
  });

  it("records one failed label while other labels complete", async () => {
    const files = [
      new File(["image"], "failed.png", { type: "image/png" }),
      new File(["image"], "complete.png", { type: "image/png" }),
    ];

    const results = await runBatch(
      files,
      async (file) => {
        if (file.name === "failed.png") {
          throw new Error("The label could not be read.");
        }
        return "verified";
      },
      () => {},
    );

    expect(results).toMatchObject([
      { file: { name: "failed.png" }, progress: "failed", error: "The label could not be read." },
      { file: { name: "complete.png" }, progress: "done", result: "verified" },
    ]);
  });
});
