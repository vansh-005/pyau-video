// Pure caption builder shared by the composition and scripts/export-captions.mts (Node type-stripping).
// Keep this file free of imports and non-erasable TypeScript syntax.

export type Cue = { start: number; end: number; text: string; scene: string };

type SceneWindow = { from: number; frames: number };
type Word = { w: string; start: number; end: number };
type SceneVoice = { lead: number; words: Word[] };

type NarrationDoc = {
  scenes: Record<string, string>;
  cues: Cue[] | null;
};

type FactTokens = {
  coverageBefore: { percent: number };
  coverageAfter: { percent: number };
  clusterB: { requests: number };
};

const HARD_MAX = 58; // always break before exceeding this

export const fillTokens = (text: string, f: FactTokens): string =>
  text
    .replace(/\{beforePercent\}/g, String(Math.round(f.coverageBefore.percent)))
    .replace(/\{afterPercent\}/g, String(Math.round(f.coverageAfter.percent)))
    .replace(/\{clusterBRequests\}/g, String(f.clusterB.requests));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Map each display word (with punctuation) onto spoken token timings. */
const align = (text: string, words: Word[]): { text: string; start: number; end: number }[] => {
  const display = text.replace(/\|\|/g, " ").split(/\s+/).filter(Boolean);
  const out: { text: string; start: number; end: number }[] = [];
  let i = 0;
  for (const dw of display) {
    const target = norm(dw);
    if (!target || i >= words.length) {
      if (out.length) out[out.length - 1].text += ` ${dw}`;
      continue;
    }
    let acc = "";
    const start = words[i].start;
    let end = words[i].end;
    while (i < words.length && acc.length < target.length) {
      acc += norm(words[i].w);
      end = words[i].end;
      i++;
    }
    out.push({ text: dw, start, end });
  }
  return out;
};

export const buildCues = (
  doc: NarrationDoc,
  scenes: Record<string, SceneWindow>,
  facts: FactTokens,
  fps: number,
  voice: Record<string, SceneVoice> | null,
): Cue[] => {
  if (doc.cues && doc.cues.length > 0) {
    return doc.cues.map((c) => ({ ...c, text: fillTokens(c.text, facts) }));
  }
  const cues: Cue[] = [];
  for (const [scene, win] of Object.entries(scenes)) {
    const text = doc.scenes[scene];
    const sv = voice?.[scene];
    if (!text || !sv) continue;
    const base = win.from / fps + sv.lead;
    const aligned = align(fillTokens(text, facts), sv.words);
    // 1) Phrases: split at sentence ends and audible pauses.
    const phrases: (typeof aligned)[] = [];
    let cur: typeof aligned = [];
    for (let k = 0; k < aligned.length; k++) {
      const w = aligned[k];
      cur.push(w);
      const next = aligned[k + 1];
      if (!next || /[.!?]$/.test(w.text) || next.start - w.end > 0.6) {
        phrases.push(cur);
        cur = [];
      }
    }
    // 2) Long phrases: balanced split into n parts, preferring breaks after punctuation.
    const textOf = (ws: typeof aligned) => ws.map((x) => x.text).join(" ");
    for (const ph of phrases) {
      const total = textOf(ph).length;
      const n = Math.ceil(total / HARD_MAX);
      const target = total / n;
      // Cumulative text length after each word.
      const cum: number[] = [];
      ph.forEach((w, k) => cum.push((k ? cum[k - 1] + 1 : 0) + w.text.length));
      // Choose each break near j*target; reward punctuation, avoid stranding 1-2 words.
      const breaks: number[] = [];
      let prev = -1;
      for (let j = 1; j < n; j++) {
        let best = -1;
        let bestCost = Infinity;
        for (let k = prev + 2; k < ph.length - 2; k++) {
          const startLen = prev >= 0 ? cum[prev] + 1 : 0;
          if (cum[k] - startLen > HARD_MAX + 6) break;
          const cost = Math.abs(cum[k] - j * target) - (/[,:;]$/.test(ph[k].text) ? 14 : 0);
          if (cost < bestCost) {
            bestCost = cost;
            best = k;
          }
        }
        if (best < 0) break;
        breaks.push(best);
        prev = best;
      }
      const parts: (typeof aligned)[] = [];
      let s0 = 0;
      for (const b of [...breaks, ph.length - 1]) {
        parts.push(ph.slice(s0, b + 1));
        s0 = b + 1;
      }
      for (const p of parts) {
        cues.push({
          start: round(base + p[0].start - 0.08),
          end: round(base + p[p.length - 1].end + 0.3),
          text: textOf(p),
          scene,
        });
      }
    }
  }
  // Never overlap the next cue.
  for (let k = 0; k < cues.length - 1; k++) {
    if (cues[k].end > cues[k + 1].start - 0.04) cues[k].end = round(cues[k + 1].start - 0.04);
  }
  return cues;
};

const round = (n: number) => Math.round(n * 1000) / 1000;

const ts = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(sec)},${p(r, 3)}`;
};

export const toSrt = (cues: Cue[]): string =>
  cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");
