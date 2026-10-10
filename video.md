# Creative and edit blueprint

**Story:** problem → how Pyau fixes it → how it runs on AWS. One continuous piece, no fade-to-blank between acts. The video should make a judge *feel* the heat in the first 5 seconds, *understand* the product by 0:45, *see the agent act* by 1:40 and *see AWS doing it* by 2:40.

Judging lens (event page): real environmental problem and what changes for people · built on AWS (must be *shown*) · usable by outsiders · it works · ≤ 3-minute video. Every scene serves one of these.

## Format

170 s · 1920×1080 · 30 fps · 5100 frames · H.264/yuv420p + AAC · −16 LUFS. Composition `PyauDemo`.

## Palette and type (match the app)

sand `#F6F1E7` canvas · ink `#1D2A33` · muted `#5B6770` · water `#16708F` · clay `#B5562E` · heat `#C9771C` · gap `#B3261E` · ok `#2E7D4F` · standby `#7A6FB0` · night `#14222B` (evening scenes / architecture background option).
Inter (UI), Source Serif 4 (headlines, italic for quotes), JetBrains Mono (times, IDs, °C), Noto Sans Devanagari (Hindi). Headlines 64–88 px serif; captions 36 px bottom with 64 px safe margin.

## Edit skeleton (frames [start, end))

| Shot | Time | Frames | Content | Source |
|---|---|---|---|---|
| S01 | 0:00–0:18 | 0–540 | **Problem** | Motion graphic |
| S02 | 0:18–0:24 | 540–720 | **Pyau bridge** | Motion graphic |
| S03 | 0:24–0:44 | 720–1320 | Rider asks in Hindi, phone answers in Hindi | App capture **with app audio** |
| S04 | 0:44–0:56 | 1320–1680 | Host joins; morning "still serving?" | App capture |
| S05 | 0:56–1:36 | 1680–2880 | **Turning point:** evening plan by the agent, approval | App capture + callouts |
| S06 | 1:36–1:56 | 2880–3480 | Step Functions outreach: timeout → next host → yes → 50% → 91% | App capture + callouts |
| S07 | 1:56–2:06 | 3480–3780 | Trust loop: reports pause a dry point | App capture |
| S08 | 2:06–2:32 | 3780–4560 | **AWS architecture** with travelling pulse | Motion graphic |
| S09 | 2:32–2:42 | 4560–4860 | Step Functions console + CloudWatch, same run ID | AWS capture |
| S10 | 2:42–2:50 | 4860–5100 | Close | Motion graphic |

App slots (S03–S07, S09) start 20 frames early for crossfades (`SLOT_PREROLL = 20`).

## Scene direction

**S01 Problem (18 s).** Cold open, no logo. A top-down, sun-bleached street map (stylised vector, not a real map screenshot) with a heat shimmer (subtle displacement on a noise texture, keep it calm). Big mono timestamp **2:10 PM** and **Feels like 45 °C** count up in the corner. A small rider dot (scooter glyph) moves along a road, a thin heat-coloured trail behind it. Two facts land as editorial cards, each ≤ 4 s on screen, source line in small mono under each:
- "7.7 million gig workers. 23.5 million by 2029–30." — *NITI Aayog, as reported by Mongabay India*
- "Over half reported heat-exhaustion symptoms. More than 4 in 10 lacked cold, clean water." — *IFAT survey 2024, as reported by Mongabay India*
Then the turn: faint grey dots fade in around the rider — a shop, a temple, a chemist, a water ATM — each with a tiny icon. Line: **"The help exists. Riders just can't see it."** The dots pulse once, too faint for the rider to reach.

**S02 Pyau bridge (6 s).** Hard cut to sand canvas. A hand-drawn-style clay pot (SVG, terracotta, a single ladle) with a line in serif italic: *"India always had pyaus."* Subtitle in Devanagari: प्याऊ. The pot morphs into a map pin; the pin drops onto the S01 map, all the faint dots turn into confirmed pot icons, and the wordmark **Pyau** writes on. The map then shrinks into the right side of the persistent **demo-room frame**.

**S03–S07 inside one persistent frame.** A rounded browser-style frame (no fake browser chrome beyond a thin bar) holds the real demo-room capture. To its left, a narrow **story rail** ticks through: *Ask → Host → Plan → Follow through → Trust*. Captures crossfade inside the frame; the frame never leaves the screen. Use `focus` crop keyframes to push in on the active phone panel (rider/host) or the coordinator centre so UI text is ≥ 28 px on the final frame. Maximum one move per 3 s; 0.6–0.8 s eases.

**S03 Rider (20 s).** Push into the rider phone. Real clip: mic held, Hindi question, transcript appears, **app audio plays** (the Polly Hindi answer), route line draws. Narration ducks fully while the app speaks (`appAudioWindows`). Add a bilingual subtitle for the Hindi audio: e.g. *"सबसे पास पानी: RWA ऑफिस, … मीटर" → "Nearest water: RWA office, … m"* — copy the exact words and numbers from the real on-screen answer, never invent them. Callout chip: "Open now · confirmed today".

