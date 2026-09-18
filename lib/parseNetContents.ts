const MILLILITERS_PER_US_FLUID_OUNCE = 29.5735295625;

export interface ParsedNetContents {
  milliliters: number;
  toleranceMilliliters: number;
}

export function parseNetContents(
  value: string | null | undefined,
): ParsedNetContents | null {
  if (!value) {
    return null;
  }

  const match = value
    .trim()
    .match(/(\d+(?:\.\d+)?)\s*(ml|milliliters?|l|liters?|fl\.?\s*oz|oz)\b/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return null;
  }

  const unit = match[2].toLocaleLowerCase("en-US").replace(/\s+/g, "");
  const decimalPlaces = (match[1].split(".")[1] ?? "").length;
  const displayedIncrement = 10 ** -decimalPlaces;

  if (unit === "ml" || unit === "milliliter" || unit === "milliliters") {
    return {
      milliliters: amount,
      toleranceMilliliters: displayedIncrement / 2,
    };
  }

  if (unit === "l" || unit === "liter" || unit === "liters") {
    return {
      milliliters: amount * 1000,
      toleranceMilliliters: (displayedIncrement * 1000) / 2,
    };
  }

  if (unit === "floz" || unit === "fl.oz" || unit === "oz") {
    return {
      milliliters: amount * MILLILITERS_PER_US_FLUID_OUNCE,
      toleranceMilliliters:
        (displayedIncrement * MILLILITERS_PER_US_FLUID_OUNCE) / 2,
    };
  }

  return null;
}

export function areNetContentsEquivalent(
  first: string | null | undefined,
  second: string | null | undefined,
): boolean {
  const firstParsed = parseNetContents(first);
  const secondParsed = parseNetContents(second);

  if (!firstParsed || !secondParsed) {
    return false;
  }

  const difference = Math.abs(firstParsed.milliliters - secondParsed.milliliters);
  const allowedDifference =
    firstParsed.toleranceMilliliters + secondParsed.toleranceMilliliters;

  return difference <= allowedDifference;
}
