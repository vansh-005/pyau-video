import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FootageSlot } from "../components/FootageSlot";
import { Callout, Tag, UnverifiedMark, useFadeIn } from "../components/Labels";
import { COLUMN, VIDEO } from "../components/layout";
import { getClip, manifest } from "../data/manifest";
import { useMode } from "../data/mode";
import { SCENES, SLOT_PREROLL, SceneId } from "../data/timeline";
import { appAudioWindow, at } from "../data/voice";
import { C, F, clamp, easeOut } from "../theme";

// S03–S07 run inside the persistent demo-room frame (drawn by the DemoRoom layer in PyauDemo).
// Each scene's Series.Sequence starts SLOT_PREROLL frames early so its footage crossfades over the previous one.

/** Global frame → this scene's local frame (local 0 = scene start − pre-roll). */
const useLocal = (id: SceneId) => {
  const frame = useCurrentFrame();
  return { frame, L: (g: number) => g - (SCENES[id].from - SLOT_PREROLL) };
};

const fx = Object.freeze({ ...clamp, easing: easeOut });

/** Footage inside the frame's video rect with a pre-roll crossfade. */
const AppSlot: React.FC<{ id: SceneId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, SLOT_PREROLL], [0, 1], clamp);
  const w = appAudioWindow(id);
  return (
    <div style={{ position: "absolute", left: VIDEO.x, top: VIDEO.y, width: VIDEO.w, height: VIDEO.h, opacity: o }}>
      <FootageSlot
        shotId={id}
        width={VIDEO.w}
        height={VIDEO.h}
        style={{ borderRadius: "0 0 16px 16px" }}
        audioWindow={w ? { start: w.start + SLOT_PREROLL / 30, end: w.end + SLOT_PREROLL / 30 } : null}
      />
    </div>
  );
};

/** Right-hand column; callouts stack from the top. */
const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: COLUMN.x,
      top: COLUMN.y,
      width: COLUMN.w,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}
  >
    {children}
  </div>
);

const Big: React.FC<{ value: string; color?: string; size?: number }> = ({ value, color = C.ink, size = 84 }) => (
  <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: size, lineHeight: 1, color, letterSpacing: -1 }}>{value}</div>
);

const Small: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 22, fontWeight: 500, color: C.muted, marginTop: 8, lineHeight: 1.3 }}>{children}</div>
);

const pct = (n: number) => `${Math.round(n)}%`;
const hourLabel = (hhmm: string) => {
  const h = parseInt(hhmm.slice(0, 2), 10);
  return `${((h + 11) % 12) + 1}`;
};

/* ------------------------------------------------------------------ S03 Rider */

/**
 * Bilingual subtitle for the app's own Hindi audio. Text must be copied from the real on-screen answer
 * (manifest clip `subtitle`); without it, draft shows a labelled placeholder and final refuses to render.
 */
const AppAudioSubtitle: React.FC<{ id: SceneId }> = ({ id }) => {
  const { frame, L } = useLocal(id);
  const mode = useMode();
  const w = appAudioWindow(id);
  if (!w) return null;
  const s = L(SCENES[id].from + Math.round(w.start * 30));
  const e = L(SCENES[id].from + Math.round(w.end * 30));
  if (frame < s || frame > e) return null;
  const o = interpolate(frame, [s, s + 8, e - 8, e], [0, 1, 1, 0], clamp);
  const clip = getClip(id) as (ReturnType<typeof getClip> & { subtitle?: { hi: string; en: string } }) | undefined;
  const sub = clip?.subtitle;
  if (!sub && mode === "final") throw new Error(`Final render blocked: ${id} subtitle (exact on-screen Hindi answer) missing in asset-manifest.json`);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          maxWidth: 1400,
          padding: "10px 26px 12px",
          borderRadius: 10,
          background: "rgba(29,42,51,0.92)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        {sub ? (
          <>
            <div style={{ fontFamily: F.deva, fontSize: 36, fontWeight: 600, lineHeight: 1.35 }}>{sub.hi}</div>
            <div style={{ fontFamily: F.sans, fontSize: 28, fontWeight: 500, color: "#C9D3D8", marginTop: 2 }}>{sub.en}</div>
          </>
        ) : (
          <div style={{ fontFamily: F.sans, fontSize: 28, color: "#F0B56B", fontWeight: 600 }}>
            DRAFT · Hindi answer subtitle — copy exact words from the real on-screen answer
          </div>
        )}
      </div>
    </div>
  );
};

