import "./fonts";
import { AbsoluteFill, Composition, Folder, Freeze, Still } from "remotion";
import { CaptionTrack } from "./components/CaptionTrack";
import { Soundtrack } from "./components/Soundtrack";
import { buildCues } from "./data/captions";
import { manifest } from "./data/manifest";
import { ModeProvider, RenderMode } from "./data/mode";
import narration from "./data/narration.json";
import { SCENES, TOTAL_FRAMES } from "./data/timeline";
import { voiceTiming } from "./data/voice";
import { PyauDemo, pyauSchema } from "./PyauDemo";
import { MapBaseSvg } from "./components/CityMap";
import { S01Problem } from "./scenes/S01Problem";
import { S10Close } from "./scenes/S10Close";

// S01 on its own with its narration, music and captions (V00 proof: `npm run render:opening`).
const OpeningProof: React.FC<{ voiceDir?: string }> = ({ voiceDir }) => {
  const cues = buildCues(narration as never, { S01: SCENES.S01 }, manifest.facts, 30, voiceTiming.scenes);
  return (
    <AbsoluteFill>
      <S01Problem />
      <Soundtrack voiceDir={voiceDir} />
      {voiceDir ? null : <CaptionTrack cues={cues} />}
    </AbsoluteFill>
  );
};

// Poster: the closing card, frozen once fully revealed, without burned-in captions.
const Poster: React.FC<{ mode: RenderMode }> = ({ mode }) => (
  <ModeProvider mode={mode}>
    <Freeze frame={200}>
      <S10Close />
    </Freeze>
  </ModeProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PyauDemo"
      component={PyauDemo}
      schema={pyauSchema}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ mode: "draft" as const, archTheme: "sand" as const }}
    />
    <Still id="PyauPoster" component={Poster} schema={pyauSchema} width={1920} height={1080} defaultProps={{ mode: "draft" as const }} />
    <Folder name="Scenes">
      {/* Static streets for S01/S02, pre-rendered to public/map/base.png (npm run map:base) */}
      <Still id="MapBase" component={MapBaseSvg} width={1920} height={1080} />
      <Composition
        id="S01-Problem"
        component={OpeningProof}
        durationInFrames={SCENES.S01.frames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{} as { voiceDir?: string }}
      />
    </Folder>
  </>
);
