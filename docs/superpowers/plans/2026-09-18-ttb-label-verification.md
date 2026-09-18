# TTB Alcohol Label Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a stateless, accessible label-verification prototype that compares photographed alcohol labels against supplied application data and returns auditable pass/fail/review findings.

**Architecture:** The Next.js App Router application keeps application data and results in browser memory. The browser resizes each selected JPEG/PNG before posting one label at a time to a route handler; the route calls a single Anthropic tool-use extraction adapter. Pure TypeScript comparison functions turn that extraction into deterministic findings, including all government-warning compliance logic.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Anthropic TypeScript SDK, Zod, Vitest, React Testing Library, Vercel.

**Spec:** `C:\Users\alexp\OneDrive\Pictures\SPEC (1).md` (user-provided, approved source of truth)

## Global Constraints

- Deploy the hello-world scaffold to Vercel Hobby and verify the live URL before feature work.
- Use `claude-haiku-4-5-20251001` through exactly one Anthropic vision call per label, hidden behind `extractLabel(image): Promise<LabelExtraction>`.
- Store `ANTHROPIC_API_KEY` only in server environment configuration; never persist uploads or results.
- Accept JPEG/PNG originals up to 10 MB; resize in-browser to a 1600 px maximum edge and JPEG quality 0.85 before upload.
- Process each label in its own request, from the browser, at concurrency five; never submit an entire batch to one function.
- Use `CONFIDENCE_THRESHOLD = 0.85` in exactly one shared constant; lower confidence always produces review.
- The canonical 27 CFR warning is a code constant. The model transcribes and observes; code alone determines compliance.
- Government-warning checks are: presence, exact wording, uppercase prefix, bold prefix, and non-bold remainder. A confident deviation fails; uncertainty reviews.
- Overall status is the worst field status: `fail` > `review` > `pass`; `not_provided` and `not_applicable` are informational.
- Build fixtures before the vertical slice; include all nine required scenarios in the supplied project brief.
- Inputs are images only; PDFs and beverage-specific mandatory-field rules are out of scope.
- Create small focused commits and append each design judgment to `DECISIONS.md` as it is made.

---

### Task 1: Initialize, deploy, and verify the empty application

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.example`, `README.md`, `DECISIONS.md`
- Create: `app/api/health/route.ts`

**Interfaces:**
- Produces: `GET /api/health -> { ok: true }`, used for deployment smoke testing.
- Produces: a Vercel project linked to this repository; later API routes inherit its environment configuration.

- [ ] **Step 1: Initialize source control and scaffold the App Router project**

Run:

```powershell
git init
npx create-next-app@latest . --ts --tailwind --eslint --app --use-npm --import-alias "@/*" --yes
```

- [ ] **Step 2: Add an explicit health route and minimal landing page**

```ts
// app/api/health/route.ts
import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ ok: true }); }
```

The page must identify the prototype, state that verification is coming next, and use no external service yet.

- [ ] **Step 3: Add security and setup documentation**

Add `.env.local` to `.gitignore`; create `.env.example` containing only `ANTHROPIC_API_KEY=`. Add a decision recording stateless Vercel deployment and the absence of a database.

- [ ] **Step 4: Run local checks**

Run: `npm run lint` and `npm run build`.

Expected: both commands exit 0.

- [ ] **Step 5: Commit the scaffold**

```powershell
git add .
git commit -m "chore: scaffold Next.js label verifier"
```

- [ ] **Step 6: Deploy and verify the actual Vercel URL**

Run `npx vercel --prod`, set `ANTHROPIC_API_KEY` only in Vercel when prompted or through the Vercel dashboard, then open `https://<deployment>/api/health`.

Expected: the deployed landing page loads and the health endpoint returns `{"ok":true}`.

**Checkpoint:** Stop and show the user the live deployment URL and successful health response. Do not begin Task 2 until the user confirms.

### Task 2: Define domain contracts, create label fixtures, and prove comparison rules with unit tests

