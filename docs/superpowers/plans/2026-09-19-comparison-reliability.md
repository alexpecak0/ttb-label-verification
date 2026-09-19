# Comparison Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent false passes and false fails when values are uncertain, malformed, or expressed in different volume systems.

**Architecture:** Keep parsing and equivalence logic in pure libraries. Comparison functions receive each label field's confidence and return `review` for uncertain observations or parsing failures. The route rejects oversized base64 input before any provider call.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Vitest.

**Spec:** `C:\Users\alexp\OneDrive\Pictures\SPEC (1).md`

## Global Constraints

- JPEG/PNG images only; request bodies must remain below Vercel's 4.5 MB function limit.
- Low-confidence label reads must be `review`, never a silent pass or fail.
- Cross-system net contents may allow display rounding; same-system metric quantities must not.
- The government warning remains four independently evaluated checks.

### Task 1: Make volume equivalence system-aware

**Files:** Modify `lib/parseNetContents.ts`; modify `test/parse-net-contents.test.ts`.

- [x] Write cases for 1 L vs 750 mL (false), 2 L vs 1.75 L (false), 0.75 L vs 750 mL (true), 750 mL vs 25.4 fl oz (true), and 12 fl oz vs 355 mL (true).
- [x] Run `npm test -- --run test/parse-net-contents.test.ts` and confirm the two same-system cases fail first.
- [x] Return a `system` and rounding allowance from `parseNetContents`; require exact milliliter comparison in the same system and permit only US-display rounding across systems.
- [x] Run the focused test and confirm it passes.

### Task 2: Make comparison results confidence and parse aware

**Files:** Modify `lib/compare.ts`; modify `test/compare.test.ts`.

- [x] Write tests for a low-confidence brand mismatch and unparseable net contents, both expecting `review`.
- [x] Run `npm test -- --run test/compare.test.ts` and confirm they fail first.
- [x] Pass every extracted field confidence into comparison helpers. Preserve `not_provided` when either ordinary value is absent; return `review` for low-confidence or unparseable non-null values.
- [x] Simplify overall aggregation to fail, then review, then pass.
- [x] Run the focused test and confirm it passes.

### Task 3: Treat unknown warning styles and oversized requests safely

**Files:** Modify `lib/warning.ts`, `app/api/verify/route.ts`, and associated tests.

- [x] Write a warning test for a high-confidence null style observation that expects `review`; write a route test for an oversized base64 string that expects 413.
- [x] Run focused tests and confirm RED.
- [x] Return review for null boolean observations and enforce a server-side base64 character cap with an actionable response.
- [x] Run focused tests and confirm GREEN.

### Task 4: Replace scaffold documentation

**Files:** Modify `README.md`; modify `DECISIONS.md`.

- [x] Document the live deployment, setup command, model/architecture choice, validation approach, and all explicit prototype trade-offs.
- [x] Record the system-aware volume and confidence rules in the decision log.
- [x] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; commit and deploy.
