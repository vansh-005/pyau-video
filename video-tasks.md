# Video tasks

V00 partly done (Polly A/B pending Vansh), V01–V04 done 10 Oct. Owner: video agent unless stated. V00–V04 need no app footage — start immediately.

- [~] **V00 — Port engine + tiny render (60 min).** Copy/adapt per reuse.md; `npm ci`; render 12 s S01 proof; render the S01 narration with Kokoro and (if allowed) Polly Kajal for Vansh to choose. *Done:* playable MP4(s), local fonts incl. Devanagari, no network during render.
- [x] **V01 — Visual system (60 min).** Theme tokens, wordmark with pot glyph, map graphic primitives (roads, rider dot, help dots, pins), demo-room frame + story rail, callout/label components, captions. *Done:* S01 conveys the problem in the first 5 s at 1080p.
- [x] **V02 — Full skeleton (60 min).** `PyauDemo` with ten scenes/5100 frames from `seed/timeline.ts`; draft slates for S03–S07, S09; full draft renders. *Done:* 170 s preview without the app.
- [x] **V03 — Footage + data interface (45 min).** Manifest loader, FootageSlot with trims/focus/`appAudio`, final-mode validation adapted to Pyau slots and facts. *Done:* draft passes with slates; final is blocked with a clear list.
- [x] **V04 — Motion scenes (120 min).** S01 problem, S02 pyau bridge, S08 architecture with pulse and illustrative mini state graph, S10 close; scratch narration + captions; sound bed and cues. *Done:* every non-footage scene is final quality.
- [ ] **V05 — First real footage (checkpoint B).** Rough S05 in; check crops, push-ins, text size; request retakes with reasons. *Done:* one real clip replaces a slate without redesigning scenes.
- [ ] **V06 — Turning point (checkpoint C).** S05 + S06 + S09 real; callouts aligned to real UI; numbers from facts.json; "Time shortened" where used. *Done:* a viewer sees agent plan → approval → timeout → next host → yes → 91%, and the same run in Step Functions.
- [ ] **V07 — Remaining footage (checkpoint D).** S03 with app audio window and bilingual subtitle from real UI text; S04; S07. *Done:* no placeholder left.
- [ ] **V08 — Final narration + captions.** Vansh picks the voice; regenerate or integrate; set `appAudioWindows`; S08 names only services in facts.json; captions incl. Devanagari. *Done:* script matches footage, fits 170 s.
- [ ] **V09 — Final render + QA.** `npm run render:final`; ffprobe duration < 180 s; QA script; watch with sound and muted. *Done:* `out/pyau-final.mp4`, SRT, poster.
- [ ] **V10 — Upload (Vansh).** YouTube unlisted/public, title "Pyau — water for riders in the heat · AWS Environmental Hacks", description with repo + app URL + AWS services + AI tools used. *Done:* link opens signed out.

Budget: V00–V04 on 10 Oct while the app is built; V05–V07 as footage lands; V08–V10 on 11 Oct with margin before the deadline. If rendering is slow, preview at 540p.

## Progress log

### 10 Oct — V00–V04 (video agent)

**V00 — engine ported, opening proof rendered.**
- Copied from `../heatops-video` (read-only, nothing modified there): package.json/lock, configs, `public/fonts/*`, `src/fonts.ts`, `theme.ts`, `data/{mode,manifest,voice,captions,sound,shots}`, `components/{FootageSlot,CaptionTrack,Labels,layout,Wordmark}`, `scripts/{tts.py,sound.py,master-audio,qa-render,export-captions,validate-manifest}`. Seeds copied to `src/data/timeline.ts`, `src/data/narration.json`, `asset-manifest.json`. Remotion pinned at 4.0.534.
- Added `@fontsource/noto-sans-devanagari@5.3.0` → `public/fonts/noto-sans-devanagari-devanagari-{400,600}-normal.woff2` (OFL); `@remotion/paths`, `@remotion/noise` 4.0.534. All fonts load from `public/fonts` via `staticFile` — no network font fetches.
- Own `.venv-tts` with heatops' pinned packages (kokoro 0.9.4, misaki 0.9.4, torch 2.14.1) + boto3. ffmpeg/ffprobe 7.1.1 present; Node 24.19.
- `npm run voice` (Kokoro `af_heart`): all 10 scenes fit — S01 16.60/16.65 s, S02 4.97/5.35, S03 17.85/19.25, S04 9.97/11.35, S05 36.45/39.15, S06 19.10/19.25, S07 6.70/9.25, S08 23.82/25.15, S09 6.78/9.25, S10 3.75/6.65. S03 app-audio window (voice beat): 3.82–12.83 s from scene start. Hindi words use misaki inline phonemes (`kokoroPhonemes` in narration.json) — "Pyau" now /pjˈɑu/, not "pie-ow".
- `npm run render:opening:voices` → `out/draft/opening-proof-kokoro.mp4` (h264 1920×1080 30 fps, AAC 48 kHz, 12.01 s). Mastered copy `out/draft/opening-proof-kokoro-mastered.mp4`: −21.9 → −16 LUFS, QA OK, no black frames.
- **Polly Kajal variant not rendered** — `scripts/tts_polly.py` is written (SSML marks for beats, speech-mark word timings, `--alt` writes `public/audio/voice-polly/` without touching Kokoro files) but needs Vansh's go-ahead to call `polly:SynthesizeSpeech` with his profile.

