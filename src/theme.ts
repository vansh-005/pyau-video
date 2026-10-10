import { Easing } from "remotion";

// Palette mirrors video.md / brief/frontend.md tokens (match the app).
export const C = {
  canvas: "#F6F1E7", // warm sand
  panel: "#FFFFFF",
  ink: "#1D2A33",
  muted: "#5B6770",
  border: "#DED6C8",
  water: "#16708F",
  clay: "#B5562E",
  heat: "#C9771C",
  gap: "#B3261E",
  ok: "#2E7D4F",
  standby: "#7A6FB0",
  night: "#14222B",
  // Derived tints
  sandDeep: "#EBE2D0",
  sandBleached: "#F3E9D6",
  road: "#E2D5BD",
  roadEdge: "#D3C3A6",
  block: "#EDE3D1",
  waterSoft: "rgba(22, 112, 143, 0.14)",
  heatSoft: "rgba(201, 119, 28, 0.18)",
  gapSoft: "rgba(179, 38, 30, 0.14)",
  clayLight: "#D98A5F",
  clayDark: "#8E3F1F",
} as const;

export const F = {
  sans: "Inter, 'Noto Sans Devanagari', system-ui, sans-serif",
  serif: "'Source Serif 4', 'Noto Sans Devanagari', Georgia, serif",
  mono: "'JetBrains Mono', Consolas, monospace",
  deva: "'Noto Sans Devanagari', Inter, sans-serif",
} as const;

// Responsive but restrained.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const SAFE = 64;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
