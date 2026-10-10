import { SCENES } from "./timeline";
import { at, voiceTiming } from "./voice";

export type SfxCue = { name: string; src: string; frame: number; volume: number };

const S = (name: string) => `audio/sfx/${name}.wav`;

/** Sound design cues (global frames). Keyed to the same word anchors as the visuals. */
export const sfxCues = (): SfxCue[] => {
  const cues: SfxCue[] = [
    // Hand-offs
    { name: "stamp: hard cut to the pyau", src: S("stamp"), frame: SCENES.S02.from, volume: 0.2 },
    { name: "whoosh: map -> demo room", src: S("whoosh"), frame: SCENES.S02.from + 128, volume: 0.24 },
    { name: "whoosh: demo room -> AWS", src: S("whoosh"), frame: SCENES.S08.from - 4, volume: 0.28 },
    { name: "whoosh: Step Functions node -> console", src: S("whoosh"), frame: SCENES.S09.from - 6, volume: 0.24 },
    // Story-rail steps
    { name: "tick: rail Ask", src: S("tick"), frame: SCENES.S03.from + 8, volume: 0.16 },
    { name: "tick: rail Host", src: S("tick"), frame: SCENES.S04.from, volume: 0.16 },
    { name: "tick: rail Plan", src: S("tick"), frame: SCENES.S05.from, volume: 0.16 },
    { name: "tick: rail Follow through", src: S("tick"), frame: SCENES.S06.from, volume: 0.16 },
    { name: "tick: rail Trust", src: S("tick"), frame: SCENES.S07.from, volume: 0.16 },
    // Moments
    { name: "pop: pin drops", src: S("pop"), frame: at("S02", "Pyau", 1, -0.1, 2.4), volume: 0.2 },
    { name: "stamp: timed out", src: S("stamp"), frame: at("S06", "No", 1, 0, 6), volume: 0.16 },
    { name: "tick: yes", src: S("tick"), frame: at("S06", "yes", 1, 0, 9), volume: 0.2 },
    { name: "chime: close", src: S("chime"), frame: at("S10", "Pyau", 1, -0.25, 1.2), volume: 0.28 },
  ];
  // Low clock under the S06 countdown, from the first ask until "No answer in time".
  const tickFrom = at("S06", "asks", 1, 0, 3);
  const tickTo = at("S06", "No", 1, -0.2, 6);
  for (let f = tickFrom, k = 0; f < tickTo; f += 30, k++) {
    cues.push({ name: `clock ${k + 1}`, src: S("clock"), frame: f, volume: 0.1 });
  }
  // Architecture nodes pop in as they are named.
  for (const w of ["Amplify", "Location", "API", "Lambda", "Strands", "Bedrock", "Step", "DynamoDB", "Polly", "Transcribe", "EventBridge"]) {
    cues.push({ name: `pop: ${w}`, src: S("pop"), frame: at("S08", w) - 6, volume: 0.12 });
  }
  return cues;
};

/** Seconds (global) in which the app's own audio plays; music and narration stay out of the way. */
export type Window = { start: number; end: number };

/** Music level per frame: dips under narration, rises in the gaps, and drops out under app audio. */
export const musicVolume = (total: number, fps: number, appAudio: Window[] = []): Float32Array => {
  const speaking = new Uint8Array(total);
  for (const [sid, v] of Object.entries(voiceTiming.scenes)) {
    const base = SCENES[sid as keyof typeof SCENES].from / fps + v.lead;
    let s = -1;
    let e = -1;
    const mark = () => {
      for (let f = Math.floor((s - 0.15) * fps); f < Math.ceil((e + 0.25) * fps); f++) if (f >= 0 && f < total) speaking[f] = 1;
    };
    for (const w of v.words) {
      const ws = base + w.start;
      const we = base + w.end;
      if (s < 0) [s, e] = [ws, we];
      else if (ws - e > 0.8) {
        mark();
        [s, e] = [ws, we];
      } else e = we;
    }
    if (s >= 0) mark();
  }
  const silent = new Uint8Array(total);
  for (const w of appAudio) {
    for (let f = Math.floor((w.start - 0.3) * fps); f < Math.ceil((w.end + 0.3) * fps); f++) if (f >= 0 && f < total) silent[f] = 1;
  }
  const UNDER = 0.1; // ≈ −12 dB under speech
  const OPEN = 0.3;
  const out = new Float32Array(total);
  let level = OPEN;
  const step = (OPEN - UNDER) / 12; // ~0.4 s ramps
  for (let f = 0; f < total; f++) {
    const ahead = Math.min(total - 1, f + 6);
    const target = silent[ahead] ? 0 : speaking[ahead] ? UNDER : OPEN; // duck slightly ahead of speech
    level = target < level ? Math.max(target, level - step) : Math.min(target, level + step * 0.6);
    out[f] = level;
  }
  return out;
};
