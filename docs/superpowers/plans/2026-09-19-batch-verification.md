# Batch Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let reviewers submit many JPEG or PNG labels, see each result as it finishes, and export the review as CSV.

**Architecture:** The browser makes one `/api/verify` request per label. A pure scheduler runs at most five requests and emits immutable item updates; the client renders queued, running, done, and failed rows incrementally. CSV serialization is pure and receives completed client-held data.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library.

**Spec:** `C:\Users\alexp\OneDrive\Pictures\SPEC (1).md`

## Global Constraints

- Accept JPEG and PNG originals only, at 10 MB each; retain existing browser downscaling before every request.
- Make exactly one client-to-`/api/verify` request per label and cap batch concurrency at 5.
- Render each completed result immediately, with text status, elapsed time, every field’s reason, and extracted label value.
- Keep results in browser session state; provide a visible picker alongside the keyboard-operable drop zone.
- Do not add a beverage-type selector.

---

### Task 1: Bounded scheduler

**Files:**
- Create: `lib/batch.ts`
- Test: `test/batch.test.ts`

**Interfaces:**
- Produces `BatchProgress`, `BatchItem<T>`, `BATCH_CONCURRENCY`, and `runBatch<T>(files, verify, onItemUpdate, concurrency?)`.
- `BatchProgress` is `queued | running | done | failed`; `verify` receives one `File` and returns one result.

- [ ] **Step 1: Write the failing test**

```ts
it("never starts more than five labels at once", async () => {
  const files = Array.from({ length: 6 }, (_, i) => new File(["x"], `${i}.png`, { type: "image/png" }));
  const pending: Array<() => void> = [];
  let active = 0;
  let maximum = 0;
  const verify = async () => new Promise<void>((resolve) => {
    active += 1;
    maximum = Math.max(maximum, active);
    pending.push(() => { active -= 1; resolve(); });
  });
  const work = runBatch(files, verify, () => {});
  expect(maximum).toBe(5);
  pending.forEach((finish) => finish());
  await work;
});
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --run test/batch.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement minimal workers**

```ts
export const BATCH_CONCURRENCY = 5;
export async function runBatch<T>(files: File[], verify: (file: File) => Promise<T>, onItemUpdate: (item: BatchItem<T>) => void, concurrency = BATCH_CONCURRENCY): Promise<BatchItem<T>[]>;
```

Workers claim the next index, emit `running`, then emit `done` with a response or `failed` with a user-facing message.

- [ ] **Step 4: Verify GREEN and commit**

Run `npm test -- --run test/batch.test.ts`, then commit `feat: add bounded batch scheduler`.

### Task 2: Shared browser request client

**Files:**
- Create: `lib/verify-client.ts`
- Modify: `components/single-label-verifier.tsx`
- Test: `test/verify-client.test.ts`

**Interfaces:**
- Produces `verifyLabel(file: File, application: ApplicationData): Promise<VerificationResponse>`.
- Preserves `prepareImage`, API error parsing, and the `/api/verify` request contract from the existing component.

- [ ] **Step 1: Write the failing contract test**

```ts
it("posts the supplied application with the prepared image to the one-label route", async () => {
  // Stub only the canvas boundary and fetch, then assert the POST body contains the supplied application.
});
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --run test/verify-client.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement and verify GREEN**

Move the existing request implementation into `lib/verify-client.ts`, export the response type, and delegate the single-label component to it. Run `npm test -- --run test/verify-client.test.ts test/single-label-verifier.test.tsx`.

- [ ] **Step 4: Commit**

Commit `refactor: share browser verification client`.

### Task 3: Incremental batch uploader and results

**Files:**
- Create: `components/batch-label-verifier.tsx`
- Modify: `components/label-verification-app.tsx`
- Test: `test/batch-label-verifier.test.tsx`

**Interfaces:**
- Consumes `ApplicationData`, `runBatch`, `BatchItem<VerificationResponse>`, and `verifyLabel`.
- Produces a single `Verify labels` action, queued/running/done/failed rows, and expanded field rows.

- [ ] **Step 1: Write the failing incremental-render test**

```tsx
it("renders a completed first label while another label remains running", async () => {
  render(<BatchLabelVerifier application={SAMPLE_APPLICATION} verify={controlledVerify} />);
  await user.upload(screen.getByLabelText("Choose label images"), [first, second]);
  await user.click(screen.getByRole("button", { name: "Verify labels" }));
  resolveFirst();
  expect(await screen.findByText("done")).toBeInTheDocument();
  expect(screen.getByText("running")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --run test/batch-label-verifier.test.tsx`; expect missing-module failure.

- [ ] **Step 3: Implement the component**

Render an `input multiple` with `accept="image/jpeg,image/png"`, a drop-zone `onDrop`, visible selected queued files, and `Verify labels`. On every scheduler callback replace only the updated item in state. Render each completed result with overall status, elapsed time, and field/check/status/reason/application/extracted label values.

- [ ] **Step 4: Integrate sample flow and verify GREEN**

Make `LabelVerificationApp` store a file list; “Load sample” adds `sample-label.png`. Run `npm test -- --run test/batch-label-verifier.test.tsx test/label-verification-app.test.tsx`.

- [ ] **Step 5: Commit**

Commit `feat: add incremental batch verification`.

### Task 4: CSV export and scale record

**Files:**
- Create: `lib/export-csv.ts`
- Modify: `components/batch-label-verifier.tsx`
- Modify: `DECISIONS.md`
- Test: `test/export-csv.test.ts`

**Interfaces:**
- Produces `createBatchCsv(items): string` and a download action enabled after the first completed result.
- CSV header is `fileName,progress,overallStatus,elapsedMs,field,check,status,reason,labelValue,applicationValue`.

- [ ] **Step 1: Write the failing serializer test**

```ts
it("includes each field's status, reason, and extracted label value", () => {
  const csv = createBatchCsv([completedItem]);
  expect(csv).toContain("label.png,done,fail,123,Brand name,match,fail,Brand differs,STONE'S THROW,Stone's Throw");
});
```

- [ ] **Step 2: Verify RED and implement**

Run `npm test -- --run test/export-csv.test.ts`; expect missing module. Implement RFC-4180 escaping, then create a browser blob only inside the export button handler.

- [ ] **Step 3: Record scale decision and verify**

Record that 300 labels use 300 independent requests; five concurrent workers preserve partial progress and cap provider pressure. At the measured 3.756-second median, 60 five-label groups take about 3.8 minutes before retries. Run `npm test; npm run lint; npm run build; git diff --check`.

- [ ] **Step 4: Commit and push**

Commit `feat: export batch verification results`, then push `phase-1-scaffold`.
