# TTB Label Verification

[Open the deployed prototype](https://ttb-label-verification-kappa.vercel.app)

TTB Label Verification compares one or more alcohol-label images with matching
application details entered by a reviewer. It returns field-level pass, fail, or
needs-review findings, shows extracted values and elapsed time, and exports the
current batch as CSV.

## Run locally

Requirements: Node.js 22+ and an Anthropic API key.

```bash
git clone https://github.com/alexpecak0/ttb-label-verification.git
cd ttb-label-verification
npm install
cp .env.example .env.local
```

Set `ANTHROPIC_API_KEY` in `.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit `.env.local`.
Reviewers can use the deployed prototype, which has the key configured server-side; a
local run needs your own Anthropic key.

## Verify the project

```bash
npm test
npm run lint
npm run build
```

## Approach

The prototype is a stateless Next.js App Router application deployed on Vercel. The
browser holds the current form and batch results; there is no database or server-side
result retention.

Each label is reduced in the browser to a 1600px maximum edge and a JPEG below 3 MB
before its own API request is sent. The server accepts only JPEG/PNG base64 payloads
within its 4 MB character budget. The client processes at most five labels at a time,
so completed labels appear while the rest of the batch continues.
Five clean-fixture production runs had a 3.76 s median end-to-end time. This is a
small sample; at that median, 300 labels take approximately 3.8 minutes at five
concurrent requests, before retries.

Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) performs exactly one structured
tool-use extraction per label. It transcribes and reports confidence only; TypeScript
comparison code makes every compliance decision. This keeps the statutory warning
string and matching rules deterministic and unit-testable without an API call.
A malformed, truncated, or otherwise invalid model response becomes a review result
for that label, never a pass or a crash; see
[the recovery test](test/verify-one.test.ts).

The government warning uses four independent checks: canonical wording, uppercase
`GOVERNMENT WARNING` prefix, bold prefix, and non-bold remainder. Ordinary text is
normalized for whitespace, case, curly apostrophes, and ampersands. ABV ignores proof
notation; net contents compare exact values inside one unit system and permit only
display-rounding tolerance when converting between US fluid ounces and metric units.
Low-confidence or unparseable readings become `review`, not a silent pass or fail.
The overall result is deterministic: any field `fail` makes the label fail; otherwise
any `review` or `not_provided` makes it review; otherwise it passes.

Nine fixture labels are rendered from one HTML template with Puppeteer, not generated
by AI. That gives the title-case and all-bold warning cases exact, repeatable
typography.

Design and implementation decisions are recorded in [DECISIONS.md](DECISIONS.md).

## Tools and AI assistance

Built with Next.js, TypeScript, Zod, Vitest, Puppeteer (fixtures), and Vercel.
I wrote the requirements and architecture decisions (SPEC.md, DECISIONS.md) and
reviewed every change. OpenAI Codex generated most of the implementation from
that spec.

## Assumptions and trade-offs

- This is a prototype, not a COLA system integration or a production regulatory
  decision engine.
- Reviewers enter application values manually. There is no beverage-type selector.
- Country of origin is checked only when the reviewer marks the product as imported.
- JPEG and PNG are supported; PDF input is intentionally out of scope.
- The app verifies the fields supplied in the application plus universal warning and
  imported-country presence requirements. It does not implement a beverage-specific
  mandatory-field matrix because that requires validated, exception-aware regulatory
  rules.
- It does not check label-internal proof/ABV arithmetic, physical type size, contrast,
  "separate and apart" presentation, characters-per-inch, or other 27 CFR 16.22
  legibility rules; a photographed label has no reliable physical-size reference.
- Glare and perspective correction are left to the vision model. Low-confidence
  observations are surfaced for human review. Model confidence is uncalibrated: the
  0.85 threshold is a prototype heuristic, not a probability guarantee.
- Large batches can encounter Anthropic rate limits. The server retries HTTP 429 twice
  after 250 ms and 500 ms (three total attempts); other extraction failures are
  isolated to that label and exposed for per-label retry.
- Inference runs server-side. Reviewers' browsers need to reach this app's domain, not
  Anthropic directly. A production deployment would require an approved, authorized
  inference endpoint.
- No authentication, PII retention policy, FedRAMP assessment, or server-side result
  persistence is included. Keep an Anthropic workspace spend limit in place for a
  public demo endpoint.
