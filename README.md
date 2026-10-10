# Pyau video workspace

The 3-minute demo video is the main thing judges score — there is no live demo. This workspace produces it with **Remotion** driven by **Claude Code on Opus**, as a separate session from the app build. It contains instructions, a storyboard, a draft script and seed data — not a rendered video or a Remotion project yet. The video agent builds those here.

## Fastest start: reuse your HeatOps video engine

On 9 Oct (during this event) you already built a working Remotion pipeline in `heatops-video`: local fonts, Kokoro narration with word timings, `at(scene, word)` animation sync, `FootageSlot` with trims and focus zooms, synthesized sound bed, loudness mastering, QA and a final-render gate. **Port that engine; write new scenes.** `reuse.md` lists exactly which files to copy and what to change. This saves the first 2–3 hours.

Layout on disk (siblings):

```
work/
  heatops-video/   ← existing repo (read-only source for the engine)
  pyau/            ← app workspace (separate Claude Code session)
  pyau-video/      ← this pack, the video session
```

## Setup (PowerShell)

1. Extract this zip as `pyau-video` next to `heatops-video` and `pyau`.
2. Install the official Remotion Claude Code plugin (skip if already installed for heatops-video):

```powershell
claude plugin marketplace add remotion-dev/claude-code-plugin
claude plugin install remotion@remotion
```

   Alternative if the plugin is unavailable: `npx skills add remotion-dev/skills` (project-local install). Don't substitute unrelated third-party video plugins.
3. Open `pyau-video` in a new Claude Code session, select Opus, and paste the kickoff prompt below.

## Kickoff prompt

> /remotion:remotion-create Read CLAUDE.md, video.md, reuse.md, handoff.md, FOOTAGE-REQUEST.md, video-tasks.md and the read-only brief/ files. Build the Pyau demo video here. First port the engine from ../heatops-video exactly as reuse.md says, then render a 12-second proof of the opening (S01) before building the full edit. Use the 170-second storyboard in video.md and the seed files. I want precise, editorial motion design, readable product footage and continuous transitions — the opening map shrinks into the demo-room frame, the frame shrinks into the architecture, the AWS proof grows out of the Step Functions node. Missing footage stays as clearly labelled draft slates. Don't build or change the Pyau app and never fabricate product interactions. Track progress in video-tasks.md. The app is being built in parallel; start everything that doesn't need its footage now.

## Who owns what

| Workspace / person | Owns | Hands over |
|---|---|---|
| App agent (`pyau`) | App, AWS, numbers, demo room, evidence exports | `facts.json`, `evidence.json`, capture guide |
| Video agent (`pyau-video`) | Remotion project, motion design, edit, captions, audio, MP4 | previews, final MP4, SRT, poster |
| Vansh | Screen recordings, narration choice, final review, YouTube upload, submission | footage files, approval |

## Parallel milestones

- **Now:** port engine, palette, S01 problem graphic, S02 pyau bridge, S08 architecture, S10 close, full skeleton with draft slates, scratch narration.
- **First real `/demo` proposal:** drop a rough S05 capture in; fix crops and text size.
- **Outreach + Step Functions work:** S06 and S09 → lock the turning point.
- **Rider voice works:** S03 with real app audio; then S04, S07.
- **Claims frozen:** final narration, captions, final render, full watch-through, upload unlisted, check signed out.

Primary references (verify against the installed version): https://www.remotion.dev/docs/ai/claude-code-plugin · https://www.remotion.dev/docs/ai/skills · https://www.remotion.dev/docs/cli/render. Render locally; no cloud rendering.
