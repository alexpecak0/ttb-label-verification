export function normalizeText(value: string): string {
  return value
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}
