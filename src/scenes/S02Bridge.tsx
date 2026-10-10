import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CityMap, HELP_POINTS } from "../components/CityMap";
import { IllustrationLabel } from "../components/Labels";
import { VIDEO } from "../components/layout";
import { PotGlyph, Wordmark } from "../components/Wordmark";
import { SCENES } from "../data/timeline";
import { atLocal } from "../data/voice";
import { C, F, SAFE, clamp, easeInOut, easeOut } from "../theme";
import { mapCamera, riderAt } from "./S01Problem";

// Pin silhouette (100×130 viewBox): head circle centred at (50, 50), tip at (50, 128).
const PIN = "M50 128 C40 106 8 82 8 50 A42 42 0 1 1 92 50 C92 82 60 106 50 128 Z";
const PIN_TIP = { x: 1000, y: 598 }; // map coords: the R1/R2 junction where the rider slows
const SHRINK_FROM = 130;
const SHRINK_TO = 160;

/** Demo-room chrome fades in as the map lands in the frame (global frame). */
export const CHROME_FROM = SCENES.S02.from + SHRINK_FROM;
export const chromeOpacity = (g: number) => interpolate(g, [SCENES.S02.from + SHRINK_FROM + 12, SCENES.S02.from + SHRINK_TO], [0, 1], clamp);
export const railReveal = (g: number) => interpolate(g, [SCENES.S02.from + SHRINK_FROM + 14, SCENES.S02.from + SHRINK_TO + 18], [0, 1], clamp);

/** Map-space → screen transform for the shrink into the demo-room frame (S02 tail). */
export const shrinkInto = (p: number) => ({
  s: interpolate(p, [0, 1], [1, VIDEO.w / 1920]),
  x: interpolate(p, [0, 1], [0, VIDEO.x]),
  y: interpolate(p, [0, 1], [0, VIDEO.y]),
});

