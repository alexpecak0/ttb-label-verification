import type { BatchProgress } from "../lib/batch";
import type { FieldStatus } from "../lib/types";

type DisplayStatus = BatchProgress | FieldStatus;

const statusPresentation: Record<DisplayStatus, { icon: string; tone: "pass" | "fail" | "review" | "neutral" }> = {
  pass: { icon: "✓", tone: "pass" },
  fail: { icon: "✕", tone: "fail" },
  review: { icon: "!", tone: "review" },
  not_provided: { icon: "—", tone: "neutral" },
  not_applicable: { icon: "—", tone: "neutral" },
  queued: { icon: "○", tone: "neutral" },
  running: { icon: "↻", tone: "review" },
  done: { icon: "✓", tone: "pass" },
  failed: { icon: "✕", tone: "fail" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const presentation = statusPresentation[status];

  return (
    <span className={`chip ${presentation.tone}`}>
      <span aria-hidden="true">{presentation.icon}</span>
      <span>{status.replaceAll("_", " ")}</span>
    </span>
  );
}
