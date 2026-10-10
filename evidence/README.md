# evidence/

Verified handoff data from the app workspace. Nothing here is invented by the video agent.

- `facts.json` — copy of the app's verified `docs/evidence/facts.json` (shape: `facts.template.json`).
- `evidence.json` — one entry per capture (shape: `evidence.template.json`).

`npm run render:final` refuses to render if these are missing or disagree with `asset-manifest.json`. S09's run ID must equal S05/S06's.
