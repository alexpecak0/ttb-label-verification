# Error Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make individual label failures actionable without blocking batch results.

**Architecture:** Validate original files before they enter the batch. Keep a failed `BatchItem` in the client and retry only that item. On the server, malformed structured extraction becomes a synthetic `review` result; an upstream rate limit is retried around the single model request with 250 ms and 500 ms delays before an actionable error reaches the client.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library.

**Spec:** `C:\Users\alexp\OneDrive\Pictures\SPEC (1).md`

## Global Constraints

- JPEG and PNG only; original-file cap is 10 MB.
- A failed label must never reset or delay other batch items.
- Invalid extraction response means `review`, never a crash or a pass.
- Rate-limit retry has at most three provider attempts and exponential 250 ms, 500 ms delays.
- Every displayed message tells the reviewer what to do next.

### Task 1: Validate selected files

**Files:** Create `lib/file-validation.ts`; modify `components/batch-label-verifier.tsx`; test `test/file-validation.test.ts`.

- [x] Write a failing test for a PDF and 10 MB + 1 byte image, expecting `Choose JPEG or PNG images no larger than 10 MB.`
- [x] Run `npm test -- --run test/file-validation.test.ts` and confirm RED.
- [x] Implement `validateLabelFiles(files): { accepted: File[]; error: string | null }`; show its error in an alert while retaining valid selections.
- [x] Run focused tests.

### Task 2: Convert malformed extraction to review and retry provider limits

**Files:** Modify `lib/vision.ts`, `lib/verify-one.ts`; create `lib/retry.ts`; tests `test/retry.test.ts`, `test/verify-one.test.ts`.

- [x] Write failing tests: a 429 succeeds after a 250 ms retry, and `VisionExtractionError` produces overall `review` with an extraction-review reason.
- [x] Run focused tests and confirm RED.
- [x] Implement `retryOnRateLimit(operation, sleep)` and use it only around `client.messages.create`; add `createExtractionReview` for malformed/no-tool results while preserving other provider failures.
- [x] Run focused tests.

### Task 3: Per-label retry UI

**Files:** Modify `components/batch-label-verifier.tsx`; test `test/batch-label-verifier.test.tsx`; modify `DECISIONS.md`.

- [x] Write a failing UI test that fails one selected image, clicks `Retry <filename>`, and observes only that row move from `failed` to `done`.
- [x] Run focused test and confirm RED.
- [x] Implement the retry action using the existing file and application data; leave all other rows untouched. Render failed guidance and retry button in the row.
- [x] Record retry/backoff behavior; run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; commit and push.
