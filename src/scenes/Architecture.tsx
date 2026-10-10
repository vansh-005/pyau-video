import React from "react";
import { AbsoluteFill, Freeze, interpolate, useCurrentFrame } from "remotion";
import { FootageSlot } from "../components/FootageSlot";
import { FrameBack, FrameFront, HeaderMark, StoryRail } from "../components/DemoRoom";
import { IllustrationLabel, Tag } from "../components/Labels";
import { FRAME, VIDEO } from "../components/layout";
import { manifest, serviceListed } from "../data/manifest";
import { SCENES, SLOT_PREROLL } from "../data/timeline";
import { at } from "../data/voice";
import { C, F, clamp, easeInOut, easeOut } from "../theme";

export type ArchTheme = "sand" | "night";

const TH = {
  sand: { bg: C.canvas, node: "#FFFFFF", border: C.border, text: C.ink, sub: C.muted, edge: "#CFC4B0", label: "rgba(29,42,51,0.55)" },
  night: { bg: C.night, node: "#1C2F3A", border: "#2F4553", text: "#F3EEE4", sub: "#9DB0BA", edge: "#3A5261", label: "rgba(246,241,231,0.6)" },
} as const;

type NodeDef = {
  id: string;
  name: string; // official AWS service name (text only; no icons)
  sub?: string;
  x: number; // centre
  y: number;
  word?: [string, number]; // narration anchor in S08 (word, nth)
  fallback: number; // scene seconds if the word is missing
  service: boolean; // gated by facts.awsServices
};

const NW = 300;
const NH = 92;
const WEB = { x: 230, y: 560, w: 300, h: 177 } as const;

// 4 columns × 3 rows; the illustrative state graph unfolds in the right gutter beside Step Functions.
export const NODES: NodeDef[] = [
  { id: "amplify", name: "AWS Amplify", sub: "Hosting", x: 230, y: 330, word: ["Amplify", 1], fallback: 3.2, service: true },
  { id: "location", name: "Amazon Location", sub: "Maps · scooter routes", x: 230, y: 800, word: ["Location", 1], fallback: 4.7, service: true },
  { id: "apigw", name: "Amazon API Gateway", x: 600, y: 560, word: ["API", 1], fallback: 7.0, service: true },
  { id: "lambda", name: "AWS Lambda", x: 970, y: 560, word: ["Lambda", 1], fallback: 8.1, service: true },
  { id: "strands", name: "Strands agent", sub: "Open-source SDK", x: 970, y: 330, word: ["Strands", 1], fallback: 10.3, service: false },
  { id: "bedrock", name: "Amazon Bedrock", x: 1340, y: 330, word: ["Bedrock", 1], fallback: 11.7, service: true },
  { id: "sfn", name: "AWS Step Functions", sub: "Waits for people", x: 1340, y: 560, word: ["Step", 1], fallback: 13.8, service: true },
  { id: "dynamo", name: "Amazon DynamoDB", sub: "Hosts · runs", x: 970, y: 800, word: ["DynamoDB", 1], fallback: 16.7, service: true },
  { id: "polly", name: "Amazon Polly", sub: "Speaks Hindi", x: 600, y: 270, word: ["Polly", 1], fallback: 19.2, service: true },
  { id: "transcribe", name: "Amazon Transcribe", sub: "Hears Hindi", x: 600, y: 390, word: ["Transcribe", 1], fallback: 19.7, service: true },
  { id: "scheduler", name: "Amazon EventBridge Scheduler", sub: "Every evening", x: 1340, y: 800, word: ["EventBridge", 1], fallback: 21.5, service: true },
  { id: "cognito", name: "Amazon Cognito", sub: "Sign-in", x: 600, y: 800, fallback: 23.4, service: true },
  { id: "cloudwatch", name: "Amazon CloudWatch", sub: "Logs · run ID", x: 1700, y: 800, fallback: 23.8, service: true },
];

const EDGES: [string, string][] = [
  ["amplify", "web"],
  ["location", "web"],
  ["web", "apigw"],
  ["apigw", "lambda"],
  ["lambda", "strands"],
  ["strands", "bedrock"],
  ["lambda", "sfn"],
  ["lambda", "dynamo"],
  ["lambda", "transcribe"],
  ["scheduler", "sfn"],
  ["cognito", "apigw"],
  ["scheduler", "cloudwatch"],
];

const visibleNodes = () => NODES.filter((n) => !n.service || serviceListed(n.name));

