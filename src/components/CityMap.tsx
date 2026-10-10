import React, { useMemo } from "react";
import {
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, F, clamp, easeOut } from "../theme";
import { PotGlyph } from "./Wordmark";

// Stylised, sun-bleached street map (1920×1080 user space). Not a real map; labelled "Illustration" where used.

// Arterials
const R1 =
  "M -80 720 C 260 690 520 740 760 668 S 1180 560 1460 590 S 1800 640 2000 610";
const R2 = "M 1010 -60 C 990 220 1050 420 1000 640 S 960 960 1030 1140";
const R3 = "M 300 -60 C 380 260 330 520 420 760 S 520 1000 470 1140";
const R4 = "M 1420 -60 C 1380 300 1520 520 1500 760 S 1560 980 1600 1140";
// Rider route: along R1 from the west, slowing near the junction with R2.
export const RIDER_PATH = R1;

// Deterministic PRNG so every render draws the same city.
const rand = (() => {
  let s = 17;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
})();

type Block = { d: string; fill: string; buildings: string[] };

/**
 * City blocks between a skewed lane grid: lanes are the gaps, blocks carry faint building footprints.
 * Spacing varies per row/column so it never reads as graph paper.
 */
const BLOCKS: Block[] = (() => {
  const xs: number[] = [];
  for (let x = -320; x < 2200; x += 120 + Math.round(rand() * 90)) xs.push(x);
  const ys: number[] = [];
  for (let y = -120; y < 1350; y += 96 + Math.round(rand() * 70)) ys.push(y);
  // Column lines: (x + 150 s, -100 + 1280 s). Row lines: (-100 + 2200 u, y - 170 u).
  const cross = (x: number, y: number) => {
    // x + 150 s = -100 + 2200 u ; -100 + 1280 s = y - 170 u
    const a = 150,
      b = -2200,
      c = -100 - x;
    const d = 1280,
      e = 170,
      f = y + 100;
    const det = a * e - b * d;
    const s = (c * e - b * f) / det;
    return { x: x + 150 * s, y: -100 + 1280 * s };
  };
  const tones = ["#ECE2CF", "#E9DEC8", "#EEE6D6", "#E6DAC2"];
  const out: Block[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const p = [
        cross(xs[i], ys[j]),
        cross(xs[i + 1], ys[j]),
        cross(xs[i + 1], ys[j + 1]),
        cross(xs[i], ys[j + 1]),
      ];
      const cx = (p[0].x + p[1].x + p[2].x + p[3].x) / 4;
      const cy = (p[0].y + p[1].y + p[2].y + p[3].y) / 4;
      const inset = (q: { x: number; y: number }, k: number) => ({
        x: cx + (q.x - cx) * k,
        y: cy + (q.y - cy) * k,
      });
      const q = p.map((pt) => inset(pt, 0.86));
      const poly = (pts: { x: number; y: number }[]) =>
        `M ${pts.map((pt) => `${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" L ")} Z`;
      const buildings: string[] = [];
      const n = Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) {
        const u0 = 0.12 + rand() * 0.5,
          v0 = 0.12 + rand() * 0.5;
        const u1 = Math.min(0.9, u0 + 0.18 + rand() * 0.25),
          v1 = Math.min(0.9, v0 + 0.18 + rand() * 0.25);
        const at = (u: number, v: number) => ({
          x: q[0].x + (q[1].x - q[0].x) * u + (q[3].x - q[0].x) * v,
          y: q[0].y + (q[1].y - q[0].y) * u + (q[3].y - q[0].y) * v,
        });
        buildings.push(poly([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]));
      }
      out.push({
        d: poly(q),
        fill: tones[Math.floor(rand() * tones.length)],
        buildings,
      });
    }
  }
  return out;
})();

export type HelpPoint = {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly icon: "shop" | "temple" | "chemist" | "atm";
};

// Placed around where the rider slows down (≈ R1/R2 junction).
export const HELP_POINTS: readonly HelpPoint[] = [
  { id: "shop", label: "Shop", x: 842, y: 512, icon: "shop" },
  { id: "temple", label: "Temple", x: 1188, y: 770, icon: "temple" },
  { id: "chemist", label: "Chemist", x: 1176, y: 452, icon: "chemist" },
  { id: "atm", label: "Water ATM", x: 852, y: 846, icon: "atm" },
];

const HelpIcon: React.FC<{ icon: HelpPoint["icon"]; color: string }> = ({
  icon,
  color,
}) => {
  const s = {
    stroke: color,
    strokeWidth: 3,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (icon) {
    case "shop":
      return (
        <g {...s}>
          <path d="M-11 -4 L-9 -11 L9 -11 L11 -4 Z" />
          <path d="M-9 -4 L-9 10 L9 10 L9 -4" />
          <path d="M-3 10 L-3 3 L3 3 L3 10" />
        </g>
      );
    case "temple":
      return (
        <g {...s}>
          <path d="M0 -13 L7 -3 L-7 -3 Z" />
          <path d="M-9 -3 L9 -3 L9 10 L-9 10 Z" />
          <path d="M-3 10 L-3 3 L3 3 L3 10" />
        </g>
      );
    case "chemist":
      return (
        <g {...s}>
          <path d="M-3 -11 L3 -11 L3 -3 L11 -3 L11 3 L3 3 L3 11 L-3 11 L-3 3 L-11 3 L-11 -3 L-3 -3 Z" />
        </g>
      );
    case "atm":
      return (
        <g {...s}>
          <path d="M0 -12 C5 -5 8 -1 8 3 C8 8 4 11 0 11 C-4 11 -8 8 -8 3 C-8 -1 -5 -5 0 -12 Z" />
        </g>
      );
  }
};

type Props = {
  /** Rider progress along RIDER_PATH, 0..1 of its length. */
  readonly riderT: number;
  /** Faint help dots: overall opacity per point id (0..1). */
  readonly dotOpacity?: Readonly<Record<string, number>>;
  /** 0..1: faint dots become confirmed pot icons (S02). */
  readonly confirm?: number;
  /** Frame at which the faint dots pulse once (too faint to reach the rider). */
  readonly pulseAt?: number;
  /** Heat shimmer + sun bleach strength 0..1. */
  readonly heat?: number;
  readonly showLabels?: boolean;
  readonly riderOpacity?: number;
};

export const CityMap: React.FC<Props> = ({
  riderT,
  dotOpacity = {},
  confirm = 0,
  pulseAt,
  heat = 1,
  showLabels = true,
  riderOpacity = 1,
}) => {
  const frame = useCurrentFrame();
  const len = useMemo(() => getLength(RIDER_PATH), []);
  const pos = getPointAtLength(RIDER_PATH, riderT * len) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(RIDER_PATH, riderT * len) ?? { x: 1, y: 0 };
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;

  // Trail: five segments of decreasing opacity behind the rider.
  const trailLen = 300;
  const trail = [0, 1, 2, 3, 4].map((i) => {
    const end = riderT * len - i * (trailLen / 5);
    const start = Math.max(0, end - trailLen / 5);
    return { start, seg: Math.max(0, end - start), o: 0.85 * (1 - i / 5) };
  });

  return (
    <>
      <HeatHaze heat={heat} frame={frame} />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="glare" cx="78%" cy="8%" r="75%">
            <stop offset="0%" stopColor="#FFFDF6" stopOpacity={0.9 * heat} />
            <stop offset="45%" stopColor="#FFF6E2" stopOpacity={0.35 * heat} />
            <stop offset="100%" stopColor="#FFF6E2" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="55%" r="75%">
            <stop offset="60%" stopColor={C.heat} stopOpacity={0} />
            <stop offset="100%" stopColor={C.heat} stopOpacity={0.16 * heat} />
          </radialGradient>
        </defs>

        {/* Bleach and warm edge: the heat itself */}
        <rect x={0} y={0} width={1920} height={1080} fill="url(#glare)" />
        <rect x={0} y={0} width={1920} height={1080} fill="url(#vignette)" />

        {/* Trail */}
        {trail.map((t, i) => (
          <path
            key={i}
            d={RIDER_PATH}
            stroke={C.heat}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`0 ${t.start} ${t.seg} ${len}`}
            opacity={t.o * riderOpacity}
          />
        ))}

        {/* Help points */}
        {HELP_POINTS.map((p) => (
          <HelpDot
            key={p.id}
            p={p}
            opacity={dotOpacity[p.id] ?? 0}
            confirm={confirm}
            pulseAt={pulseAt}
            showLabel={showLabels}
          />
        ))}

        {/* Rider: scooter glyph in a dot, with a slow heat halo */}
        <g transform={`translate(${pos.x} ${pos.y})`} opacity={riderOpacity}>
          <circle
            r={26 + 10 * ((frame % 60) / 60)}
            fill="none"
            stroke={C.heat}
            strokeWidth={3}
            opacity={0.5 * (1 - (frame % 60) / 60)}
          />
          <circle r={24} fill={C.ink} stroke="#FFFFFF" strokeWidth={4} />
          <g
            transform={`rotate(${Math.abs(angle) > 90 ? 180 + angle : angle}) scale(${Math.abs(angle) > 90 ? -1 : 1} 1)`}
          >
            <g
              stroke="#FFFFFF"
              strokeWidth={2.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={-8} cy={6} r={4.2} />
              <circle cx={9} cy={6} r={4.2} />
              <path d="M-8 6 L-2 6 L3 -2 L9 6" />
              <path d="M3 -2 L5 -9 L9 -9" />
              <path d="M-6 0 L1 0" />
            </g>
          </g>
        </g>
      </svg>
    </>
  );
};

/** Static streets (no animation). Rendered once to public/map/base.png by `npm run map:base`. */
export const MapBaseSvg: React.FC = () => (
  <svg
    width={1920}
    height={1080}
    viewBox="0 0 1920 1080"
    style={{ position: "absolute", inset: 0 }}
  >
    {/* Lanes are the background; blocks sit on top with faint building footprints */}
    <rect x={-40} y={-40} width={2000} height={1160} fill="#F4ECDD" />
    {BLOCKS.map((b, i) => (
      <React.Fragment key={i}>
        <path d={b.d} fill={b.fill} />
        {b.buildings.map((d, k) => (
          <path key={k} d={d} fill="#DFD1B8" opacity={0.75} />
        ))}
      </React.Fragment>
    ))}
    {/* Dry park and a drain */}
    <path
      d="M1590 760 C1700 720 1850 760 1880 850 C1900 930 1800 980 1690 968 C1600 958 1556 880 1566 820 Z"
      fill="#E1D8B5"
    />
    {[
      [1620, 812],
      [1668, 786],
      [1712, 830],
      [1770, 806],
      [1832, 858],
      [1742, 892],
      [1660, 880],
      [1610, 860],
      [1800, 924],
      [1716, 940],
      [1850, 900],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={8 + (i % 3) * 2} fill="#D6CCA4" />
    ))}
    <path
      d="M -60 1000 C 300 960 520 1030 820 980 S 1300 920 1980 980"
      stroke="#CDD9D1"
      strokeWidth={24}
      fill="none"
      opacity={0.85}
    />
    {/* Arterials: edge then surface then a faint centre line */}
    {[R1, R2, R3, R4].map((d, i) => (
      <React.Fragment key={i}>
        <path
          d={d}
          stroke={C.roadEdge}
          strokeWidth={50}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={d}
          stroke="#EFE5D2"
          strokeWidth={42}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={d}
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeDasharray="18 22"
          fill="none"
          opacity={0.7}
        />
      </React.Fragment>
    ))}
  </svg>
);

// Heat shimmer: the pre-rendered street bitmap in thin horizontal strips, each nudged sideways by two slow
// sine waves. Reads as rising heat haze, stays calm, and costs a fraction of a full-frame SVG displacement filter.
const STRIP = 6;
const HeatHaze: React.FC<{ heat: number; frame: number }> = ({
  heat,
  frame,
}) => {
  const src = staticFile("map/base.png");
  if (heat <= 0.3)
    return (
      <Img
        src={src}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
        }}
      />
    );
  const t = frame / 30;
  const strips = [];
  for (let y = 0; y < 1080; y += STRIP) {
    const dx =
      2.4 *
      heat *
      (0.6 * Math.sin(y * 0.045 - t * 2.1) +
        0.4 * Math.sin(y * 0.012 + t * 0.8));
    strips.push(
      <div
        key={y}
        style={{
          position: "absolute",
          left: -8,
          top: y,
          width: 1936,
          height: STRIP + 1,
          overflow: "hidden",
        }}
      >
        <Img
          src={src}
          style={{
            position: "absolute",
            left: 8 + dx,
            top: -y,
            width: 1920,
            height: 1080,
          }}
        />
      </div>,
    );
  }
  return <>{strips}</>;
};

const HelpDot: React.FC<{
  p: HelpPoint;
  opacity: number;
  confirm: number;
  pulseAt?: number;
  showLabel: boolean;
}> = ({ p, opacity, confirm, pulseAt, showLabel }) => {
  const frame = useCurrentFrame();
  if (opacity <= 0.001) return null;
  // One slow pulse that dies out long before reaching the rider.
  const pulse =
    pulseAt === undefined
      ? 0
      : interpolate(frame, [pulseAt, pulseAt + 36], [0, 1], {
          ...clamp,
          easing: easeOut,
        });
  const pulseVisible = pulse > 0 && pulse < 1;
  const grey = "rgba(29,42,51,0.42)";
  return (
    <g transform={`translate(${p.x} ${p.y})`} opacity={opacity}>
      {pulseVisible ? (
        <circle
          r={30 + 70 * pulse}
          fill="none"
          stroke={grey}
          strokeWidth={2}
          opacity={0.5 * (1 - pulse)}
        />
      ) : null}
      {/* Faint state */}
      <g opacity={1 - confirm}>
        <circle
          r={28}
          fill="rgba(255,255,255,0.55)"
          stroke={grey}
          strokeWidth={2}
          strokeDasharray="4 5"
        />
        <HelpIcon icon={p.icon} color={grey} />
      </g>
      {/* Confirmed: a pot pin with the place icon kept beside it */}
      {confirm > 0 ? (
        <g opacity={confirm} transform={`scale(${0.7 + 0.3 * confirm})`}>
          <circle r={34} fill="#FFFFFF" stroke={C.clay} strokeWidth={3} />
          <g transform="translate(-24 -27)">
            <PotGlyph size={48} />
          </g>
        </g>
      ) : null}
      {showLabel ? (
        <text
          y={confirm > 0.5 ? 64 : 56}
          textAnchor="middle"
          fontFamily={F.sans}
          fontSize={22}
          fontWeight={600}
          fill={confirm > 0.5 ? C.ink : "rgba(29,42,51,0.5)"}
          stroke="#F6F1E7"
          strokeWidth={5}
          paintOrder="stroke"
        >
          {p.label}
        </text>
      ) : null}
    </g>
  );
};
