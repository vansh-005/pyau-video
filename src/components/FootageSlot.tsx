import React from "react";
import { Video } from "@remotion/media";
import { Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Clip, Focus, clipSegments, getClip } from "../data/manifest";
import { assertNotFinal, useMode } from "../data/mode";
import { SHOT_REQUESTS } from "../data/shots";
import { C, F, clamp } from "../theme";
import { Tag } from "./Labels";

type Props = {
  readonly shotId: string;
  readonly width: number;
  readonly height: number;
  readonly style?: React.CSSProperties;
  /**
   * Slot-local seconds in which the clip's own audio plays (S03 app answer). Only used when the
   * manifest clip has `appAudio: true`. Outside the window — and for every other clip — footage is muted.
   */
  readonly audioWindow?: { readonly start: number; readonly end: number } | null;
  /** Fixed crop rect in source pixels (magnifier). Overrides the manifest focus keyframes. */
  readonly crop?: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
};

/**
 * Plays the manifest clip for a shot, or a clearly labeled draft slate when absent.
 * Swapping footage only touches asset-manifest.json — scenes never change.
 */
export const FootageSlot: React.FC<Props> = ({ shotId, width, height, style, audioWindow, crop }) => {
  const mode = useMode();
  const clip = getClip(shotId);
  const ready = clip !== undefined && clip.status === "ready" && clipSegments(clip).length > 0;
  if (!ready) assertNotFinal(mode, `footage for ${shotId} is missing`);
  if (ready && mode === "final" && !clip.verified) assertNotFinal(mode, `footage for ${shotId} is not verified`);

  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        overflow: "hidden",
        background: C.night,
        ...style,
      }}
    >
      {ready ? <ClipPlayer clip={clip} width={width} height={height} crop={crop} audioWindow={clip.appAudio && !crop ? audioWindow ?? null : null} /> : <DraftSlate shotId={shotId} clip={clip} />}
    </div>
  );
};

const focusAt = (focus: readonly Focus[] | undefined, t: number, sw: number, sh: number) => {
  if (!focus || focus.length === 0) return { x: 0, y: 0, w: sw, h: sh };
  if (t <= focus[0].at) return focus[0];
  for (let i = 0; i < focus.length - 1; i++) {
    const a = focus[i];
    const b = focus[i + 1];
    if (t <= b.at) {
      // Small, controlled moves: ease over at most 0.8 s before the next keyframe.
      const start = Math.max(a.at, b.at - 0.8);
      const p = interpolate(t, [start, b.at], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        w: a.w + (b.w - a.w) * p,
        h: a.h + (b.h - a.h) * p,
      };
    }
  }
  return focus[focus.length - 1];
};

const ClipPlayer: React.FC<{
  clip: Clip;
  width: number;
  height: number;
  audioWindow: { readonly start: number; readonly end: number } | null;
  crop?: Props["crop"];
}> = ({ clip, width, height, audioWindow, crop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sw = clip.sourceWidth ?? 1920;
  const sh = clip.sourceHeight ?? 1080;
  const r = crop ?? focusAt(clip.focus, frame / fps, sw, sh);
  const scale = Math.max(width / r.w, height / r.h);

  let acc = 0;
  const segs = clipSegments(clip).map((s) => {
    const rate = s.rate ?? 1;
    const len = Math.round(((s.out - s.in) * fps) / rate);
    const from = acc;
    acc += len;
    return { ...s, rate, len, from };
  });
  const active = segs.find((s) => frame >= s.from && frame < s.from + s.len);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: sw,
          height: sh,
          transformOrigin: "0 0",
          translate: `${-r.x * scale}px ${-r.y * scale}px`,
          scale: String(scale),
        }}
      >
        {segs.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.len} premountFor={fps} name={`${clip.shotId} seg ${i + 1}`}>
            <Video
              src={staticFile(clip.path)}
              trimBefore={Math.round(s.in * fps)}
              playbackRate={s.rate}
              muted={audioWindow === null}
              volume={(f) => {
                if (audioWindow === null) return 0;
                // f is local to this segment's Sequence; convert to slot seconds. 0.25 s ramps at the window edges.
                const t = (s.from + f) / fps;
                const v = clip.appAudioVolume ?? 1;
                return interpolate(t, [audioWindow.start - 0.25, audioWindow.start, audioWindow.end, audioWindow.end + 0.25], [0, v, v, 0], clamp);
              }}
              style={{ width: sw, height: sh }}
            />
          </Sequence>
        ))}
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 18, display: "flex", gap: 10 }}>
        {active?.shortened ? <Tag tone="ink">Time shortened</Tag> : null}
        {active && active.rate > 1 ? <Tag tone="ink">{`Accelerated ×${active.rate}`}</Tag> : null}
      </div>
    </>
  );
};

/** Unmistakable placeholder. Never styled like the product UI. */
const DraftSlate: React.FC<{ shotId: string; clip: Clip | undefined }> = ({ shotId, clip }) => {
  const req = SHOT_REQUESTS[shotId];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `repeating-linear-gradient(135deg, #14222B 0 28px, #192A34 28px 56px)`,
        color: "#EEF1F2",
        fontFamily: F.sans,
        padding: "44px 52px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          style={{
            background: C.heat,
            color: C.night,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: 2,
            padding: "8px 16px",
            borderRadius: 6,
          }}
        >
          DRAFT · FOOTAGE PENDING
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 26, color: "#9FB3BC" }}>
          {shotId} · public/{clip?.path ?? `footage/${req?.file ?? "?"}`}
        </span>
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, marginTop: 30, lineHeight: 1.15 }}>{req?.title ?? "Real capture required"}</div>
      <div style={{ fontSize: 26, color: "#9FB3BC", marginTop: 26, textTransform: "uppercase", letterSpacing: 1.5 }}>
        Real app capture must show
      </div>
      <ul style={{ fontSize: 30, lineHeight: 1.45, margin: "10px 0 0 0", paddingLeft: 34 }}>
        {(req?.mustShow ?? []).map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <div style={{ marginTop: "auto", fontSize: 26, color: "#9FB3BC" }}>
        Evidence: <span style={{ fontFamily: F.mono, color: "#E9EEF0" }}>{req?.evidence}</span>
      </div>
      <div style={{ fontSize: 22, color: "#7F959F", marginTop: 8 }}>
        Placeholder only — not product footage. Final render is blocked until a verified capture replaces it.
      </div>
    </div>
  );
};