const nodeAppear = (n: NodeDef) => (n.word ? at("S08", n.word[0], n.word[1], -0.25, n.fallback) : SCENES.S08.from + Math.round(n.fallback * 30));

const center = (id: string) => {
  if (id === "web") return { x: WEB.x, y: WEB.y };
  const n = NODES.find((m) => m.id === id);
  return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
};

/** Edge anchor on a node's border towards another point (axis-aligned boxes). */
const anchor = (id: string, toward: { x: number; y: number }) => {
  const c = center(id);
  const w = id === "web" ? WEB.w : NW;
  const h = id === "web" ? WEB.h + 40 : NH;
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const sx = dx === 0 ? Infinity : w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
};

// Pulse hops along the request path, each keyed to narration.
type Hop = { from: string; to: string; at: number };
const hops = (): Hop[] => [
  { from: "web", to: "apigw", at: at("S08", "API", 1, 0.2, 7.2) },
  { from: "apigw", to: "lambda", at: at("S08", "Lambda", 1, 0.1, 8.2) },
  { from: "lambda", to: "strands", at: at("S08", "Strands", 1, 0.2, 10.5) },
  { from: "strands", to: "bedrock", at: at("S08", "Bedrock", 1, 0.1, 11.8) },
  { from: "bedrock", to: "strands", at: at("S08", "plans", 1, 0.0, 12.2) },
  { from: "lambda", to: "sfn", at: at("S08", "Step", 1, 0.0, 13.8) },
  { from: "lambda", to: "dynamo", at: at("S08", "DynamoDB", 1, 0.1, 16.8) },
  { from: "lambda", to: "transcribe", at: at("S08", "Transcribe", 1, 0.0, 19.7) },
  { from: "scheduler", to: "sfn", at: at("S08", "EventBridge", 1, 0.4, 21.9) },
];
const HOP = 16;

/** The diagram at global frame g (S09 passes the frozen last S08 frame). */
export const Architecture: React.FC<{ g: number; theme: ArchTheme; graphOpacity?: number }> = ({ g, theme, graphOpacity = 1 }) => {
  const t = TH[theme];
  const titleIn = interpolate(g, [SCENES.S08.from + 18, SCENES.S08.from + 34], [0, 1], { ...clamp, easing: easeOut });
  const nodes = visibleNodes();
  const appear = (id: string) => {
    if (id === "web") return 1;
    const n = nodes.find((m) => m.id === id);
    if (!n) return 0;
    return interpolate(g, [nodeAppear(n), nodeAppear(n) + 12], [0, 1], { ...clamp, easing: easeOut });
  };
  const sfnAt = at("S08", "Step", 1, 0.0, 13.8) + HOP;
  const draft = manifest.facts.awsServices.length === 0;

  return (
    <AbsoluteFill>
      {/* Edges */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {EDGES.map(([a, b]) => {
          const o = Math.min(appear(a), appear(b));
          if (o <= 0) return null;
          const p1 = anchor(a, center(b));
          const p2 = anchor(b, center(a));
          return (
            <line
              key={a + b}
              x1={p1.x}
              y1={p1.y}
              x2={p1.x + (p2.x - p1.x) * o}
              y2={p1.y + (p2.y - p1.y) * o}
              stroke={t.edge}
              strokeWidth={3}
              strokeDasharray={b === "cloudwatch" ? "6 8" : undefined}
            />
          );
        })}
        {/* Travelling water-blue pulse */}
        {hops().map((h, i) => {
          const p = interpolate(g, [h.at, h.at + HOP], [0, 1], { ...clamp, easing: easeInOut });
          if (p <= 0 || p >= 1 || Math.min(appear(h.from), appear(h.to)) < 1) return null;
          const p1 = anchor(h.from, center(h.to));
          const p2 = anchor(h.to, center(h.from));
          const x = p1.x + (p2.x - p1.x) * p;
          const y = p1.y + (p2.y - p1.y) * p;
          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={x} y2={y} stroke={C.water} strokeWidth={4} opacity={0.55} />
              <circle cx={x} cy={y} r={14} fill={C.water} opacity={0.22} />
              <circle cx={x} cy={y} r={7} fill={C.water} />
            </g>
          );
        })}
      </svg>

      {/* Web app node: holds the shrunk demo-room frame */}
      <div style={{ position: "absolute", left: WEB.x - WEB.w / 2, top: WEB.y - WEB.h / 2, width: WEB.w, height: WEB.h }}>
        <div
          style={{
            position: "absolute",
            top: WEB.h + 10,
            width: WEB.w,
            textAlign: "center",
            fontFamily: F.sans,
            fontSize: 24,
            fontWeight: 600,
            color: t.text,
          }}
        >
          Web app
        </div>
      </div>

      {nodes.map((n) => {
        const o = appear(n.id);
        if (o <= 0) return null;
        const isSfn = n.id === "sfn";
        const lit = isSfn ? interpolate(g, [sfnAt - 4, sfnAt + 6], [0, 1], clamp) : 0;
        return (
          <div
            key={n.id}
            style={{
              position: "absolute",
              left: n.x - NW / 2,
              top: n.y - NH / 2,
              width: NW,
              height: NH,
              boxSizing: "border-box",
              borderRadius: 14,
              background: t.node,
              border: `2px solid ${lit > 0 ? C.water : t.border}`,
              boxShadow: lit > 0 ? `0 0 0 ${6 * lit}px rgba(22,112,143,0.18)` : "0 6px 18px rgba(29,42,51,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 18px",
              fontFamily: F.sans,
              opacity: o,
              scale: String(interpolate(o, [0, 1], [0.9, 1])),
            }}
          >
            <div style={{ fontSize: n.name.length > 24 ? 20 : 23, fontWeight: 600, color: t.text, lineHeight: 1.15 }}>{n.name}</div>
            {n.sub ? <div style={{ fontSize: 17, color: t.sub, marginTop: 3 }}>{n.sub}</div> : null}
          </div>
        );
      })}

      {nodes.some((n) => n.id === "sfn") ? <StateGraph g={g} start={sfnAt} theme={theme} opacity={graphOpacity} /> : null}

      <div style={{ position: "absolute", left: 64, top: 44, fontFamily: F.serif, fontSize: 44, fontWeight: 600, color: t.text, opacity: titleIn }}>
        Under the hood
        <span style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 500, color: t.sub, marginLeft: 18 }}>Pyau on AWS</span>
      </div>
      {draft ? (
        <Tag tone="heat" size={16} style={{ position: "absolute", right: 64, top: 52, opacity: titleIn }}>
          Services shown per plan · confirm against facts.json
        </Tag>
      ) : null}
    </AbsoluteFill>
  );
};

