// Checks an actual rendered file, not composition metadata.
//   node scripts/qa-render.mts <file.mp4> [--final]
import { execFileSync, spawnSync } from "node:child_process";

const file = process.argv[2];
const FINAL = process.argv.includes("--final");
if (!file) throw new Error("usage: qa-render.mts <file> [--final]");

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { encoding: "utf8" }),
);
const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === "video");
const a = probe.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
const duration = parseFloat(probe.format.duration);
const issues: string[] = [];

if (v?.codec_name !== "h264") issues.push(`video codec ${v?.codec_name}`);
if (v?.pix_fmt !== "yuv420p") issues.push(`pix_fmt ${v?.pix_fmt}`);
if (v?.width !== 1920 || v?.height !== 1080) issues.push(`size ${v?.width}x${v?.height}`);
if (v?.r_frame_rate !== "30/1") issues.push(`fps ${v?.r_frame_rate}`);
if (!a) issues.push("no audio stream");
else if (a.codec_name !== "aac") issues.push(`audio codec ${a.codec_name}`);
if (!(duration < 180)) issues.push(`duration ${duration}s not under 180s`);

// Full decode pass + black-frame and long-silence detection (proves the file decodes end to end).
const run = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-i", file, "-vf", "blackdetect=d=0.25:pix_th=0.08", "-af", "silencedetect=n=-45dB:d=4", "-f", "null", "-"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (run.status !== 0) issues.push(`decode failed (ffmpeg exit ${run.status})`);
const stderr = run.stderr ?? "";
const blacks = stderr.match(/black_start:[^\n]+/g) ?? [];
const silences = stderr.match(/silence_start: [\d.]+/g) ?? [];
if (blacks.length) issues.push(`black segments: ${blacks.join(" | ")}`);

console.log(`QA ${file}`);
console.log(`  ${v?.codec_name} ${v?.width}x${v?.height} ${v?.r_frame_rate} ${v?.pix_fmt} · audio ${a?.codec_name ?? "none"} · ${duration.toFixed(3)}s`);
console.log(`  silences >4s: ${silences.length ? silences.join(", ") : "none"}`);
if (issues.length) {
  console.log("  issues:");
  for (const i of issues) console.log(`  - ${i}`);
  if (FINAL) process.exit(1);
} else {
  console.log("  OK");
}
