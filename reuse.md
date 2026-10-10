# Port the engine from ../heatops-video

`heatops-video` was built by Vansh on 9 Oct 2026, inside this event's window, with Claude Code + Remotion 4.0.534. Reusing his own in-event tooling is allowed; credit it in CREDITS.md and the writeup ("video tooling reused from my HeatOps prototype, built 9 Oct during the event"). Copy files, don't symlink. Never edit `../heatops-video`.

## Copy as-is, then adapt

| From `../heatops-video` | Change for Pyau |
|---|---|
| `package.json`, `package-lock.json`, `.prettierrc`, `eslint.config.mjs`, `tsconfig.json`, `remotion.config.ts`, `.gitignore` | rename to `pyau-video`; keep exact Remotion pins (4.0.534) unless the installed plugin requires otherwise; rename composition `HeatOpsDemo` → `PyauDemo`, still `HeatOpsPoster` → `PyauPoster`, `render:opening` → `S01-Problem`; add `voice:polly` script (below) |
| `public/fonts/*` + `src/fonts.ts` | add **Noto Sans Devanagari** 400 and 600 (`@fontsource/noto-sans-devanagari`, copy woff2 into `public/fonts`, OFL) for every Hindi string |
| `src/theme.ts` | replace palette with video.md tokens; keep easing, `SAFE`, `clamp` |
| `src/data/mode.tsx`, `manifest.ts`, `voice.ts`, `captions.ts` | keep logic; scene IDs and slot list from `seed/timeline.ts` |
| `src/data/timeline.ts` | replace with `seed/timeline.ts` |
| `src/data/narration.json` | replace with `seed/narration.json` |
| `src/data/sound.ts` | rewrite cue list for the new beats (video.md); keep the shape |
| `src/data/shots.ts` | rewrite draft-slate shot descriptions from FOOTAGE-REQUEST.md |
| `src/components/FootageSlot.tsx`, `CaptionTrack.tsx`, `Labels.tsx`, `layout.ts` | keep; restyle via theme; add an `appAudio` option to FootageSlot so S03 can play the clip's own audio (default muted) |
| `src/components/Wordmark.tsx` | redraw: clay-pot glyph + "Pyau" (+ "प्याऊ" small) |
| `scripts/tts.py` | update `SCENES` to the new frames; add `appAudioWindows` handling (narration skips those seconds) |
| `scripts/sound.py` | DUR stays 170 s; keep synthesis; optionally warmer pad (tanpura-like drone at low level, original synthesis only) |
| `scripts/master-audio.mts`, `qa-render.mts`, `export-captions.mts` | keep |
| `scripts/validate-manifest.mts` | new composition ID, new `SLOT_FRAMES`/`SCENE_SECONDS` from seed timeline, facts fields from `evidence/facts.template.json`, S09 run ID must match S05/S06 |
| `asset-manifest.json`, `video-props.json`, `video-props.draft.json` | start from `seed/asset-manifest.json`; props `{ "mode": "draft" }` / `{ "mode": "final" }` |

## Do not copy

`src/HeatOpsDemo.tsx`, `src/scenes/*`, `src/components/HeatTimeline.tsx`, `brief/`, `evidence/*.json`, `public/audio/voice/*`, `out/`, any HeatOps text. Write new scenes for Pyau.

## Narration engines

1. **Kokoro-82M** (existing `scripts/tts.py`, `.venv-tts`, stock voice `af_heart`): proven pipeline, natural, but American English — the Hindi close line will sound wrong; use `pauseSeconds`/on-screen text for Hindi with Kokoro.
2. **Amazon Polly `Kajal` (neural, bilingual Indian English + Hindi)** — new `scripts/tts_polly.py`: same inputs/outputs as tts.py; call `SynthesizeSpeech` twice per scene (audio `pcm`/`mp3` at 24 kHz, and `OutputFormat=json` with `SpeechMarkTypes=["word"]` for word timings) using Vansh's AWS profile. Writes the same `public/audio/voice/S0x.wav` + `src/data/voice-timing.json`, so `at(scene, word)` keeps working. Speaks "Paani, chhaon, aaraam" naturally and keeps the video on-brand. Requires Vansh's go-ahead to use his AWS credentials for this one API.
3. **Vansh's own recording** → `public/audio/narration.wav` at 48 kHz + caption alignment, as in heatops-video.

V00 renders S01 with options 1 and 2 so Vansh can choose by ear.
