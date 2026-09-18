export type FieldStatus =
  | "pass"
  | "fail"
  | "review"
  | "not_provided"
  | "not_applicable";

export type CheckType = "match" | "presence";

export interface ConfidentValue<T> {
  value: T | null;
  confidence: number;
}

export interface WarningExtraction {
  transcription: ConfidentValue<string>;
  prefixIsUppercase: ConfidentValue<boolean>;
  prefixIsBold: ConfidentValue<boolean>;
  remainderIsBold: ConfidentValue<boolean>;
}

export interface LabelExtraction {
  brandName: string | null;
  classType: string | null;
  producerBottler: string | null;
  countryOfOrigin: string | null;
  abv: string | null;
  netContents: string | null;
  governmentWarning: WarningExtraction;
}

export interface ApplicationData {
  brandName: string | null;
  classType: string | null;
  producerBottler: string | null;
  countryOfOrigin: string | null;
  abv: string | null;
  netContents: string | null;
  isImported: boolean;
}

export interface FieldResult {
  field: string;
  check: CheckType;
  status: FieldStatus;
  labelValue: string | boolean | null;
  applicationValue: string | boolean | null;
  reason: string;
}

export interface LabelResult {
  fields: FieldResult[];
  overallStatus: FieldStatus;
}