/** S02 — Pyau bridge (6 s): clay pot → map pin → dots confirmed → wordmark → map shrinks into the demo room. */
export const S02Bridge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tIndia = atLocal("S02", "India", 1, -0.2, 0.6);
  const tAnswer = atLocal("S02", "answer", 1, -0.1, 1.5);
  const tThe = atLocal("S02", "the", 1, -0.25, 2.3);
  const tPyau = atLocal("S02", "Pyau", 1, 0, 2.4);
  const tFree = atLocal("S02", "Free", 1, -0.1, 3.1);

  const fade = (at: number, dur = 14) => interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

  // Pot → pin
  const potIn = fade(0, 16);
  const pinForm = fade(tThe, 16);
  const textOut = 1 - fade(tThe, 10);
  // Drop onto the map
  const drop = spring({ frame: frame - (tPyau + 2), fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const mapIn = fade(tPyau - 2, 18);
  const confirm = fade(tFree - 4, 22);
  const markIn = interpolate(frame, [tFree, tFree + 26], [0, 1], { ...clamp, easing: easeOut });
  // Shrink into the frame
  const shrink = interpolate(frame, [SHRINK_FROM, SHRINK_TO], [0, 1], { ...clamp, easing: easeInOut });

  // Pin geometry in screen space before the map shrinks: big at centre → small at the junction.
  const bigH = 340;
  const smallH = 120;
  const cam = mapCamera(SCENES.S01.frames);
  const zoom = interpolate(mapIn, [0, 1], [1.12, 1]) * interpolate(confirm, [0, 1], [cam.scale, 1]);
  const pinH = interpolate(drop, [0, 1], [bigH, smallH]);
  const tipStart = { x: 960, y: 430 + bigH * (78 / 130) };
  const tipX = interpolate(drop, [0, 1], [tipStart.x, PIN_TIP.x]);
  const tipY = interpolate(drop, [0, 1], [tipStart.y, PIN_TIP.y]);
  const pinW = pinH * (100 / 130);

  const dots = Object.fromEntries(HELP_POINTS.map((p) => [p.id, interpolate(mapIn, [0, 1], [0, 0.75]) + 0.25 * confirm]));
  const sh = shrinkInto(shrink);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Frame chrome + rail are drawn by the DemoRoom layer in PyauDemo (see chromeOpacity / railReveal) */}

      {/* Map world: scales into the demo-room video rect at the end */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          translate: `${sh.x}px ${sh.y}px`,
          scale: String(sh.s),
          overflow: "hidden",
          borderRadius: interpolate(shrink, [0, 1], [0, 26]),
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          opacity: mapIn,
        }}
      >
        <AbsoluteFill style={{ scale: String(zoom), transformOrigin: "52% 58%" }}>
          <CityMap riderT={riderAt(SCENES.S01.frames)} dotOpacity={dots} confirm={confirm} heat={interpolate(confirm, [0, 1], [0.8, 0.25])} />
          {/* The landed pin lives in map space so it shrinks with the map */}
          {drop > 0.98 ? <PinMark x={PIN_TIP.x} y={PIN_TIP.y} h={smallH} /> : null}
        </AbsoluteFill>
      </div>

      {/* Pot, then pin in screen space while it is large and dropping */}
      {drop <= 0.98 ? (
        <div
          style={{
            position: "absolute",
            left: tipX - pinW / 2,
            top: tipY - pinH * (128 / 130),
            width: pinW,
            height: pinH,
            opacity: potIn,
            scale: String(interpolate(potIn, [0, 1], [0.94, 1])),
          }}
        >
          <svg width={pinW} height={pinH} viewBox="0 0 100 130" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <path
              d={PIN}
              fill="#FFFFFF"
              stroke={C.clay}
              strokeWidth={4}
              opacity={pinForm}
              style={{ filter: "drop-shadow(0 6px 10px rgba(29,42,51,0.18))" }}
            />
          </svg>
          {/* Pot: full size before the pin forms, then fits the pin head */}
          <div
            style={{
              position: "absolute",
              left: pinW / 2,
              top: pinH * (50 / 130),
              translate: "-50% -50%",
              scale: String(interpolate(pinForm, [0, 1], [1.45, 0.78])),
            }}
          >
            <PotGlyph size={pinW * 0.62} ladle={pinForm < 0.5} />
          </div>
        </div>
      ) : null}

      {/* "India always had pyaus." + प्याऊ */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 720,
          textAlign: "center",
          opacity: textOut,
        }}
      >
        <div
          style={{
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: 76,
            color: C.ink,
            opacity: fade(tIndia),
            translate: `0px ${(1 - fade(tIndia)) * 14}px`,
          }}
        >
          India always had pyaus.
        </div>
        <div style={{ fontFamily: F.deva, fontWeight: 600, fontSize: 52, color: C.clay, marginTop: 14, opacity: fade(tAnswer) }}>
          प्याऊ
        </div>
      </div>

      {/* Wordmark: writes on large, then settles into the header */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: interpolate(shrink, [0, 1], [96, 46]),
          transformOrigin: "0 0",
          scale: String(interpolate(shrink, [0, 1], [96 / 36, 1])),
          opacity: markIn > 0 ? 1 : 0,
        }}
      >
        <WordmarkSwap reveal={markIn} shrink={shrink} />
      </div>

      <IllustrationLabel style={{ right: SAFE, top: 52 }} appearAt={tPyau} dark={false} />
    </AbsoluteFill>
  );
};

/** The written-on wordmark carries the Devanagari line while large; the header version drops it. */
const WordmarkSwap: React.FC<{ reveal: number; shrink: number }> = ({ reveal, shrink }) =>
  shrink < 0.5 ? (
    <div style={{ opacity: 1 - shrink * 2 }}>
      <Wordmark size={36} reveal={reveal} />
    </div>
  ) : (
    <HeaderMarkInline opacity={(shrink - 0.5) * 2} />
  );

const HeaderMarkInline: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ opacity }}>
    <Wordmark size={36} hindi={false} />
  </div>
);

/** Landed pin with the pot inside (map space). */
const PinMark: React.FC<{ x: number; y: number; h: number }> = ({ x, y, h }) => {
  const w = h * (100 / 130);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h * (128 / 130), width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 100 130" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={PIN} fill="#FFFFFF" stroke={C.clay} strokeWidth={4} style={{ filter: "drop-shadow(0 6px 10px rgba(29,42,51,0.18))" }} />
      </svg>
      <div style={{ position: "absolute", left: w / 2, top: h * (50 / 130), translate: "-50% -50%", scale: "0.78" }}>
        <PotGlyph size={w * 0.62} />
      </div>
    </div>
  );
};

