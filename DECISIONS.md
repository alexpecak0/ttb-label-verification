# Decisions

## 2026-09-18 — Prototype deployment and extraction model

The prototype is a stateless Next.js application deployed on Vercel. It will use
Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) for one structured
vision extraction call per label because the project’s five-second latency target
and 200–300-label batches prioritize low latency and cost. The API key is held
only in Vercel environment variables and never in browser code or Git.

## 2026-09-18 — Deterministic visual fixture set

The nine fixture labels are rendered from one HTML template with Puppeteer Core and
the locally installed Chrome executable. This gives the title-case and all-bold warning
scenarios exact typography control, rather than relying on probabilistic image
generation. The canonical warning text is read from `lib/constants.ts` by the fixture
script, so the displayed compliant fixture cannot silently drift from the comparison
rule. The clean fixture is copied to `public/sample-label.png` for the later demo flow.

## 2026-09-18 — One-label extraction boundary

Each verification request carries one browser-downscaled image only. The client reduces
the longest edge to 1600px and encodes JPEG at 0.85 before posting it, keeping the
serverless payload beneath Vercel’s body limit. The server makes one forced tool-use
call to Claude Haiku 4.5, validates the returned observations with Zod, and then passes
only the validated extraction into the existing deterministic comparison layer. The
provider key is read only at server request time.

When warning text is transcribed with high confidence, the code corroborates the
uppercase-prefix observation against that literal transcription. This prevents a
model’s mistaken style observation from silently passing an obvious title-case prefix,
while retaining separate confidence handling for typography observations.

## 2026-09-18 — Production latency gate

Five clean-fixture runs measured from clicking “Verify label” through rendering the
result were 4,344 ms, 3,895 ms, 3,548 ms, 3,756 ms, and 3,570 ms. The median was
3,756 ms, below the five-second target, so no image-size, prompt, or model change was
needed at this gate. The UI retains both `endToEndElapsedMs` and the server-side
`elapsedMs` for later performance diagnosis.

## 2026-09-18 — Editable application data

The single-label request now receives the values entered on the page rather than a
component-owned hardcoded application. “Load sample” deliberately follows that same
path: it fills the editable Stone's Throw application values and attaches the bundled
sample image before verification. Country of origin becomes a required browser field
only when the user marks the product as imported; no beverage-type selector is
included.

## 2026-09-19 — Client-side batch execution

Each label remains an independent browser-to-function request; the client starts no
more than five at once and renders each row as it finishes. This keeps individual
function calls within the Hobby timeout, isolates a failed label, and lets a reviewer
act on completed results before the batch ends. At the measured 3.756-second median,
300 labels form 60 groups of five and take approximately 3.8 minutes of wall-clock
time before retries or network variance. The browser retains the batch only for the
current session and can export the detailed results as CSV.

## 2026-09-19 — Actionable per-label recovery

The browser rejects non-JPEG/PNG files and originals over 10 MB before batch work
begins, while retaining any valid files selected alongside them. A malformed or
unparseable structured model response becomes a review result, never a pass or a
crash. Claude rate limits receive up to three attempts with 250 ms then 500 ms delays;
other provider failures remain isolated to their label and offer a per-row retry that
does not restart the batch.

## 2026-09-19 — Accessible one-screen status display

Every batch progress and verification status is rendered as an icon plus its literal
text, so color communicates emphasis rather than meaning. The drop zone is keyboard
focusable and opens the native picker on Enter or Space, alongside its separate
visible picker button. The app keeps native semantics and one screen rather than
adding a navigation layer or modal workflow.
