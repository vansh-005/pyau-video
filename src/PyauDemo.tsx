import React from "react";
import { AbsoluteFill, Sequence, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { CaptionTrack } from "./components/CaptionTrack";
import { FrameBack, FrameFront, HeaderMark, StoryRail } from "./components/DemoRoom";
import { Soundtrack } from "./components/Soundtrack";
import { buildCues } from "./data/captions";
import { manifest } from "./data/manifest";
import { ModeProvider, RenderMode } from "./data/mode";
import narration from "./data/narration.json";
import { SCENES, SLOT_PREROLL, SceneId } from "./data/timeline";
import { voiceTiming } from "./data/voice";
import { S03Rider, S04Host, S05Plan, S06FollowThrough, S07Trust } from "./scenes/AppScenes";
import { ArchTheme, S08Architecture, S09Proof } from "./scenes/Architecture";
import { S01Problem } from "./scenes/S01Problem";
import { CHROME_FROM, S02Bridge, chromeOpacity, railReveal } from "./scenes/S02Bridge";
import { S10Close } from "./scenes/S10Close";
import { C, F } from "./theme";

export const pyauSchema = z.object({
  mode: z.enum(["draft", "final"]),
  archTheme: z.enum(["sand", "night"]).optional(),
});

type Props = z.infer<typeof pyauSchema>;

/** In-composition gate; scripts/validate-manifest.mts runs the full checks before rendering. */
const assertFinalReady = (mode: RenderMode) => {
  if (mode !== "final") return;
  const problems: string[] = [];
  if (!manifest.finalRenderAllowed) problems.push("manifest.finalRenderAllowed is false");
  if (manifest.mode !== "final") problems.push("manifest.mode is not final");
  if (!manifest.facts.verified) problems.push("facts are not verified");
  if (manifest.narration.status !== "ready" || !manifest.narration.finalApproved) problems.push("narration not approved");
  for (const c of manifest.clips) {
    if (c.status !== "ready" || !c.verified) problems.push(`${c.shotId} not ready+verified`);
  }
  if (problems.length > 0) throw new Error(`Final render blocked:\n- ${problems.join("\n- ")}`);
};

const CHROME_TO = SCENES.S08.from;

/** Demo-room frame background (under the footage), from the S02 landing to the S08 hand-off. */
const RoomBack: React.FC = () => {
  const g = CHROME_FROM + useCurrentFrame();
  return <FrameBack opacity={chromeOpacity(g)} />;
};

/** Frame bar, story rail and header wordmark (over the footage). */
const RoomFront: React.FC = () => {
  const g = CHROME_FROM + useCurrentFrame();
  return (
    <>
      <FrameFront opacity={chromeOpacity(g)} />
      <StoryRail g={g} reveal={railReveal(g)} />
      {g >= SCENES.S03.from ? <HeaderMark /> : null}
    </>
  );
};

/** App/AWS footage scenes start SLOT_PREROLL early (crossfade) and still end on their scene boundary. */
const slot = (id: SceneId) => ({ offset: -SLOT_PREROLL, durationInFrames: SCENES[id].frames + SLOT_PREROLL });

export const PyauDemo: React.FC<Props> = ({ mode, archTheme = "sand" }) => {
  const { fps } = useVideoConfig();
  assertFinalReady(mode);
  const recorded = manifest.narration.kind === "recorded" && manifest.narration.status === "ready";
  const cues = buildCues(narration as never, SCENES, manifest.facts, fps, recorded ? null : voiceTiming.scenes);
  const theme = archTheme as ArchTheme;

  return (
    <ModeProvider mode={mode}>
      <AbsoluteFill style={{ background: C.canvas }}>
        <Sequence name="Demo room · back" from={CHROME_FROM} durationInFrames={CHROME_TO - CHROME_FROM} premountFor={fps}>
          <RoomBack />
        </Sequence>

        <Series>
          <Series.Sequence name="S01 Problem" durationInFrames={SCENES.S01.frames} premountFor={fps}>
            <S01Problem />
          </Series.Sequence>
          <Series.Sequence name="S02 Pyau bridge" durationInFrames={SCENES.S02.frames} premountFor={fps}>
            <S02Bridge />
          </Series.Sequence>
          <Series.Sequence name="S03 Rider asks" {...slot("S03")} premountFor={fps}>
            <S03Rider />
          </Series.Sequence>
          <Series.Sequence name="S04 Host joins" {...slot("S04")} premountFor={fps}>
            <S04Host />
          </Series.Sequence>
          <Series.Sequence name="S05 Turning point" {...slot("S05")} premountFor={fps}>
            <S05Plan />
          </Series.Sequence>
          <Series.Sequence name="S06 Follow through" {...slot("S06")} premountFor={fps}>
            <S06FollowThrough />
          </Series.Sequence>
          <Series.Sequence name="S07 Trust" {...slot("S07")} premountFor={fps}>
            <S07Trust />
          </Series.Sequence>
          <Series.Sequence name="S08 AWS architecture" durationInFrames={SCENES.S08.frames} premountFor={fps}>
            <S08Architecture theme={theme} />
          </Series.Sequence>
          <Series.Sequence name="S09 AWS proof" {...slot("S09")} premountFor={fps}>
            <S09Proof theme={theme} />
          </Series.Sequence>
          <Series.Sequence name="S10 Close" durationInFrames={SCENES.S10.frames} premountFor={fps}>
            <S10Close />
          </Series.Sequence>
        </Series>

        <Sequence name="Demo room · front" from={CHROME_FROM} durationInFrames={CHROME_TO - CHROME_FROM} premountFor={fps}>
          <RoomFront />
        </Sequence>

        <Soundtrack />
        <CaptionTrack cues={cues} />

        {mode === "draft" ? (
          <div
            style={{
              position: "absolute",
              right: 22,
              bottom: 12,
              fontFamily: F.mono,
              fontSize: 16,
              color: C.heat,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            DRAFT PREVIEW
          </div>
        ) : null}
      </AbsoluteFill>
    </ModeProvider>
  );
};
