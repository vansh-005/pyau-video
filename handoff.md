# App ↔ video handoff

Sibling workspaces with separate Claude Code sessions: `pyau` (app agent) and `pyau-video` (this). Vansh moves files between them. No shared source editing.

## Message for the app session (Vansh can paste this there)

> A separate Opus session owns the video in pyau-video. Don't build Remotion scenes or render the video. Keep the /demo room recordable at 1920×1080 per frontend.md and demo.md. When a shot becomes recordable, tell me its shot ID (S03–S07, S09) and the exact clicks. After the deployed loop passes, export docs/evidence/facts.json and evidence.json per video-handoff.md. App behaviour is the source of truth; if a feature is cut, update facts.json and tell me.

## Required from the app side

| Asset | Covers | Evidence |
|---|---|---|
| `03-rider-voice.mp4` | Hindi voice question + spoken Polly answer + route | answer text, session ID |
| `04-host-join.mp4` | Host registration + freshness confirmation | session ID |
| `05-plan-approve.mp4` | Agent receipts, proposal, approval | run ID, model ID |
| `06-outreach.mp4` | Timeout → next host → accept → 91% | same run ID |
| `07-trust.mp4` | Reports pause a point | session ID |
| `09-aws-proof.mp4` | Step Functions execution + CloudWatch, same run ID | run ID |
| `facts.json`, `evidence.json`, 2 screenshots | Numbers, provenance, alignment | — |

No real personal data, tokens, account IDs or emails in any export.

## Manifest contract

`asset-manifest.json` starts with every clip `missing` and `verified: false`. Paths are relative to `public/`. Final render validation: file exists, real capture for app/AWS slots, trims within the probed duration and long enough for the slot, run IDs present in evidence.json, S09 run ID equals S05/S06, facts match facts.json, narration approved and inside 170 s, captions aligned, no placeholders. Draft mode may render missing assets only as visibly labelled slates.

## Checkpoints

A — now: storyboard, palette, shot IDs agreed (this pack). B — first real proposal → rough S05. C — outreach + Step Functions → S06, S09 (locks the turning point). D — rider voice → S03; then S04, S07. E — claims frozen → final narration, render, watch, upload.

If a feature is cut, update facts, storyboard and narration together. Never let a motion graphic stand in for a missing feature.