/** Illustrative mini state graph that unfolds out of Step Functions. Labelled until S09 shows the real one. */
const STATES = [
  { name: "PlanWithAgent", tone: C.water },
  { name: "AwaitApproval", tone: C.water },
  { name: "AskHost · Kirana store", tone: C.gap, note: "⟲ timeout" },
  { name: "AskHost · RWA office", tone: C.ok, note: "✓ yes" },
  { name: "PublishPoint", tone: C.ok },
];

const StateGraph: React.FC<{ g: number; start: number; theme: ArchTheme; opacity: number }> = ({ g, start, theme, opacity }) => {
  const t = TH[theme];
  const X = 1560;
  const Y = 238;
  const ROW = 62;
  const open = interpolate(g, [start, start + 14], [0, 1], { ...clamp, easing: easeOut });
  if (open <= 0) return null;
  return (
    <div style={{ position: "absolute", left: X, top: Y, width: 290, opacity: opacity * open, fontFamily: F.mono }}>
      <svg width={290} height={STATES.length * ROW} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={10} y1={14} x2={10} y2={14 + (STATES.length - 1) * ROW * open} stroke={t.edge} strokeWidth={2} />
      </svg>
      {STATES.map((s, i) => {
        const o = interpolate(g, [start + 8 + i * 9, start + 18 + i * 9], [0, 1], { ...clamp, easing: easeOut });
        return (
          <div key={s.name} style={{ position: "absolute", left: 0, top: i * ROW, display: "flex", gap: 14, opacity: o }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: s.tone, marginTop: 4, flex: "none" }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: t.text, whiteSpace: "nowrap" }}>{s.name}</div>
              {s.note ? <div style={{ fontSize: 15, color: s.tone, marginTop: 2 }}>{s.note}</div> : null}
            </div>
          </div>
        );
      })}
      <IllustrationLabel style={{ left: 34, top: STATES.length * ROW + 4, fontSize: 15 }} dark={theme === "night"} />
    </div>
  );
};

/** Frozen last frame of the demo room (S07), used as the thing that shrinks into the Web app node. */
const FrozenRoom: React.FC = () => (
  <Freeze frame={SLOT_PREROLL + SCENES.S07.frames - 1}>
    <div style={{ position: "absolute", left: VIDEO.x, top: VIDEO.y, width: VIDEO.w, height: VIDEO.h }}>
      <FootageSlot shotId="S07" width={VIDEO.w} height={VIDEO.h} style={{ borderRadius: "0 0 16px 16px" }} />
    </div>
  </Freeze>
);

