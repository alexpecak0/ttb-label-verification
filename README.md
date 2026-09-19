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
git checkout phase-1-scaffold
npm install
Copy-Item .env.example .env.local
```

Set `ANTHROPIC_API_KEY` in `.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit `.env.local`.

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

Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) performs exactly one structured
tool-use extraction per label. It transcribes and reports confidence only; TypeScript
comparison code makes every compliance decision. This keeps the statutory warning
string and matching rules deterministic and unit-testable without an API call.

The government warning uses four independent checks: canonical wording, uppercase
`GOVERNMENT WARNING` prefix, bold prefix, and non-bold remainder. Ordinary text is
normalized for whitespace, case, curly apostrophes, and ampersands. ABV ignores proof
notation; net contents compare exact values inside one unit system and permit only
display-rounding tolerance when converting between US fluid ounces and metric units.
Low-confidence or unparseable readings become `review`, not a silent pass or fail.

Design and implementation decisions are recorded in [DECISIONS.md](DECISIONS.md).

## Assumptions and trade-offs

- This is a prototype, not a COLA system integration or a production regulatory
  decision engine.
- JPEG and PNG are supported; PDF input is intentionally out of scope.
- The app verifies the fields supplied in the application plus universal warning and
  imported-country presence requirements. It does not implement a beverage-specific
  mandatory-field matrix because that requires validated, exception-aware regulatory
  rules.
- It does not check label-internal proof/ABV arithmetic, physical type size, contrast,
  characters-per-inch, or other 27 CFR 16.22 legibility rules; a photographed label
  has no reliable physical-size reference.
- Glare and perspective correction are left to the vision model. Low-confidence
  observations are surfaced for human review.
- A cloud model is appropriate for this demonstration, but an agency deployment with
  restricted outbound network access would need an approved/allowlisted inference
  endpoint or a model hosted in its Azure tenant.
- No authentication, PII retention policy, FedRAMP assessment, or server-side result
  persistence is included. Keep an Anthropic workspace spend limit in place for a
  public demo endpoint.