**Files:**
- Create: `lib/domain.ts`, `lib/constants.ts`, `lib/normalize.ts`, `lib/compare.ts`, `lib/volume.ts`, `lib/abv.ts`
- Create: `test/compare.test.ts`, `test/volume.test.ts`, `test/abv.test.ts`, `test/fixtures.test.ts`
- Create: `public/fixtures/` containing PNG files for compliant, title-case prefix, all-bold warning, altered warning, missing warning, ABV mismatch, volume conversion, Stone's Throw punctuation, and poor-photo scenarios
- Create: `scripts/build-fixtures.mjs`
- Modify: `package.json`, `DECISIONS.md`

**Interfaces:**
- Produces: `type Status = "pass" | "fail" | "review" | "not_provided" | "not_applicable"`.
- Produces: `compareLabel(extraction: LabelExtraction, application: ApplicationData): LabelResult`.
- Produces: `parseMilliliters(value: string): ParsedNumber | null` and `parseAbvPercent(value: string): ParsedNumber | null`.
- Produces: `GOVERNMENT_WARNING` and `CONFIDENCE_THRESHOLD` from `lib/constants.ts`.

- [ ] **Step 1: Write failing tests for normalization and ordinary-field matching**

```ts
expect(normalizeText("STONE'S THROW")).toBe(normalizeText("Stone’s Throw"));
expect(compareText("Stone’s Throw", "STONE'S THROW", 0.99).status).toBe("pass");
```

- [ ] **Step 2: Write failing tests for ABV and volume parsing**

```ts
expect(parseAbvPercent("45% Alc./Vol. (90 Proof)")?.value).toBe(45);
expect(areVolumesEquivalent("750 mL", "25.4 fl oz")).toBe(true);
```

Use US fluid ounces (`29.5735295625 mL`) and a tolerance equal to half the least-precise displayed increment, so the rounded `25.4 fl oz` representation matches 750 mL but materially different volumes do not.

- [ ] **Step 3: Write failing tests for warning logic and status aggregation**

```ts
expect(compareWarning({ present: false }, 0.99).status).toBe("fail");
expect(compareWarning({ wording: "Government Warning: ...", wordingConfidence: 0.99 }).status).toBe("fail");
expect(compareWarning({ prefixBold: false, prefixBoldConfidence: 0.50 }).status).toBe("review");
expect(aggregateStatus(["pass", "review", "fail"])).toBe("fail");
```

Cover the exact canonical text, case, prefix boldness, remainder non-boldness, missing warning, and the named threshold without any SDK mock.

- [ ] **Step 4: Implement the pure domain layer**

```ts
export const CONFIDENCE_THRESHOLD = 0.85;
export const GOVERNMENT_WARNING = "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";
```

Implement code-only comparison logic. Collapse layout whitespace only for warning transcription comparison; preserve all letters, punctuation, numbering, and case. Return extracted and application values with each finding and distinguish `presence` from `match` check types.

- [ ] **Step 5: Generate deterministic PNG test fixtures**

Use `scripts/build-fixtures.mjs` to render the fixture text into PNGs, including deliberately malformed warning variants and a transformed low-legibility image. Add a manifest test asserting every required scenario exists and uses `.png`.

- [ ] **Step 6: Run and verify unit tests**

Run: `npm run test -- --run`.

Expected: all pure comparison, parser, aggregation, and fixture-manifest tests pass.

- [ ] **Step 7: Commit the tested domain layer and fixtures**

```powershell
git add lib test public/fixtures scripts package.json DECISIONS.md
git commit -m "feat: add deterministic label comparison rules"
```

### Task 3: Implement the isolated Anthropic structured-extraction adapter

**Files:**
- Create: `lib/extraction/schema.ts`, `lib/extraction/anthropic.ts`, `lib/extraction/index.ts`
- Create: `test/extraction-schema.test.ts`
- Modify: `.env.example`, `DECISIONS.md`

