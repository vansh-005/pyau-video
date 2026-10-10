// What each real-capture slot must show. Rendered on draft slates and mirrored in FOOTAGE-REQUEST.md.
export const SHOT_REQUESTS: Record<string, { title: string; file: string; mustShow: string[]; evidence: string }> = {
  S03: {
    title: "Rider asks in Hindi — Pyau answers out loud",
    file: "03-rider-voice.mp4 · system audio ON",
    mustShow: [
      "Rider panel at 14:00: hold mic → Hindi question → transcript",
      "Spoken Hindi answer (Polly) audible in the recording",
      "Answer card: host, distance, open till, confirmed today → route line",
    ],
    evidence: "session ID · answer text exactly as shown",
  },
  S04: {
    title: "Host joins, then confirms in the morning",
    file: "04-host-join.mp4",
    mustShow: [
      "Register: type, offers, hours, pin → address appears",
      "Listed / standby, consent → saved",
      "Morning freshness card → हाँ",
    ],
    evidence: "session ID",
  },
  S05: {
    title: "Turning point — the agent plans, the coordinator approves",
    file: "05-plan-approve.mp4",
    mustShow: [
      "Evening clock, heat curve, coverage 50% → Run coverage plan",
      "Real tool receipts → plan: B · 18, Kirana store → RWA office, Hindi message",
      "D · 4 in “Needs a human decision” → checkbox → Approve outreach",
    ],
    evidence: "run ID · model ID",
  },
  S06: {
    title: "Step Functions follows through",
    file: "06-outreach.mp4",
    mustShow: [
      "H4 inbox countdown → timed out → switch to H5 → हाँ",
      "Coordinator board advances; rider map gains a live pot",
      "Coverage recomputes 50% → 91%; gap D still red",
    ],
    evidence: "same run ID as S05",
  },
  S07: {
    title: "Trust loop — bad points pause themselves",
    file: "07-trust.mp4",
    mustShow: [
      "Fresh session: rider reports “No water” twice on one point",
      "Point pauses (greys out)",
      "Point appears in the coordinator problem queue",
    ],
    evidence: "session ID",
  },
  S09: {
    title: "Real execution in the Step Functions console",
    file: "09-aws-proof.mp4",
    mustShow: [
      "Execution named with the same run ID as S05/S06",
      "Graph with timeout branch and accept branch; event history",
      "CloudWatch Logs Insights filtered by that run ID — no account IDs",
    ],
    evidence: "run ID (sanitized)",
  },
};
