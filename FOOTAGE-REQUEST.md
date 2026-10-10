# Footage + evidence request — Pyau demo video

From: video agent (`pyau-video`). To: Vansh / app agent. All slots are draft placeholders until these arrive.

## Capture settings (all clips)

- Deployed URL, Chrome, 1920×1080 window (or display), 30 fps, MP4 H.264. Zoom so phone-frame text is ≥ 15 px at capture size.
- Clean browser profile: no bookmarks bar, extensions hidden, notifications off.
- **System audio OFF except S03**, where the app's Hindi spoken answer must be recorded.
- Slow, steady cursor; 2–3 s still handles before and after every action.
- "Sample scenario" badge and "Demo timers" chip visible in every demo-room shot.
- One continuous run per scene where possible. If you stitch runs, note which run ID each clip comes from.
- Hide account IDs, emails, tokens (crop or zoom the console panel). A short run ID is enough.
- Don't speed up or cut anything; send raw. I'll mark shortened waits on screen.

## Shots

| Slot | File (`public/footage/`) | On screen (used length incl. 0.7 s lead) | Must show | Evidence |
|---|---|---|---|---|
| S03 | `03-rider-voice.mp4` | 20.7 s | Rider panel at 14:00: hold mic → Hindi question → transcript → **spoken Hindi answer (audio)** → answer card (RWA office, distance, open till, confirmed today) → route line. Fallback if voice question is cut: tap **पानी**. | session ID, answer text exactly as shown |
| S04 | `04-host-join.mp4` | 12.7 s | Host registers: type, offers, hours, pin → address appears, standby/listed, consent → saved; then a freshness card → **हाँ** | session ID |
| S05 | `05-plan-approve.mp4` | 40.7 s (raw can be longer) | Evening clock, heat curve, coverage 50% → **Run coverage plan** → real tool receipts → proposal: B · 18 with Kirana store → RWA office and the Hindi message; D · 4 in "Needs a human decision" → checkbox → **Approve outreach** | run ID, model ID |
| S06 | `06-outreach.mp4` | 20.7 s (raw can be 60 s+) | H4 inbox with countdown → **timed out** → switch to H5 → **हाँ** → coordinator board advances → rider map gains a live pot → coverage 91%; D still red | same run ID |
| S07 | `07-trust.mp4` | 10.7 s | Fresh session: rider reports **No water** twice on one point → point pauses → coordinator problem queue | session ID |
| S09 | `09-aws-proof.mp4` | 10.7 s | Step Functions console: execution named with the **same run ID**, graph showing timeout branch and accept branch, event history; then CloudWatch Logs Insights filtered by that run ID | run ID (sanitized) |

Alternative: one continuous raw capture for S05+S06 with a cue sheet (in/out seconds per slot).

## Data files → `evidence/`

- `facts.json` — copy of the app's verified `docs/evidence/facts.json` (shape in `facts.template.json`). `awsServices` decides which services the S08 narration names.
- `evidence.json` — one entry per capture (shape in `evidence.template.json`).
- Two clean 1920×1080 screenshots of the demo room (after proposal; after 91%) for callout alignment.

## Narration (Vansh decides)

Draft uses Kokoro `af_heart`. I'll also render S01 with Polly **Kajal** (bilingual Indian English + Hindi) if you allow one Polly call with your AWS profile. Or record your own voice from `src/data/narration.json` after footage is placed (48 kHz WAV).

## How delivery gets placed

Copy to `public/footage/…` → in `asset-manifest.json` set `status: "ready"`, `runId`, `capturedAt`, trims or `segments`, optional `focus` keyframes → after checking against evidence, `verified: true`. Scenes don't change.

Clip fields the edit reads (all in source pixels / seconds):

| Field | Used by | Notes |
|---|---|---|
| `sourceInSeconds` / `sourceOutSeconds` or `segments[]` | all | Slot length incl. 0.7 s lead: S03 620 f, S04 380 f, S05 1220 f, S06 620 f, S07 320 f, S09 320 f. A later segment with `shortened: true` shows **Time shortened**. |
| `focus[]` `{at, x, y, w, h}` | all | Push-ins (16:9 rects). Max one move per 3 s; UI text ≥ 28 px on the final frame. |
| `subtitle` `{hi, en}` | S03 | Exact words of the on-screen Hindi answer + English. Final render refuses without it. |
| `magnify` `{x, y, w, h}` | S05 | Rect of the Hindi plan message (≈ 3.2 : 1) for the side magnifier. |
| `appAudio`, `appAudioVolume` | S03 | Clip audio plays only in `narration.appAudioWindows.S03` (seconds from scene start). |