/** S08 — the demo-room frame shrinks into the Web app node; nodes arrive as they are named. */
export const S08Architecture: React.FC<{ theme: ArchTheme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const g = SCENES.S08.from + frame;
  const t = TH[theme];
  const shrink = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: easeInOut });
  const bg = interpolate(frame, [4, 26], [0, 1], clamp);
  const chromeOut = 1 - interpolate(frame, [0, 14], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <AbsoluteFill style={{ background: t.bg, opacity: bg }} />
      <Architecture g={g} theme={theme} />
      {/* Rail + header leave as the frame travels */}
      <div style={{ opacity: chromeOut }}>
        <HeaderMark />
        <StoryRail g={SCENES.S07.from + SCENES.S07.frames - 1} />
      </div>
      <RoomInNode shrink={shrink} />
    </AbsoluteFill>
  );
};

/** The demo-room frame (frozen at S07's last frame) scaled from its stage rect (0) into the Web app node (1). */
const RoomInNode: React.FC<{ shrink: number }> = ({ shrink }) => {
  // Uniform scale: frame aspect ≈ node aspect.
  const s = interpolate(shrink, [0, 1], [1, WEB.w / FRAME.w]);
  const tx = interpolate(shrink, [0, 1], [0, WEB.x - WEB.w / 2 - FRAME.x * (WEB.w / FRAME.w)]);
  const ty = interpolate(shrink, [0, 1], [0, WEB.y - WEB.h / 2 - FRAME.y * (WEB.w / FRAME.w)]);
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", translate: `${tx}px ${ty}px`, scale: String(s) }}>
      <FrameBack />
      <FrozenRoom />
      <FrameFront />
    </div>
  );
};

/** Proof rect for the S09 console capture. */
const PROOF = { x: 200, y: 112, w: 1520, h: 855 } as const;

/** S09 — the Step Functions node grows into the real console capture (same run ID). */
export const S09Proof: React.FC<{ theme: ArchTheme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const t = TH[theme];
  const gFrozen = SCENES.S08.from + SCENES.S08.frames - 1;
  const grow = interpolate(frame, [0, SLOT_PREROLL + 6], [0, 1], { ...clamp, easing: easeInOut });
  const sfn = NODES.find((n) => n.id === "sfn")!;
  const from = { x: sfn.x - NW / 2, y: sfn.y - NH / 2, w: NW, h: NH };
  const r = {
    x: interpolate(grow, [0, 1], [from.x, PROOF.x]),
    y: interpolate(grow, [0, 1], [from.y, PROOF.y]),
    w: interpolate(grow, [0, 1], [from.w, PROOF.w]),
    h: interpolate(grow, [0, 1], [from.h, PROOF.h]),
  };
  const content = interpolate(frame, [SLOT_PREROLL - 6, SLOT_PREROLL + 8], [0, 1], clamp);
  const diagramOut = interpolate(frame, [0, SLOT_PREROLL], [1, 0], clamp);
  const end = SLOT_PREROLL + SCENES.S09.frames;
  const out = interpolate(frame, [end - 14, end], [1, 0], clamp);
  const runId = manifest.clips.find((c) => c.shotId === "S09")?.runId;
  const runShort = runId ? (runId.length > 14 ? `${runId.slice(0, 6)}…${runId.slice(-6)}` : runId) : null;
  return (
    <AbsoluteFill style={{ background: t.bg }}>
      <AbsoluteFill style={{ opacity: diagramOut * out }}>
        <Architecture g={gFrozen} theme={theme} graphOpacity={1 - grow} />
        <RoomInNode shrink={1} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          borderRadius: 14,
          overflow: "hidden",
          background: theme === "night" ? "#1C2F3A" : "#FFFFFF",
          border: `2px solid ${C.water}`,
          boxShadow: "0 24px 70px rgba(20,34,43,0.28)",
          opacity: out,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: content }}>
          <FootageSlot shotId="S09" width={PROOF.w - 4} height={PROOF.h - 4} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: PROOF.x,
          top: PROOF.y - 46,
          display: "flex",
          gap: 14,
          alignItems: "center",
          opacity: content * out,
          fontFamily: F.mono,
          fontSize: 20,
          color: t.text,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 5, background: C.water }} />
        {runShort ? `Real execution · ${runShort}` : "Real execution · run ID pending (draft)"}
      </div>
    </AbsoluteFill>
  );
};
