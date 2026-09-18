# Decisions

## 2026-09-18 — Prototype deployment and extraction model

The prototype is a stateless Next.js application deployed on Vercel. It will use
Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) for one structured
vision extraction call per label because the project’s five-second latency target
and 200–300-label batches prioritize low latency and cost. The API key is held
only in Vercel environment variables and never in browser code or Git.