**Interfaces:**
- Consumes: a downscaled JPEG byte string plus MIME type.
- Produces: `extractLabel(image: ExtractableImage): Promise<LabelExtraction>`.
- Produces: a Zod-validated `LabelExtraction` containing ordinary-field values/confidences, full warning transcription, and the four warning observations/confidences.

- [ ] **Step 1: Write failing Zod-schema tests**

```ts
expect(() => LabelExtractionSchema.parse({ brandName: { value: "A", confidence: 1 } })).toThrow();
expect(LabelExtractionSchema.parse(validExtraction).warning.prefixBold.confidence).toBe(0.92);
```

- [ ] **Step 2: Implement the schema and adapter contract**

Define the complete result shape in `schema.ts`; no UI component or route may import the Anthropic client directly.

```ts
export interface LabelExtractor {
  extractLabel(image: ExtractableImage): Promise<LabelExtraction>;
}
```

- [ ] **Step 3: Implement one tool-use call in the Anthropic adapter**

Call `claude-haiku-4-5-20251001` once with the image and a `record_label_extraction` tool schema. Instruct it to transcribe/observe only, preserve warning punctuation and case, and report confidence for every observation. Reject missing or malformed tool input through Zod.

- [ ] **Step 4: Verify adapter boundaries**

Run: `npm run test -- --run test/extraction-schema.test.ts` and `npm run lint`.

Expected: the schema tests pass and no browser bundle imports `@anthropic-ai/sdk`.

- [ ] **Step 5: Commit the adapter**

```powershell
git add lib/extraction test/extraction-schema.test.ts package.json .env.example DECISIONS.md
git commit -m "feat: add Anthropic extraction adapter"
```

### Task 4: Add the one-label API route and client-side image preparation

**Files:**
- Create: `app/api/verify/route.ts`, `lib/image/prepare.ts`, `lib/verify-one.ts`
- Create: `test/image-prepare.test.ts`, `test/verify-one.test.ts`
- Modify: `next.config.ts`, `DECISIONS.md`

**Interfaces:**
- Consumes: `{ image: { dataUrl, mimeType, fileName }, application: ApplicationData }` from one HTTP request.
- Produces: `{ result: LabelResult, elapsedMs: number }` or a typed error with recovery guidance.
- Produces: `prepareImage(file: File): Promise<PreparedImage>` with a JPEG payload under 4 MB.

- [ ] **Step 1: Write failing image-validation and resize tests**

```ts
await expect(prepareImage(pdfFile)).rejects.toThrow("Choose a JPEG or PNG image");
await expect(prepareImage(elevenMbPng)).rejects.toThrow("10 MB");
expect(prepared.mimeType).toBe("image/jpeg");
expect(Math.max(prepared.width, prepared.height)).toBeLessThanOrEqual(1600);
```

- [ ] **Step 2: Implement browser-only image preparation**

Validate original JPEG/PNG size at 10 MB; draw to an offscreen canvas at a 1600 px max edge and encode JPEG at 0.85. Reject an encoded payload at or above 4 MB with a guidance message to use a higher-quality original or smaller crop.

- [ ] **Step 3: Write failing route/service tests using an injected extractor**

```ts
const output = await verifyOne(validImage, application, fakeExtractor);
expect(output.result.overallStatus).toBe("pass");
expect(output.elapsedMs).toBeGreaterThanOrEqual(0);
```

- [ ] **Step 4: Implement API route and error translation**

The route accepts one prepared image only, measures time immediately before extraction through result creation, and maps timeout, malformed tool output, and provider failure into typed per-label results. Never expose the key or return raw provider messages.

- [ ] **Step 5: Run local verification**

Run: `npm run test -- --run test/image-prepare.test.ts test/verify-one.test.ts`, `npm run lint`, and `npm run build`.

Expected: all exit 0.

- [ ] **Step 6: Commit the one-label pipeline**

