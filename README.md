# TTB Label Verification

Prototype scaffold for an alcohol-label verification tool. The application will
compare extracted label information with reviewer-supplied application data.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the scaffold.

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` before later
vision-extraction phases. Do not commit `.env.local`.

## Checks

```bash
npm run lint
npm run build
node --test test/health.test.mjs
```

The deploy URL will be added after the Phase 1 Vercel checkpoint.
