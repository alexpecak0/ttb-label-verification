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
    <section aria-labelledby="application-details-heading" className="glass panel">
      <div className="panel-head flex items-center justify-between gap-4">
        <div>
          <h2 id="application-details-heading">
            Application details
          </h2>
          <p className="hint">
            Enter the submitted application values to compare with the label.
          </p>
        </div>
        <button
          className="btn"
          disabled={isLoadingSample}
          onClick={onLoadSample}
          type="button"
        >
          {isLoadingSample ? "Loading sample…" : "Load sample"}
        </button>
      </div>

      <div className="fields">
        {textFields.map((field) => (
          <div className={`field${field.key === "producerBottler" ? " full" : ""}`} key={field.key}>
            <label htmlFor={field.key}>
              {field.label}
            </label>
            <input
              className="input"
              id={field.key}
              onChange={(event) => updateTextField(field.key, event.target.value)}
              required={field.key === "countryOfOrigin" && value.isImported}
              type="text"
              value={value[field.key] ?? ""}
            />
          </div>
        ))}
      </div>

      <div className="field switch-field">
        <label className="switch" htmlFor="is-imported">
          <input
            checked={value.isImported}
            id="is-imported"
            onChange={(event) => onChange({ ...value, isImported: event.target.checked })}
            type="checkbox"
          />
          Imported product
        </label>
      </div>
    </section>
  );
}
