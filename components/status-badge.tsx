import type { BatchProgress } from "../lib/batch";
import type { FieldStatus } from "../lib/types";

type DisplayStatus = BatchProgress | FieldStatus;

const statusPresentation: Record<DisplayStatus, { icon: string; className: string }> = {
  pass: { icon: "✓", className: "bg-emerald-100 text-emerald-950" },
  fail: { icon: "✕", className: "bg-red-100 text-red-950" },
  review: { icon: "!", className: "bg-amber-100 text-amber-950" },
  not_provided: { icon: "—", className: "bg-slate-200 text-slate-950" },
  not_applicable: { icon: "—", className: "bg-slate-200 text-slate-950" },
  queued: { icon: "○", className: "bg-slate-200 text-slate-950" },
  running: { icon: "↻", className: "bg-blue-100 text-blue-950" },
  done: { icon: "✓", className: "bg-emerald-100 text-emerald-950" },
  failed: { icon: "✕", className: "bg-red-100 text-red-950" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const presentation = statusPresentation[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${presentation.className}`}>
      <span aria-hidden="true">{presentation.icon}</span>
      <span>{status.replaceAll("_", " ")}</span>
    </span>
  );
}
