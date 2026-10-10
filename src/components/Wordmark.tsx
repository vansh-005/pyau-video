import React from "react";
import { C, F } from "../theme";

// Clay pot (matka) glyph drawn in code. 100×100 viewBox, pot base sits at y≈92.
export const POT_BODY =
  "M39 31 C39 35 36 37 30 40 C13 48 13 80 29 88 C39 94 61 94 71 88 C87 80 87 48 70 40 C64 37 61 35 61 31 Z";
export const POT_BAND = "M20 58 C34 64 66 64 80 58";

export type PotState = "confirmed" | "unconfirmed" | "standby" | "faint";

/** Pot icon. filled = confirmed today, outline = not confirmed, dashed = standby (matches the app's legend). */
export const PotGlyph: React.FC<{
  readonly size?: number;
  readonly state?: PotState;
  readonly color?: string;
  readonly ladle?: boolean;
  readonly style?: React.CSSProperties;
}> = ({ size = 48, state = "confirmed", color = C.clay, ladle = false, style }) => {
  const filled = state === "confirmed";
  const dashed = state === "standby";
  const stroke = state === "faint" ? "rgba(29,42,51,0.35)" : color;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
      {ladle ? (
        <g stroke={C.clayDark} strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M57 30 L80 6" />
          <path d="M76 4 C80 -2 90 2 86 8 C84 12 78 11 76 4 Z" fill={C.clayDark} />
        </g>
      ) : null}
      <path
        d={POT_BODY}
        fill={filled ? color : state === "faint" ? "rgba(255,255,255,0.55)" : "#FFFFFF"}
        stroke={stroke}
        strokeWidth={filled ? 0 : 6}
        strokeDasharray={dashed ? "9 7" : undefined}
        strokeLinejoin="round"
      />
      <rect x={33} y={23} width={34} height={9} rx={4.5} fill={filled ? C.clayDark : stroke} />
      {filled ? <path d={POT_BAND} stroke={C.clayLight} strokeWidth={4} fill="none" strokeLinecap="round" /> : null}
      {filled ? <path d="M30 72 C33 80 40 85 46 86" stroke="rgba(255,255,255,0.28)" strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
    </svg>
  );
};

/** "Pyau" wordmark with the pot glyph and a small Devanagari "प्याऊ". `reveal` 0..1 writes the letters on. */
export const Wordmark: React.FC<{ readonly size?: number; readonly reveal?: number; readonly hindi?: boolean; readonly dark?: boolean }> = ({
  size = 64,
  reveal = 1,
  hindi = true,
  dark = false,
}) => {
  const word = "Pyau";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <PotGlyph size={size * 1.05} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: F.serif,
            fontWeight: 600,
            fontSize: size,
            color: dark ? C.canvas : C.ink,
            letterSpacing: -0.01 * size,
            display: "flex",
          }}
        >
          {word.split("").map((ch, i) => {
            const p = Math.min(1, Math.max(0, reveal * word.length - i));
            return (
              <span key={i} style={{ opacity: p, translate: `0px ${(1 - p) * size * 0.12}px` }}>
                {ch}
              </span>
            );
          })}
        </span>
        {hindi ? (
          <span
            style={{
              fontFamily: F.deva,
              fontWeight: 600,
              fontSize: size * 0.34,
              color: C.clay,
              marginTop: size * 0.08,
              opacity: Math.min(1, Math.max(0, reveal * 1.4 - 0.4)),
            }}
          >
            प्याऊ
          </span>
        ) : null}
      </div>
    </div>
  );
};