```powershell
git add app/api/verify lib/image lib/verify-one test next.config.ts DECISIONS.md
git commit -m "feat: add one-label verification API"
```

### Task 5: Deliver and verify the hardcoded single-label vertical slice

**Files:**
- Create: `components/single-label-verifier.tsx`, `components/status-badge.tsx`, `components/field-results.tsx`
- Modify: `app/page.tsx`, `app/globals.css`, `README.md`

**Interfaces:**
- Consumes: `PreparedImage` and the hardcoded compliant fixture application.
- Produces: an accessible rendered `LabelResult` with extracted value, application value, check type, status icon/text, reason, and elapsed milliseconds.

- [ ] **Step 1: Write a failing component test for the loading and result states**

```tsx
render(<SingleLabelVerifier verify={resolvedPass} />);
await user.upload(screen.getByLabelText("Choose label image"), fixtureFile);
await user.click(screen.getByRole("button", { name: "Verify label" }));
expect(await screen.findByText("PASS")).toBeVisible();
expect(screen.getByText(/Extracted value/i)).toBeVisible();
```

- [ ] **Step 2: Implement the single-screen vertical slice**

Provide a visible picker button, drag target, single action button, live progress text, a status badge that never relies on color alone, and a field-results list. Use the compliant fixture’s fixed application data only in this task.

- [ ] **Step 3: Run component and production checks**

Run: `npm run test -- --run`, `npm run lint`, and `npm run build`.

Expected: all exit 0.

- [ ] **Step 4: Deploy and manually verify the vertical slice**

Deploy production, upload the compliant fixture and two deliberately broken fixtures, and record their elapsed times. Confirm the results arrive correctly and the compliant result is no slower than five seconds end-to-end.

**Checkpoint:** Stop and show the user the deployed URL, screenshots or observed results, and per-label timings. If the five-second target is missed, optimize image size, prompt, or model before Task 6.

- [ ] **Step 5: Commit**

```powershell
git add app components README.md
git commit -m "feat: add verified single-label workflow"
```

### Task 6: Replace sample data with the full application form and import behavior

**Files:**
- Create: `components/application-form.tsx`, `test/application-form.test.tsx`
- Modify: `app/page.tsx`, `components/single-label-verifier.tsx`, `lib/domain.ts`, `README.md`

**Interfaces:**
- Produces: `ApplicationData` with `isImported`, optional ordinary fields, and no beverage-type selector.
- Consumes: form data to pass unchanged to `verifyOne` and `compareLabel`.

- [ ] **Step 1: Write failing tests for form semantics**

```tsx
expect(screen.queryByLabelText(/beverage type/i)).not.toBeInTheDocument();
await user.click(screen.getByLabelText("Imported product"));
expect(screen.getByLabelText(/country of origin/i)).toBeRequired();
```

- [ ] **Step 2: Implement the plain-language application form**

Use visible labels for all fields, 16 px minimum body text, large inputs, and an import toggle. Country is required only when imported; comparison reports missing domestic origin as `not_applicable` and missing supplied fields as `not_provided`.

- [ ] **Step 3: Add the Load sample action**

One button must populate the form and select/use the bundled compliant fixture, so an evaluator can run the full path without their own image.

- [ ] **Step 4: Verify and commit**

Run: `npm run test -- --run`, `npm run lint`, and `npm run build`; then commit with message `feat: add application data form`.

### Task 7: Add incremental batch orchestration, retry/backoff, and CSV output

**Files:**
- Create: `lib/batch.ts`, `lib/csv.ts`, `components/batch-results.tsx`, `test/batch.test.ts`, `test/csv.test.ts`
- Modify: `app/page.tsx`, `components/application-form.tsx`, `README.md`, `DECISIONS.md`

**Interfaces:**
- Produces: `verifyBatch(files, application, onUpdate): Promise<LabelResult[]>` with maximum five active operations.
- Produces: `toResultsCsv(results: LabelResult[]): string`.

