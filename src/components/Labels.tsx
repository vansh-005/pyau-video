import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { factsVerified } from "../data/manifest";
import { useMode } from "../data/mode";
import { C, F, SAFE, clamp, easeOut } from "../theme";

export type Tone = "ink" | "muted" | "water" | "clay" | "heat" | "gap" | "ok";
export const toneColor: Record<Tone, string> = {
  ink: C.ink,
  muted: C.muted,
  water: C.water,
  clay: C.clay,
  heat: C.heat,
  gap: C.gap,
  ok: C.ok,
};

export const useFadeIn = (at: number, dur = 14) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
};

/** Pill used for honesty labels: illustration, draft, time shortened, unverified. */
export const Tag: React.FC<{
  readonly children: React.ReactNode;
  readonly tone?: Tone;
  readonly style?: React.CSSProperties;
  readonly appearAt?: number;
  readonly size?: number;
}> = ({ children, tone = "ink", style, appearAt = 0, size = 20 }) => {
  const o = useFadeIn(appearAt);
  const fg = toneColor[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "6px 14px",
        borderRadius: 999,
        border: `1.5px solid ${fg}`,
        background: "rgba(255,255,255,0.9)",
        color: fg,
        fontFamily: F.sans,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
        opacity: o,
        ...style,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 4, background: fg }} />
      {children}
    </div>
  );
};

/** Small mono marker for motion graphics a viewer could mistake for product footage. */
export const IllustrationLabel: React.FC<{
  readonly appearAt?: number;
  readonly style?: React.CSSProperties;
  readonly dark?: boolean;
  readonly text?: string;
}> = ({ appearAt = 0, style, dark = false, text = "Illustration" }) => {
  const o = useFadeIn(appearAt, 12);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: F.mono,
        fontSize: 18,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: dark ? "rgba(246,241,231,0.62)" : "rgba(29,42,51,0.55)",
        opacity: o,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/**
 * Draft overlay numbers are fixture expectations. Shows "Expected · unverified" until facts.json verifies them.
 * In final mode an unverified number is a hard error (overlays read only from facts.json).
 */
export const UnverifiedMark: React.FC<{ readonly style?: React.CSSProperties; readonly dark?: boolean }> = ({
  style,
  dark = false,
}) => {
  const mode = useMode();
  if (factsVerified()) return null;
  if (mode === "final") throw new Error("Final render blocked: on-screen numbers are not verified (evidence/facts.json)");
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: dark ? "#F0B56B" : C.heat,
        ...style,
      }}
    >
      Expected · unverified
    </span>
  );
};

/** Top-left chapter marker: "03 — Follow through". */
export const Chapter: React.FC<{ readonly index: string; readonly title: string; readonly appearAt?: number }> = ({
  index,
  title,
  appearAt = 0,
}) => {
  const o = useFadeIn(appearAt, 16);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE,
        top: 44,
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        fontFamily: F.sans,
        opacity: o,
        translate: `${interpolate(o, [0, 1], [-12, 0])}px 0px`,
      }}
    >
      <span style={{ fontFamily: F.mono, fontSize: 22, color: C.clay, fontWeight: 600 }}>{index}</span>
      <span style={{ fontSize: 28, fontWeight: 600, color: C.ink }}>{title}</span>
    </div>
  );
};

/** Callout card for the right-hand column next to footage. */
export const Callout: React.FC<{
  readonly appearAt: number;
  readonly kicker?: string;
  readonly children: React.ReactNode;
  readonly tone?: Tone;
  readonly style?: React.CSSProperties;
  readonly dimAt?: number;
  readonly outAt?: number;
  readonly size?: number;
}> = ({ appearAt, kicker, children, tone = "ink", style, dimAt, outAt, size = 30 }) => {
  const frame = useCurrentFrame();
  const o = useFadeIn(appearAt, 12);
  const dim = dimAt === undefined ? 1 : interpolate(frame, [dimAt, dimAt + 12], [1, 0.4], clamp);
  const out = outAt === undefined ? 1 : interpolate(frame, [outAt, outAt + 10], [1, 0], clamp);
  const bar = toneColor[tone];
  return (
    <div
      style={{
        position: "relative",
        background: C.panel,
        borderRadius: 12,
        padding: "18px 22px 20px 28px",
        boxShadow: "0 2px 0 rgba(29,42,51,0.05), 0 10px 30px rgba(29,42,51,0.08)",
        border: `1px solid ${C.border}`,
        opacity: o * dim * out,
        translate: `0px ${interpolate(o, [0, 1], [14, 0])}px`,
        fontFamily: F.sans,
        ...style,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 5, borderRadius: 3, background: bar }} />
      {kicker ? (
        <div style={{ fontSize: 17, fontWeight: 600, color: bar, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 6 }}>
          {kicker}
        </div>
      ) : null}
      <div style={{ fontSize: size, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>{children}</div>
    </div>
  );
};
