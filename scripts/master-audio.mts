// Two-pass EBU R128 loudness normalization of the rendered mix. Video stream is copied untouched.
//   node scripts/master-audio.mts <in.mp4> <out.mp4>
import { spawnSync } from "node:child_process";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: master-audio.mts <in.mp4> <out.mp4>");
const TARGET = "I=-16:TP=-1.5:LRA=11";

const pass1 = spawnSync("ffmpeg", ["-hide_banner", "-i", input, "-vn", "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const json = pass1.stderr.slice(pass1.stderr.lastIndexOf("{"), pass1.stderr.lastIndexOf("}") + 1);
const m = JSON.parse(json);
const filter =
  `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
  `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const pass2 = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-y", "-i", input, "-c:v", "copy", "-af", filter, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (pass2.status !== 0) {
  console.error(pass2.stderr.slice(-2000));
  process.exit(1);
}
console.log(`Mastered audio: ${m.input_i} LUFS -> -16 LUFS target (${output})`);