- [ ] **Step 1: Write failing concurrency and incremental-update tests**

```ts
await verifyBatch(sixFiles, application, onUpdate, { concurrency: 5 });
expect(maxActive).toBe(5);
expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ state: "complete" }));
```

- [ ] **Step 2: Implement bounded client-side fan-out**

Prepare and submit exactly one label per fetch. Insert `queued`, `preparing`, `verifying`, `complete`, and `error` states into the result table immediately; do not await all labels before rendering completed entries.

- [ ] **Step 3: Add retry for provider rate limiting and transient failures**

Retry HTTP 429 and 5xx responses three times with exponential delays of 500 ms, 1,000 ms, and 2,000 ms plus random jitter. After exhaustion, leave only that row retryable and preserve every other completed result.

- [ ] **Step 4: Write failing CSV tests and implement export**

```ts
expect(toResultsCsv([failedResult])).toContain("overall_status,field,check_type,status,reason,extracted_value,application_value,elapsed_ms");
```

Escape commas, quotes, and newlines correctly; export all field findings, not only overall rows.

- [ ] **Step 5: Exercise a 20-label fixture batch and commit**

Run the unit suite, then manually submit a repeated 20-file fixture batch in production. Confirm five-at-a-time progress, incremental rows, retries, elapsed times, and CSV download. Commit with message `feat: add incremental batch verification`.

### Task 8: Complete error handling, accessibility, documentation, and final verification

**Files:**
- Create: `components/error-guidance.tsx`, `test/accessibility.test.tsx`
- Modify: all user-facing components as needed, `README.md`, `DECISIONS.md`

**Interfaces:**
- Produces: consistent typed guidance for invalid selection, oversized input, image preparation, timeout, malformed extraction, low confidence, rate limit exhaustion, and explicit single-row retry.

- [ ] **Step 1: Write failing tests for actionable errors and keyboard access**

```tsx
expect(await screen.findByText("Choose a JPEG or PNG image no larger than 10 MB.")).toBeVisible();
await user.tab();
expect(screen.getByRole("button", { name: "Choose label images" })).toHaveFocus();
```

- [ ] **Step 2: Implement the accessible error and results presentation**

Use text plus icon for every status, `aria-live="polite"` for per-file progress, labeled controls, visible focus outlines, high contrast, and keyboard-accessible file picking. Do not use status color as the only signal.

- [ ] **Step 3: Finalize README and decision log**

Document setup, `ANTHROPIC_API_KEY`, local commands, the production deployment URL, architecture, exact warning approach, input resizing, fixture coverage, 5-second measurements, and every explicit out-of-scope/production constraint from the specification.

- [ ] **Step 4: Run the full quality gate**

Run: `npm run test -- --run`, `npm run lint`, and `npm run build`.

Expected: all pass. Deploy once more and verify the health route, single label, 20-label batch, CSV export, bad file message, low-confidence fixture, and deployed timings.

- [ ] **Step 5: Commit and report**

```powershell
git add .
git commit -m "feat: complete label verification prototype"
```

Report the deployed URL, test output, measured timing samples, documented limitations, and commit history.

## Plan Self-Review

- **Spec coverage:** Tasks 1 and 5 implement and verify deployment checkpoints; Task 2 covers fixtures and deterministic regulations; Tasks 3–4 isolate a single tool-use extraction call and production body limits; Task 6 implements application and import semantics; Task 7 covers concurrency, incremental results, rate handling, scale exercise, and CSV; Task 8 covers accessibility, error guidance, README, and final checks.
- **Placeholder scan:** No deferred or unspecified implementation steps remain; every error category and rule has a named implementation location.
- **Type consistency:** `ApplicationData`, `LabelExtraction`, `LabelResult`, `PreparedImage`, `verifyOne`, and `verifyBatch` are introduced before their consumers and preserve one-label-per-request boundaries.