export const S03Rider: React.FC = () => {
  const { L } = useLocal("S03");
  return (
    <AbsoluteFill>
      <AppSlot id="S03" />
      <Column>
        <Callout appearAt={L(at("S03", "asks", 1, -0.2, 2.3))} kicker="Rider" tone="clay" size={28}>
          Asks by voice, in Hindi
        </Callout>
        <Callout appearAt={L(at("S03", "confirmed", 1, -0.2, 15.6))} kicker="Answer" tone="ok" size={28}>
          Open now · confirmed today
        </Callout>
        <Callout appearAt={L(at("S03", "route", 1, -0.2, 17.4))} kicker="Amazon Location" tone="water" size={26}>
          Scooter route
        </Callout>
      </Column>
      <AppAudioSubtitle id="S03" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S04 Host */

export const S04Host: React.FC = () => {
  const { L } = useLocal("S04");
  return (
    <AbsoluteFill>
      <AppSlot id="S04" />
      <Column>
        <Callout appearAt={L(at("S04", "minute", 1, -0.3, 1.8))} kicker="Host" tone="clay" size={28}>
          Joins in under a minute.
        </Callout>
        <Callout appearAt={L(at("S04", "morning", 1, -0.2, 6.9))} kicker="Every morning" tone="ok" size={28}>
          One tap: still serving?
        </Callout>
      </Column>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S05 Turning point */

const ReceiptList: React.FC<{ appearAt: number; items: { label: string; at: number }[] }> = ({ appearAt, items }) => {
  const frame = useCurrentFrame();
  const o = useFadeIn(appearAt, 12);
  return (
    <div
      style={{
        background: C.panel,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: "16px 20px 14px",
        boxShadow: "0 10px 30px rgba(29,42,51,0.08)",
        opacity: o,
        translate: `0px ${(1 - o) * 14}px`,
        fontFamily: F.sans,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, color: C.water, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
        Agent reads
      </div>
      {items.map((it) => {
        const on = interpolate(frame, [it.at, it.at + 8], [0, 1], fx);
        const active = frame >= it.at && frame < it.at + 30;
        return (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 12, height: 40 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                border: `2px solid ${on > 0.5 ? C.water : "#C9BFAE"}`,
                background: on > 0.5 ? C.water : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 14 14" style={{ opacity: on }}>
                <path d="M2.5 7.5 L5.8 10.5 L11.5 3.8" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 26, fontWeight: active ? 700 : 600, color: on > 0.5 ? C.ink : "#9AA3A8" }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Optional side magnifier on a real UI region (e.g. the Hindi message). Draft: labelled placeholder. */
const Magnifier: React.FC<{ id: SceneId; appearAt: number; outAt: number }> = ({ id, appearAt, outAt }) => {
  const frame = useCurrentFrame();
  const clip = getClip(id) as (ReturnType<typeof getClip> & { magnify?: { x: number; y: number; w: number; h: number } }) | undefined;
  const o = interpolate(frame, [appearAt, appearAt + 12, outAt, outAt + 10], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const W = 640;
  const H = 200;
  const ready = clip?.status === "ready" && clip.magnify;
  return (
    <div
      style={{
        position: "absolute",
        left: VIDEO.x + VIDEO.w - W - 24,
        top: VIDEO.y + VIDEO.h - H - 24,
        width: W,
        height: H,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: `0 0 0 3px ${C.clay}, 0 18px 50px rgba(29,42,51,0.3)`,
        opacity: o,
        scale: String(interpolate(o, [0, 1], [0.96, 1])),
        background: C.night,
      }}
    >
      {ready ? (
        <FootageSlot shotId={id} width={W} height={H} crop={clip.magnify} />
      ) : (
        <div style={{ padding: "22px 26px", color: "#EEF1F2", fontFamily: F.sans }}>
          <div style={{ fontFamily: F.mono, fontSize: 16, color: C.heat, letterSpacing: 1.2 }}>DRAFT · MAGNIFIER PENDING</div>
          <div style={{ fontSize: 26, fontWeight: 600, marginTop: 10 }}>Hindi message from the real plan card</div>
          <div style={{ fontSize: 20, color: "#9FB3BC", marginTop: 6 }}>Set clips[S05].magnify to the message rect (Devanagari ≥ 32 px)</div>
        </div>
      )}
    </div>
  );
};

export const S05Plan: React.FC = () => {
  const { frame, L } = useLocal("S05");
  const f = manifest.facts;
  const tWindow = L(at("S05", "heat", 1, -0.2, 6.5));
  const tPercent = L(at("S05", "percent", 1, -0.5, 9.9));
  const tClick = L(at("S05", "click", 1, -0.3, 14.5));
  const tGap = L(at("S05", "gap", 1, -0.2, 20.8));
  const tHindi = L(at("S05", "Hindi", 1, -1.2, 27.4));
  const tNobody = L(at("S05", "nobody", 1, -0.2, 29.9));
  const tApproves = L(at("S05", "approves", 1, -0.4, 35.9));
  const unresolved = f.unresolved[0];
  // Optional evening wash: the scene is the evening before.
  const dusk = interpolate(frame, [L(at("S05", "evening", 1, -0.4, 4.2)), L(at("S05", "evening", 1, 0.6, 5.2))], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AppSlot id="S05" />
      <div
        style={{
          position: "absolute",
          left: VIDEO.x,
          top: VIDEO.y,
          width: VIDEO.w,
          height: VIDEO.h,
          borderRadius: "0 0 16px 16px",
          background: "linear-gradient(180deg, rgba(201,119,28,0.10), rgba(20,34,43,0.06))",
          opacity: dusk * interpolate(frame, [tClick, tClick + 20], [1, 0], clamp),
          pointerEvents: "none",
        }}
      />
      <Column>
        <Callout appearAt={tWindow} kicker="Tomorrow" tone="heat" outAt={tGap - 10} size={28}>
          {hourLabel(f.heatWindow[0])}–{hourLabel(f.heatWindow[1])} PM heat window
        </Callout>
        <Callout appearAt={tPercent} kicker="Coverage" tone="gap" outAt={tGap - 10} size={28}>
          <Big value={pct(f.coverageBefore.percent)} color={C.gap} />
          <Small>of rider requests near open water</Small>
          <UnverifiedMark />
        </Callout>
        {frame >= tClick - 4 && frame < tNobody - 6 ? (
          <ReceiptList
            appearAt={tClick}
            items={[
              { label: "Forecast", at: L(at("S05", "forecast", 1, -0.1, 17.7)) },
              { label: "Demand", at: L(at("S05", "demand", 1, -0.1, 19.1)) },
              { label: "Coverage", at: L(at("S05", "coverage", 1, -0.1, 19.7)) },
              { label: "Candidates", at: L(at("S05", "hosts", 1, -0.1, 25.0)) },
            ]}
          />
        ) : null}
        <Callout appearAt={tGap} kicker="Gap · cluster B" tone="gap" outAt={tNobody - 10} size={28}>
          <Big value={`${f.clusterB.requests}`} color={C.gap} size={64} />
          <Small>requests, nothing open</Small>
          <UnverifiedMark />
        </Callout>
        <Callout appearAt={tNobody} kicker={unresolved ? `Gap ${unresolved.clusterId} · ${unresolved.requests}` : "Unresolved"} tone="gap" size={28}>
          It says what it can’t fix.
          {unresolved ? <UnverifiedMark style={{ display: "block", marginTop: 6 }} /> : null}
        </Callout>
        <Callout appearAt={tApproves} kicker="Coordinator" tone="ok" size={28}>
          Reviews and approves.
        </Callout>
      </Column>
      <Magnifier id="S05" appearAt={tHindi} outAt={tNobody - 4} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S06 Follow through */

const CoverageRing: React.FC<{ from: number; to: number; at: number; size?: number }> = ({ from, to, at: start, size = 230 }) => {
  const frame = useCurrentFrame();
  const o = useFadeIn(start - 10, 12);
  const p = interpolate(frame, [start, start + 36], [0, 1], fx);
  const value = from + (to - from) * p;
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, opacity: o }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, rotate: "-90deg" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.sandDeep} strokeWidth={18} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C.water}
          strokeWidth={18}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(circ * value) / 100} ${circ}`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Big value={pct(value)} color={p > 0.98 ? C.water : C.ink} size={72} />
        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.muted, marginTop: 4 }}>from {pct(from)}</div>
      </div>
      <div style={{ position: "absolute", top: size + 6, left: 0, right: 0, textAlign: "center" }}>
        <UnverifiedMark />
      </div>
    </div>
  );
};

export const S06FollowThrough: React.FC = () => {
  const { L } = useLocal("S06");
  const f = manifest.facts;
  const tAsks = L(at("S06", "asks", 1, -0.2, 3.5));
  const tNo = L(at("S06", "No", 1, -0.1, 7.1));
  const tYes = L(at("S06", "yes", 1, -0.3, 12.5));
  const tJumps = L(at("S06", "jumps", 1, -0.1, 16.6));
  const unresolved = f.unresolved[0];
  return (
    <AbsoluteFill>
      <AppSlot id="S06" />
      <Column>
        <Callout appearAt={tAsks} kicker="Ask 1 · Kirana store" tone="ink" dimAt={tNo + 6} size={26}>
          Waits {f.askTimeoutSecondsDemo} s for a reply
          <UnverifiedMark style={{ display: "block", marginTop: 6 }} />
        </Callout>
        <Callout appearAt={tNo} kicker="Timed out" tone="gap" dimAt={tYes + 6} size={26}>
          Moves to the next host
        </Callout>
        <Callout appearAt={tYes} kicker="Ask 2 · RWA office" tone="ok" size={26}>
          <span style={{ fontFamily: F.deva }}>हाँ</span> — yes
        </Callout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
          <CoverageRing from={f.coverageBefore.percent} to={f.coverageAfter.percent} at={tJumps} />
        </div>
        {unresolved ? (
          <Tag tone="gap" appearAt={tJumps + 40} size={18} style={{ alignSelf: "center" }}>
            Gap {unresolved.clusterId} still needs a person
          </Tag>
        ) : null}
      </Column>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S07 Trust */

export const S07Trust: React.FC = () => {
  const { L } = useLocal("S07");
  return (
    <AbsoluteFill>
      <AppSlot id="S07" />
      <Column>
        <Callout appearAt={L(at("S07", "report", 1, -0.2, 1.5))} kicker="Riders report" tone="gap" size={26}>
          “No water” × 2
        </Callout>
        <Callout appearAt={L(at("S07", "pauses", 1, -0.2, 4.0))} kicker="Trust" tone="ink" size={28}>
          Bad points pause themselves.
        </Callout>
      </Column>
    </AbsoluteFill>
  );
};
