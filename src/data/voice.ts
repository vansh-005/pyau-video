import narration from "./narration.json";
import timing from "./voice-timing.json";
import { FPS, SCENES, SceneId } from "./timeline";

type Word = { w: string; start: number; end: number };
type Beat = { start: number; end: number };
type SceneVoice = { file: string; lead: number; duration: number; words: Word[]; beats?: Beat[] };

export const voiceTiming = timing as unknown as { engine: string; voice: string; scenes: Record<string, SceneVoice> };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Global frame at which `word` (nth occurrence) is spoken in a scene's narration.
 * Visuals keyed to words stay in sync when the script or voice changes.
 * `fallbackSeconds` (scene-relative) is used if the word is missing (script edited without `npm run voice`).
 */
export const at = (scene: SceneId, word: string, nth = 1, offsetSeconds = 0, fallbackSeconds = 0.5): number => {
  const sv = voiceTiming.scenes[scene];
  const base = SCENES[scene].from;
  if (sv) {
    const target = norm(word);
    let seen = 0;
    for (const w of sv.words) {
      if (norm(w.w) === target && ++seen === nth) {
        return base + Math.round((sv.lead + w.start + offsetSeconds) * FPS);
      }
    }
  }
  return base + Math.round((fallbackSeconds + offsetSeconds) * FPS);
};

/** Scene-local variant of `at` for components that run inside their scene's Sequence. */
export const atLocal = (scene: SceneId, word: string, nth = 1, offsetSeconds = 0, fallbackSeconds = 0.5): number =>
  at(scene, word, nth, offsetSeconds, fallbackSeconds) - SCENES[scene].from;

/** Global frame when a scene's narration ends. */
export const voiceEnd = (scene: SceneId): number => {
  const sv = voiceTiming.scenes[scene];
  const base = SCENES[scene].from;
  return sv ? base + Math.round((sv.lead + sv.duration) * FPS) : base + SCENES[scene].frames;
};

/**
 * App-audio window for a scene in scene-relative seconds: narration.json's explicit window if set,
 * otherwise the scene's first `||` beat from the voice timing (where narration is silent).
 */
export const appAudioWindow = (scene: SceneId): { start: number; end: number } | null => {
  const explicit = (narration.appAudioWindows as Record<string, { startSeconds: number | null; endSeconds: number | null }>)[scene];
  if (!explicit) return null;
  if (explicit.startSeconds !== null && explicit.endSeconds !== null) {
    return { start: explicit.startSeconds, end: explicit.endSeconds };
  }
  const sv = voiceTiming.scenes[scene];
  const b = sv?.beats?.[0];
  return b ? { start: sv.lead + b.start, end: sv.lead + b.end } : null;
};
