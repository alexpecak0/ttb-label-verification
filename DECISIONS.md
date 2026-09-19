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
