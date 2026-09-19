import { mkdir, readFile, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const fixtureDirectory = resolve(root, "fixtures");
const publicDirectory = resolve(root, "public");
const templateUrl = pathToFileURL(resolve(fixtureDirectory, "label-template.html"));
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const constantsSource = await readFile(resolve(root, "lib", "constants.ts"), "utf8");
const canonicalWarning = constantsSource.match(
  /GOVERNMENT_WARNING\s*=\s*\n?\s*"([^"]+)"/,
)?.[1];

if (!canonicalWarning) {
  throw new Error("Could not read GOVERNMENT_WARNING from lib/constants.ts.");
}

const standard = {
  brand: "STONE'S THROW",
  classType: "Kentucky Straight Bourbon Whiskey",
  abv: "45% Alc./Vol. (90 Proof)",
  volume: "750 mL",
  producer: "Bottled by Stone's Throw Distilling & Co.\nFrankfort, Kentucky",
  origin: "Product of the United States",
  warning: canonicalWarning,
};

const fixtures = [
  { name: "compliant-label.png", params: standard },
  {
    name: "title-case-warning.png",
    params: { ...standard, warning: canonicalWarning.replace("GOVERNMENT WARNING:", "Government Warning:") },
  },
  { name: "all-bold-warning.png", params: { ...standard, warningStyle: "all-bold" } },
  {
    name: "paraphrased-warning.png",
    params: { ...standard, warning: "GOVERNMENT WARNING: Alcohol may harm your health." },
  },
  { name: "missing-warning.png", params: { ...standard, warning: "", warningStyle: "missing" } },
  { name: "abv-mismatch.png", params: { ...standard, abv: "40% Alc./Vol. (80 Proof)" } },
  { name: "volume-conversion.png", params: { ...standard, volume: "25.4 fl oz" } },
  { name: "stone-throw-punctuation.png", params: { ...standard, brand: "Stone’s Throw" } },
  { name: "poor-photo.png", params: { ...standard, degraded: "true" } },
];

await mkdir(fixtureDirectory, { recursive: true });
await mkdir(publicDirectory, { recursive: true });

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });

try {
  for (const fixture of fixtures) {
    const url = new URL(templateUrl);
    for (const [key, value] of Object.entries(fixture.params)) {
      url.searchParams.set(key, value);
    }
    await page.goto(url.href, { waitUntil: "networkidle0" });
    await page.screenshot({ path: resolve(fixtureDirectory, fixture.name), type: "png" });
  }
} finally {
  await browser.close();
}

await copyFile(
  resolve(fixtureDirectory, "compliant-label.png"),
  resolve(publicDirectory, "sample-label.png"),
);

console.log(`Generated ${fixtures.length} label fixtures in ${dirname(resolve(fixtureDirectory, "compliant-label.png"))}.`);
