import type { ApplicationData } from "./types";

export const EMPTY_APPLICATION: ApplicationData = {
  brandName: null,
  classType: null,
  producerBottler: null,
  countryOfOrigin: null,
  abv: null,
  netContents: null,
  isImported: false,
};

export const SAMPLE_APPLICATION: ApplicationData = {
  brandName: "Stone's Throw",
  classType: "Kentucky Straight Bourbon Whiskey",
  producerBottler: "Stone's Throw Distilling & Co., Frankfort, Kentucky",
  countryOfOrigin: "United States",
  abv: "45% Alc./Vol.",
  netContents: "750 mL",
  isImported: false,
};
