import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Wordmark } from "../components/Wordmark";
import { manifest } from "../data/manifest";
import { useMode } from "../data/mode";
import { atLocal } from "../data/voice";
import { C, F, clamp, easeOut } from "../theme";

/** S10 — Close (8 s). Pot + Pyau, the line in Hinglish and English, URLs, track. No spinning logos. */
export const S10Close: React.FC = () => {
  const frame = useCurrentFrame();
  const mode = useMode();
  const f = manifest.facts;
  const fade = (at: number, dur = 16) => interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  const tMark = atLocal("S10", "Pyau", 1, -0.5, 1.2);
  const tLine = atLocal("S10", "Paani", 1, -0.2, 1.6);
  const tEn = atLocal("S10", "Jahan", 1, 0, 3.0);
  const tUrl = atLocal("S10", "wahan", 1, 0.5, 3.8);
  const mark = interpolate(frame, [Math.max(0, tMark - 6), tMark + 22], [0, 1], { ...clamp, easing: easeOut });
  const urls = [f.appUrl, f.repoUrl].filter((u): u is string => !!u);

  return (
    <AbsoluteFill style={{ background: C.canvas, alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -60 }}>
        <div style={{ opacity: fade(Math.max(0, tMark - 8), 12) }}>
          <Wordmark size={112} reveal={mark} />
        </div>
        <div
          style={{
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: 64,
            color: C.ink,
            marginTop: 58,
            opacity: fade(tLine),
            translate: `0px ${(1 - fade(tLine)) * 14}px`,
          }}
        >
          Paani, chhaon, aaraam — jahan kaam hai, wahan.
        </div>
        <div style={{ fontSize: 34, color: C.muted, marginTop: 14, opacity: fade(tEn) }}>Water, shade, rest — wherever the work is.</div>
        <div style={{ marginTop: 54, display: "flex", gap: 34, fontFamily: F.mono, fontSize: 26, color: C.water, opacity: fade(tUrl) }}>
          {urls.length > 0 ? (
            urls.map((u) => <span key={u}>{u.replace(/^https?:\/\//, "")}</span>)
          ) : mode === "draft" ? (
            <span style={{ color: C.heat }}>app URL · repo URL — pending facts.json</span>
          ) : null}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: 1.5,
            color: C.muted,
            textTransform: "uppercase",
            opacity: fade(tUrl + 8),
          }}
        >
          Track 02 · Heat and Water
        </div>
      </div>
    </AbsoluteFill>
  );
};
