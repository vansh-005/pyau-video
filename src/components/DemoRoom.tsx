import React from "react";
import { interpolate } from "remotion";
import { SCENES } from "../data/timeline";
import { C, F, clamp, easeOut } from "../theme";
import { FRAME, FRAME_BAR, RAIL } from "./layout";
import { Wordmark } from "./Wordmark";

// The persistent demo-room frame (S03–S07): a rounded frame with a thin bar, the story rail on the left,
// and the small Pyau wordmark in the header. S02 draws it in; S08 shrinks it into the "Web app" node.

export const STEPS = [
  { id: "S03", label: "Ask", sub: "Rider" },
  { id: "S04", label: "Host", sub: "Joins" },
  { id: "S05", label: "Plan", sub: "Agent" },
  { id: "S06", label: "Follow through", sub: "Outreach" },
  { id: "S07", label: "Trust", sub: "Reports" },
] as const;

/** Step progress for a global frame: index of the active step plus 0..1 ease into it. */
export const railState = (g: number) => {
  let active = -1;
  let into = 1;
  STEPS.forEach((s, i) => {
    const from = SCENES[s.id].from;
    if (g >= from - 10) {
      active = i;
      into = interpolate(g, [from - 10, from + 8], [0, 1], { ...clamp, easing: easeOut });
    }
  });
  return { active, into };
};

/** Frame background + shadow. Sits under the footage. */
export const FrameBack: React.FC<{ readonly opacity?: number }> = ({ opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: FRAME.x,
      top: FRAME.y,
      width: FRAME.w,
      height: FRAME.h,
      borderRadius: 16,
      background: C.night,
      boxShadow: "0 2px 0 rgba(29,42,51,0.06), 0 26px 70px rgba(29,42,51,0.18)",
      opacity,
    }}
  />
);

/** Frame bar + hairline border. Sits over the footage. */
export const FrameFront: React.FC<{ readonly opacity?: number; readonly label?: string }> = ({ opacity = 1, label = "pyau · demo room" }) => (
  <div
    style={{
      position: "absolute",
      left: FRAME.x,
      top: FRAME.y,
      width: FRAME.w,
      height: FRAME.h,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: `inset 0 0 0 1.5px rgba(29,42,51,0.22)`,
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        height: FRAME_BAR,
        background: "#FBF8F2",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 18,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: "#E2D9C8" }} />
      ))}
      <span style={{ marginLeft: 12, fontFamily: F.mono, fontSize: 16, color: C.muted, letterSpacing: 0.3 }}>{label}</span>
    </div>
  </div>
);

/** Story rail: Ask → Host → Plan → Follow through → Trust. `reveal` 0..1 slides it in. */
export const StoryRail: React.FC<{ readonly g: number; readonly reveal?: number }> = ({ g, reveal = 1 }) => {
  const { active, into } = railState(g);
  const ROW = 116;
  return (
    <div style={{ position: "absolute", left: RAIL.x, top: RAIL.y + 28, width: RAIL.w, fontFamily: F.sans }}>
      {/* spine */}
      <div
        style={{
          position: "absolute",
          left: 13,
          top: 14,
          width: 2,
          height: (STEPS.length - 1) * ROW * reveal,
          background: C.border,
        }}
      />
      {active >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: 13,
            top: 14,
            width: 2,
            height: Math.max(0, (active - 1 + into) * ROW),
            background: C.water,
          }}
        />
      ) : null}
      {STEPS.map((s, i) => {
        const appear = interpolate(reveal, [i * 0.12, i * 0.12 + 0.5], [0, 1], { ...clamp, easing: easeOut });
        const isActive = i === active;
        const done = i < active;
        const a = isActive ? into : 0;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: 0,
              top: i * ROW,
              display: "flex",
              gap: 16,
              opacity: appear,
              translate: `${(1 - appear) * -16}px 0px`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                flex: "none",
                borderRadius: 14,
                boxSizing: "border-box",
                border: `2px solid ${isActive ? C.clay : done ? C.water : "#C9BFAE"}`,
                background: done ? C.water : isActive ? `rgba(181,86,46,${a})` : C.canvas,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(1 + 0.12 * a),
              }}
            >
              {done ? (
                <svg width={14} height={14} viewBox="0 0 14 14">
                  <path d="M2.5 7.5 L5.8 10.5 L11.5 3.8" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
            <div style={{ marginTop: -2 }}>
              <div
                style={{
                  fontSize: 25,
                  lineHeight: 1.1,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? C.ink : done ? C.muted : "#9AA3A8",
                  width: RAIL.w - 44,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 15,
                  marginTop: 4,
                  color: isActive ? C.clay : "#A7AEB2",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                {s.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Small header wordmark that persists across the demo-room scenes. */
export const HeaderMark: React.FC<{ readonly opacity?: number }> = ({ opacity = 1 }) => (
  <div style={{ position: "absolute", left: RAIL.x, top: 46, opacity }}>
    <Wordmark size={36} hindi={false} />
  </div>
);
