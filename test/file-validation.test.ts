// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { validateLabelFiles } from "../lib/file-validation";

describe("validateLabelFiles", () => {
  it("keeps valid images and explains rejected types or sizes", () => {
    const result = validateLabelFiles([
      new File(["image"], "label.png", { type: "image/png" }),
      new File(["pdf"], "application.pdf", { type: "application/pdf" }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ]);

    expect(result.accepted.map((file) => file.name)).toEqual(["label.png"]);
    expect(result.error).toBe("Choose JPEG or PNG images no larger than 10 MB.");
  });
});
