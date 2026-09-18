export function parseAbvPercent(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    return null;
  }

  const percentage = Number(match[1]);
  return Number.isFinite(percentage) ? percentage : null;
}
