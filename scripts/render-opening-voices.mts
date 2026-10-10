// V00: renders the 12 s S01 proof once per available narration engine so Vansh can choose by ear.
//   node scripts/render-opening-voices.mts
// Kokoro: public/audio/voice/S01.wav (npm run voice). Polly Kajal: public/audio/voice-polly/S01.wav
// (scripts/tts_polly.py --alt S01, only with Vansh's go-ahead). The Polly variant keeps Kokoro-timed visuals and
// omits captions, so it is for voice choice only.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const run = (args: string[]) => {
  const r = spawnSync("npx", ["remotion", "render", "src/index.ts", "S01-Problem", ...args, "--frames=0-359"], {
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(["out/draft/opening-proof-kokoro.mp4"]);
if (existsSync("public/audio/voice-polly/S01.wav")) {
  run(["out/draft/opening-proof-polly.mp4", `--props="{\\"voiceDir\\":\\"audio/voice-polly\\"}"`]);
} else {
  console.log("Polly Kajal variant skipped: public/audio/voice-polly/S01.wav not present (needs Vansh's OK for one Polly call).");
}