**S04 Host (12 s).** Push into the host phone. Registration in three taps, address appearing from the map pin; cut to the morning freshness card, thumb taps **हाँ**. Callout: "Joins in under a minute."

**S05 Turning point (40 s).** Pull back to the full demo room. Optional 1 s dusk wash over the frame (canvas warms to evening) — the scene is *the evening before*. Callouts land on the real UI in sequence, each pointing at a real element:
1. Heat curve: "Tomorrow 1–4 PM" over the shaded band.
2. Coverage number: **50%** "of rider requests near open water".
3. **Run coverage plan** click → tool receipts stream; highlight each receipt line briefly as narration names it (forecast, demand, coverage, candidates).
4. The red cluster **B · 18** pulses; the plan card shows *Kirana store → RWA office* and the Hindi message (enlarge the message in a side magnifier: Devanagari ≥ 32 px).
5. Gap **D · 4** in the "Needs a human decision" box: callout "It says what it can't fix."
6. Checkbox + **Approve outreach**.
If processing time is shortened, show the small "Time shortened" label — mandatory.

**S06 Follow-through (20 s).** Split focus: host phone (H4) countdown → *timed out* (stamp animation on the real status) → host switcher to H5 → **हाँ**. Coordinator board advances; rider map gets a new live pot. The coverage number on the real UI changes 50% → 91%; overlay a large echo of the number (from facts.json) beside the frame with a ring filling to 91%. Gap D stays red — keep it in shot.

**S07 Trust (10 s).** Short: two "No water" taps → point greys out → problem queue. Callout: "Bad points pause themselves."

**S08 AWS (26 s).** The demo-room frame shrinks into a **"Web app"** node on the left of a clean architecture diagram (night or sand background — test both). Nodes appear as they're named in narration (`at("S08", word)`): Amplify, Amazon Location, API Gateway, Lambda, Step Functions, Strands agent ↔ Amazon Bedrock, DynamoDB, Polly, Transcribe, EventBridge Scheduler, Cognito, CloudWatch. Use official AWS service names in text; **don't use AWS icons unless you have the official Architecture Icons package and follow its usage terms** — simple rounded nodes with the service name are fine. A water-blue pulse travels the request path; when it reaches Step Functions, a mini state graph unfolds (PlanWithAgent → AwaitApproval → AskHost ⟲ timeout → AskHost ✓ → PublishPoint) — this is an *illustration*; label "Illustration" small until S09 shows the real one. Only include services listed in `evidence/facts.json` → `awsServices`.

**S09 Proof (10 s).** The Step Functions node grows into the real console capture: the execution graph with the timeout branch and accept branch, execution name = run ID. Highlight the run ID; then a CloudWatch log line with the same ID. Crop away account IDs. Small mono label "Real execution · {runId short}".

**S10 Close (8 s).** Sand canvas, pot glyph, **Pyau**, line in serif: *"Paani, chhaon, aaraam — jahan kaam hai, wahan."* with the English underneath *"Water, shade, rest — wherever the work is."*, then the app URL and repo URL in mono. Track 02 · Heat and Water. No spinning logos.

## Motion rules

Frame-driven deterministic animation only. 0.4–0.9 s moves, `easeOut` for entrances, `easeInOut` for camera. No particle storms, neon, glitch, 3D spins, stock disaster footage or fake phone mockups around real captures (the demo room already has phone frames). Text on screen ≤ 12 words at a time outside captions. Every number on screen comes from `facts.json` (final) or is tagged "Expected · unverified" (draft).

## Narration, audio, captions

- Script: `seed/narration.json` (≈ 320 words; `||` = beat). Visual beats key off spoken words via `at(scene, word)`.
- S03 contains `appAudioWindows`: the app clip's own audio plays and narration is silent there; captions show the Hindi line + English translation from the real UI text.
- Voice options and engines: see reuse.md (Kokoro, Polly Kajal bilingual, or Vansh). Render S01 with two engines in V00 for Vansh to choose.
- Music bed from `scripts/sound.py` (project-owned synthesis), ducked ~12 dB under speech, off during S03 app audio. SFX: soft tick on story-rail steps, pop on architecture nodes, a low "clock" tick under the S06 countdown, chime on the close.
- Captions 36 px, two lines max, Devanagari font for Hindi. Export SRT.

## Rendering

`npm run render:preview` (540p) · `npm run render:draft` (full, QA) · `npm run render:final` (blocked until real captures, verified facts and approved narration exist). Final output `out/pyau-final.mp4`, `out/pyau-captions.srt`, `out/pyau-poster.png`. Check the real file: duration < 180 s, 1080p30, audio present, no black frames, no placeholders.
