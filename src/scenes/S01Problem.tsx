import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CityMap } from "../components/CityMap";
import { IllustrationLabel } from "../components/Labels";
import { SCENES } from "../data/timeline";
import { atLocal } from "../data/voice";
import { C, F, SAFE, clamp, easeInOut, easeOut } from "../theme";

const S01_FRAMES = SCENES.S01.frames;

/** Rider progress along the route for a scene-local frame of S01 (shared with S02 so the map continues). */
export const riderAt = (frame: number) =>
  interpolate(frame, [0, S01_FRAMES], [0.08, 0.455], { ...clamp, easing: Easing.bezier(0.25, 0.6, 0.45, 1) });

/** Camera on the map: slow push toward the junction where the help sits. */
export const mapCamera = (frame: number) => {
  const p = interpolate(frame, [0, S01_FRAMES], [0, 1], { ...clamp, easing: easeInOut });
  return { scale: 1 + 0.07 * p, x: -40 * p, y: -20 * p };
};

/** S01 — Problem (18 s). 2:10 PM, feels like 45 °C, two sourced facts, help that riders can't see. */
export const S01Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const tTwo = atLocal("S01", "Two", 1, 0, 1.3);
  const tFeels = atLocal("S01", "feels", 1, 0, 3.2);
  const tDegrees = atLocal("S01", "degrees", 1, 0, 4.5);
  const tIndia = atLocal("S01", "India", 1, -0.15, 5.5);
  const tSurvey = atLocal("S01", "survey", 1, -0.1, 8.4);
  const tHelp = atLocal("S01", "help", 1, -0.1, 11.4);
  const tShop = atLocal("S01", "shop", 1, -0.15, 12.7);
  const tTemple = atLocal("S01", "temple", 1, -0.15, 13.3);
  const tAtm = atLocal("S01", "ATM", 1, -0.25, 14.5);
  const tRiders = atLocal("S01", "Riders", 1, -0.1, 15.8);

  const fade = (at: number, dur = 16) => interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  const dotOpacity = {
    shop: 0.75 * fade(tShop, 14),
    temple: 0.75 * fade(tTemple, 14),
    chemist: 0.75 * fade(tTemple + 10, 14),
    atm: 0.75 * fade(tAtm, 14),
  };

  const cam = mapCamera(frame);
  const glare = interpolate(frame, [0, 26], [0.9, 0], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ background: C.sandBleached, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(cam.scale), translate: `${cam.x}px ${cam.y}px`, transformOrigin: "52% 58%" }}>
        <CityMap riderT={riderAt(frame)} dotOpacity={dotOpacity} pulseAt={tRiders + 6} />
      </AbsoluteFill>

      <HeatReadout frame={frame} tTwo={tTwo} tFeels={tFeels} tDegrees={tDegrees} />

      {/* Two sourced facts, each ≤ 4 s on screen */}
      <FactCard
        inAt={tIndia}
        outAt={Math.min(tIndia + 110, tSurvey - 4)}
        lines={["7.7 million gig workers in 2020–21.", "23.5 million expected by 2029–30."]}
        source="NITI Aayog figures, as reported by Mongabay India · 5 Aug 2025"
      />
      <FactCard
        inAt={tSurvey}
        outAt={Math.min(tSurvey + 112, tHelp - 6)}
        lines={["Over half reported heat-exhaustion symptoms.", "Over 40% lacked cold, clean drinking water."]}
        source="IFAT survey 2024, as reported by Mongabay India · 5 Aug 2025"
      />

      {/* The turn */}
      <div style={{ position: "absolute", left: SAFE, top: 132, width: 820, fontFamily: F.serif, color: C.ink }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.06,
            opacity: fade(tHelp),
            translate: `0px ${interpolate(fade(tHelp), [0, 1], [18, 0])}px`,
          }}
        >
          The help exists.
        </div>
        <div
          style={{
            fontSize: 76,
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.06,
            marginTop: 10,
            color: C.clay,
            opacity: fade(tRiders),
            translate: `0px ${interpolate(fade(tRiders), [0, 1], [18, 0])}px`,
          }}
        >
          Riders just can’t see it.
        </div>
      </div>

      <IllustrationLabel style={{ left: SAFE, bottom: 40 }} appearAt={10} />
      <AbsoluteFill style={{ background: "#FFFDF6", opacity: glare, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const HeatReadout: React.FC<{ frame: number; tTwo: number; tFeels: number; tDegrees: number }> = ({
  frame,
  tTwo,
  tFeels,
  tDegrees,
}) => {
  const o = interpolate(frame, [tTwo - 14, tTwo + 4], [0, 1], { ...clamp, easing: easeOut });
  // Clock counts up 2:04 → 2:10 PM; feels-like counts 39 → 45 °C as it is spoken.
  const minute = Math.round(interpolate(frame, [tTwo - 14, tTwo + 40], [4, 10], { ...clamp, easing: easeOut }));
  const temp = Math.round(interpolate(frame, [tFeels, tDegrees + 4], [39, 45], { ...clamp, easing: easeOut }));
  const tempO = interpolate(frame, [tFeels - 8, tFeels + 6], [0, 1], clamp);
  const hot = interpolate(frame, [tDegrees, tDegrees + 12], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: SAFE,
        top: 52,
        textAlign: "right",
        fontFamily: F.mono,
        color: C.ink,
        opacity: o,
      }}
    >
      <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 600, letterSpacing: 3, color: C.muted }}>DELHI</div>
      <div style={{ fontSize: 104, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
        2:{String(minute).padStart(2, "0")}
        <span style={{ fontSize: 52, marginLeft: 12 }}>PM</span>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 44,
          fontWeight: 600,
          color: hot > 0.5 ? C.gap : C.heat,
          opacity: tempO,
        }}
      >
        <span style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 500, color: C.muted, marginRight: 14 }}>Feels like</span>
        {temp}°C
      </div>
    </div>
  );
};

const FactCard: React.FC<{ inAt: number; outAt: number; lines: [string, string]; source: string }> = ({
  inAt,
  outAt,
  lines,
  source,
}) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [inAt, inAt + 14], [0, 1], { ...clamp, easing: easeOut });
  const second = interpolate(frame, [inAt + 16, inAt + 30], [0, 1], { ...clamp, easing: easeOut });
  const out = interpolate(frame, [outAt, outAt + 10], [1, 0], clamp);
  if (i * out <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE,
        top: 132,
        width: 1000,
        padding: "34px 40px 30px",
        background: "rgba(255,255,255,0.94)",
        borderRadius: 14,
        boxShadow: "0 2px 0 rgba(29,42,51,0.05), 0 18px 50px rgba(29,42,51,0.12)",
        opacity: i * out,
        translate: `0px ${interpolate(i, [0, 1], [20, 0])}px`,
      }}
    >
      <div style={{ fontFamily: F.serif, fontSize: 52, fontWeight: 600, color: C.ink, lineHeight: 1.12, whiteSpace: "nowrap" }}>{lines[0]}</div>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: 44,
          fontStyle: "italic",
          color: C.clay,
          lineHeight: 1.18,
          marginTop: 12,
          opacity: second,
        }}
      >
        {lines[1]}
      </div>
      <div style={{ height: 1, background: C.border, margin: "24px 0 14px" }} />
      <div style={{ fontFamily: F.mono, fontSize: 19, color: C.muted, letterSpacing: 0.2 }}>{source}</div>
    </div>
  );
};
