"use client";

import type { ApplicationData } from "../lib/types";

interface ApplicationFormProps {
  value: ApplicationData;
  onChange: (application: ApplicationData) => void;
  onLoadSample: () => void;
  isLoadingSample?: boolean;
}

interface TextField {
  key: Exclude<keyof ApplicationData, "isImported">;
  label: string;
  type?: "text";
}

const textFields: TextField[] = [
  { key: "brandName", label: "Brand name" },
  { key: "classType", label: "Class or type" },
  { key: "abv", label: "Alcohol content" },
  { key: "netContents", label: "Net contents" },
  {
    key: "producerBottler",
    label: "Producer or bottler name and address",
  },
  { key: "countryOfOrigin", label: "Country of origin" },
];

export function ApplicationForm({
  value,
  onChange,
  onLoadSample,
  isLoadingSample = false,
}: ApplicationFormProps) {
  function updateTextField(key: TextField["key"], input: string) {
    onChange({ ...value, [key]: input.trim() === "" ? null : input });
  }

  return (
    <section aria-labelledby="application-details-heading">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" id="application-details-heading">
            Application details
          </h2>
          <p className="mt-1 text-slate-700">
            Enter the submitted application values to compare with the label.
          </p>
        </div>
        <button
          className="rounded border border-slate-700 px-4 py-3 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoadingSample}
          onClick={onLoadSample}
          type="button"
        >
          {isLoadingSample ? "Loading sample…" : "Load sample"}
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        {textFields.map((field) => (
          <div key={field.key}>
            <label className="block font-medium" htmlFor={field.key}>
              {field.label}
            </label>
            <input
              className="mt-1 w-full rounded border border-slate-700 px-3 py-3"
              id={field.key}
              onChange={(event) => updateTextField(field.key, event.target.value)}
              required={field.key === "countryOfOrigin" && value.isImported}
              type="text"
              value={value[field.key] ?? ""}
            />
          </div>
        ))}
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 font-medium" htmlFor="is-imported">
        <input
          checked={value.isImported}
          id="is-imported"
          onChange={(event) => onChange({ ...value, isImported: event.target.checked })}
          type="checkbox"
        />
        Imported product
      </label>
    </section>
  );
}
