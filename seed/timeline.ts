// Pyau edit skeleton (frames at 30 fps, total 5100 = 170 s). Keep in sync with video.md and scripts/tts*.py.
export const FPS = 30;
export const SCENES = {
  S01: { from: 0, frames: 540 }, // Problem: 2:10 PM, 45 °C, invisible help (motion graphic)
  S02: { from: 540, frames: 180 }, // Pyau bridge: clay pot -> pin -> wordmark (motion graphic)
  S03: { from: 720, frames: 600 }, // App: rider asks in Hindi, Polly answers (app audio window)
  S04: { from: 1320, frames: 360 }, // App: host joins + morning confirmation
  S05: { from: 1680, frames: 1200 }, // App: TURNING POINT - evening plan by the agent, approval
  S06: { from: 2880, frames: 600 }, // App: Step Functions outreach - timeout, next host, yes, 50% -> 91%
  S07: { from: 3480, frames: 300 }, // App: trust loop - reports pause a dry point
  S08: { from: 3780, frames: 780 }, // AWS architecture with travelling pulse (motion graphic)
  S09: { from: 4560, frames: 300 }, // AWS proof: Step Functions console + CloudWatch, same run ID
  S10: { from: 4860, frames: 240 }, // Close
} as const;
export type SceneId = keyof typeof SCENES;
export const TOTAL_FRAMES = 5100;

// App/AWS footage slots start this many frames before their scene for a crossfade.
export const SLOT_PREROLL = 20;
export const FOOTAGE_SHOTS = ["S03", "S04", "S05", "S06", "S07", "S09"] as const;