**V01 — visual system.** `theme.ts` tokens from video.md; `F.deva` for every Hindi string. `Wordmark.tsx`: code-drawn clay pot (confirmed/outline/dashed-standby states, optional ladle) + "Pyau" serif + "प्याऊ". `CityMap.tsx`: stylised skewed-grid city (deterministic blocks + building footprints, 4 arterials, dry park, drain), rider scooter glyph with heat trail, faint help dots (shop/temple/chemist/water ATM) that become pot pins. Heat shimmer = pre-rendered street bitmap (`npm run map:base` → `public/map/base.png`) in 6 px strips nudged by slow sines; replaced a full-frame SVG displacement filter that rendered at ~1 s/frame (now ~0.12 s/frame). `DemoRoom.tsx`: persistent frame (thin bar, no fake browser chrome), story rail Ask → Host → Plan → Follow through → Trust, header mark. `Labels.tsx`: Tag, Callout, Chapter, `IllustrationLabel`, `UnverifiedMark` ("Expected · unverified" in draft; throws in final if facts unverified).

**V02 — full skeleton.** `PyauDemo` (1920×1080, 30 fps, 5100 f) = ten `Series.Sequence` scenes from the seed timeline; footage scenes use `offset={-20}` + 20 extra frames so their slot crossfades while every scene still ends on its boundary. Persistent room chrome lives in two layers (under/over the Series) from the S02 landing to the S08 hand-off. `PyauPoster` still (S10 frozen, no captions). `archTheme` prop: `sand` (default) / `night` for S08–S09 — both rendered for comparison.

**V03 — footage + data interface.** `FootageSlot`: trims/segments ("Time shortened" tag on shortened segments), focus keyframes, new `appAudio` window (clip audio only inside `appAudioWindows.S03`, 0.25 s ramps; music drops to 0 there), `crop` for the S05 Hindi magnifier. Draft slates list exactly what each capture must show (from FOOTAGE-REQUEST). `validate-manifest.mts` adapted: PyauDemo metadata, slot frames S03 620/S04 380/S05 1220/S06 620/S07 320/S09 320, all facts fields vs `evidence/facts.json`, coverage percent recomputed, every service named in S08 narration must be in `facts.awsServices`, S09 run ID == S05 == S06, S03 bilingual subtitle required, narration approved. Draft run: 25 blocking issues listed, exit 0; `--final` exits 1.

**V04 — motion scenes.** S01 (cold open from glare, 2:04→2:10 PM, feels-like 39→45 °C, two sourced fact cards ≤ 4 s each with mono source lines, faint help → "The help exists. / Riders just can't see it.", one pulse that dies before reaching the rider, "Illustration" label). S02 (pot with ladle → pin forms → drops onto the S01 map → dots become confirmed pots → wordmark writes on → map shrinks into the demo-room video rect while rail and frame appear). S08 (frame frozen on S07's last frame shrinks into the Web app node; nodes arrive on their spoken word; water-blue pulse hops Web → API Gateway → Lambda → Strands ↔ Bedrock, Lambda → Step Functions, where a labelled-illustration state graph unfolds: PlanWithAgent → AwaitApproval → AskHost ⟲ timeout → AskHost ✓ → PublishPoint). S09 (Step Functions node grows into the console capture rect). S10 (pot + Pyau, Hinglish line + English, URLs from facts, Track 02). Captions burned in + SRT (`out/draft/pyau-captions-draft.srt`, 51 cues). Sound: bed retimed to the Pyau acts with an original tanpura-like drone; SFX tick (rail), pop (nodes, pin), whoosh (hand-offs), clock (S06 countdown), stamp (timed out), chime (close).

**Draft render + gate (evidence).**
- `npm run render:draft` → `out/draft/pyau-draft.mp4`: h264 1920×1080 30/1 yuv420p, AAC 48 kHz, 170.1 s, integrated −16.0 LUFS, QA OK, no black segments. One >4 s silence at 27.5 s = the S03 app-audio window (empty until the real clip with its Hindi answer arrives). Poster `out/draft/pyau-poster-draft.png`, SRT `out/draft/pyau-captions-draft.srt` (51 cues). Full render ≈ 5 min on this machine.
- `npm run render:final` → exit 1, "25 blocking issue(s)", no `out/pyau-final.mp4` written.
- Fact check: re-opened Mongabay India (5 Aug 2025) — verbatim "in 2020-21, 7.7 million workers…", "expected to expand to 23.5 million by 2029-30", "over 50% … reported symptoms of heat exhaustion and heat stroke", "more than 40% … lacked access to cold, clean drinking water". Card now reads "7.7 million gig workers in 2020–21 / 23.5 million expected by 2029–30"; narration changed "India has" → "India had" (src/data/narration.json; seed/ left as delivered). S01 voice regenerated (16.62 s).
- Render-speed note: the app session's `cdk deploy` competes for CPU; timings vary.

**Open / blocked**
- Polly Kajal A/B for V00 — waiting on Vansh's OK.
- All app/AWS footage (S03–S07, S09), `evidence/facts.json`, `evidence.json`.
- S08 nodes: Cognito and CloudWatch are not narrated; they show only if `facts.awsServices` lists them (draft shows the planned set with a "confirm against facts.json" tag).
- S03 subtitle and S05 magnifier rect need the real UI text/positions.
