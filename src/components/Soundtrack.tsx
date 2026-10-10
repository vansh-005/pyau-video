import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { manifest } from "../data/manifest";
import { musicVolume, sfxCues } from "../data/sound";
import { SCENES, SceneId, TOTAL_FRAMES } from "../data/timeline";
import { appAudioWindow, voiceTiming } from "../data/voice";

/** Global app-audio windows (seconds) — S03's real Hindi answer from the capture. */
export const globalAppAudioWindows = () =>
  (Object.keys(SCENES) as SceneId[]).flatMap((sid) => {
    const w = appAudioWindow(sid);
    return w ? [{ start: SCENES[sid].from / 30 + w.start, end: SCENES[sid].from / 30 + w.end }] : [];
  });

/** Narration (per-scene AI voice or one recorded file), ducked music bed and SFX. Global frames. */
export const Soundtrack: React.FC<{ readonly voiceDir?: string }> = ({ voiceDir }) => {
  const { fps } = useVideoConfig();
  const music = useMemo(() => musicVolume(TOTAL_FRAMES, fps, globalAppAudioWindows()), [fps]);
  const recorded = manifest.narration.kind === "recorded" && manifest.narration.status === "ready" && manifest.narration.path;
  return (
    <>
      {recorded ? (
        <Sequence name="Narration (recorded)" from={Math.round((manifest.narration.offsetSeconds ?? 0) * fps)} premountFor={fps}>
          <Audio src={staticFile(manifest.narration.path as string)} />
        </Sequence>
      ) : (
        (Object.keys(voiceTiming.scenes) as SceneId[]).map((sid) => {
          const v = voiceTiming.scenes[sid];
          const file = voiceDir ? `${voiceDir}/${sid}.wav` : v.file;
          return (
            <Sequence
              key={sid}
              name={`Voice ${sid}`}
              from={SCENES[sid].from + Math.round(v.lead * fps)}
              durationInFrames={voiceDir ? SCENES[sid].frames : Math.ceil(v.duration * fps) + 6}
              premountFor={fps}
            >
              <Audio src={staticFile(file)} />
            </Sequence>
          );
        })
      )}
      {manifest.music?.enabled !== false ? (
        <Audio
          name="Music bed (original)"
          src={staticFile(manifest.music?.src ?? "audio/bed.mp3")}
          volume={(f) => music[Math.min(f, TOTAL_FRAMES - 1)]}
        />
      ) : null}
      {sfxCues().map((c) => (
        <Sequence key={c.name} name={c.name} from={c.frame} durationInFrames={3 * fps} premountFor={fps}>
          <Audio src={staticFile(c.src)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};
