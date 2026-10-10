import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Cue } from "../data/captions";
import { C, F, clamp } from "../theme";

/** Burned-in captions. Same cues are exported to out/pyau-captions.srt. */
export const CaptionTrack: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const o = interpolate(t, [cue.start, cue.start + 0.12, cue.end - 0.1, cue.end], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 34,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          padding: "10px 26px 12px",
          borderRadius: 10,
          background: "rgba(23, 43, 53, 0.92)",
          color: "#FFFFFF",
          fontFamily: F.sans,
          fontWeight: 500,
          fontSize: 36,
          lineHeight: 1.3,
          textAlign: "center",
          opacity: o,
          boxShadow: `0 0 0 1px ${C.ink}`,
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
