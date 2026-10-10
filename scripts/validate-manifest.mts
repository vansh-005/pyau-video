// Manifest + evidence validation.
//   node scripts/validate-manifest.mts          -> draft report, exits 0
//   node scripts/validate-manifest.mts --final  -> exits 1 on any problem (blocks render:final)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FINAL = process.argv.includes("--final");
const FPS = 30;
// Frames each footage slot must fill: scene length + 20-frame crossfade pre-roll (src/data/timeline.ts).
const SLOT_FRAMES: Record<string, number> = { S03: 620, S04: 380, S05: 1220, S06: 620, S07: 320, S09: 320 };
const SCENE_SECONDS: Record<string, number> = { S01: 18, S02: 6, S03: 20, S04: 12, S05: 40, S06: 20, S07: 10, S08: 26, S09: 10, S10: 8 };
// Services the S08 narration names; each must be listed in facts.awsServices (drop from the script if cut).
const NARRATED_SERVICES: Record<string, string> = {
  Amplify: "AWS Amplify",
  Location: "Amazon Location",
  "API Gateway": "Amazon API Gateway",
  Lambda: "AWS Lambda",
  Bedrock: "Amazon Bedrock",
  "Step Functions": "AWS Step Functions",
  DynamoDB: "Amazon DynamoDB",
  Polly: "Amazon Polly",
  Transcribe: "Amazon Transcribe",
  "EventBridge Scheduler": "Amazon EventBridge Scheduler",
};

const m = JSON.parse(readFileSync("asset-manifest.json", "utf8"));
const narrationDoc = JSON.parse(readFileSync("src/data/narration.json", "utf8"));
const problems: string[] = [];
const notes: string[] = [];
const bad = (s: string) => problems.push(s);

const probeDuration = (file: string): number | null => {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    });
    return parseFloat(out.trim());
  } catch {
    return null;
  }
};

// Composition
const comp = m.composition;
if (comp.id !== "PyauDemo" || comp.width !== 1920 || comp.height !== 1080 || comp.fps !== 30 || comp.durationInFrames !== 5100) {
  bad("composition metadata differs from 1920x1080 / 30 fps / 5100 frames");
}
if (m.mode !== "final") bad(`manifest.mode is "${m.mode}" (must be "final")`);
if (!m.finalRenderAllowed) bad("finalRenderAllowed is false");

// Facts
const f = m.facts;
if (!f.verified || f.status === "expected_fixture_only") bad(`facts not verified (status: ${f.status})`);
const factsPath = "evidence/facts.json";
if (!existsSync(factsPath)) {
  bad(`${factsPath} missing (verified export from the app handoff)`);
} else {
  const src = JSON.parse(readFileSync(factsPath, "utf8"));
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const k of [
    "sessionMode",
    "scenarioDate",
    "heatWindow",
    "requestsInWindow",
    "clusterB",
    "coverageBefore",
    "coverageAfter",
    "unresolved",
    "askTimeoutSecondsDemo",
    "awsServices",
    "appUrl",
  ]) {
    if (src[k] === undefined) bad(`facts.json lacks ${k}`);
    else if (!same(src[k], f[k])) bad(`manifest facts.${k}=${JSON.stringify(f[k])} does not match facts.json ${JSON.stringify(src[k])}`);
  }
  for (const k of ["verifiedFromRunId", "bedrockModelId"]) {
    if (!src[k] || String(src[k]).startsWith("<")) bad(`facts.json ${k} not filled`);
  }
}
for (const [k, c] of [["coverageBefore", f.coverageBefore], ["coverageAfter", f.coverageAfter]] as const) {
  const p = Math.round((c.covered / c.total) * 1000) / 10;
  if (Math.abs(p - c.percent) > 0.05) bad(`facts.${k}.percent ${c.percent} != computed ${p}`);
}
if (f.coverageBefore.total !== f.requestsInWindow) notes.push("coverageBefore.total differs from requestsInWindow — check the 44 on screen");
const narratedS08: string = narrationDoc.scenes.S08;
for (const [spoken, official] of Object.entries(NARRATED_SERVICES)) {
  if (narratedS08.includes(spoken) && !(f.awsServices ?? []).includes(official)) {
    bad(`S08 narration names ${spoken}, but facts.awsServices lacks "${official}"`);
  }
}
if (f.sessionMode !== "demo") notes.push(`sessionMode is ${f.sessionMode}: check the app's scenario badge in captures`);

// Evidence
const evidencePath = "evidence/evidence.json";
const evidence = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) : null;
if (!evidence) bad(`${evidencePath} missing (capture IDs, run IDs, capturedAt, source in/out)`);

// Clips
const runIds: Record<string, string | null> = {};
for (const c of m.clips) {
  const tag = `${c.shotId}`;
  runIds[c.shotId] = c.runId;
  const file = join("public", c.path);
  if (c.status !== "ready") {
    bad(`${tag}: status "${c.status}" — ${c.path} not supplied`);
    continue;
  }
  if (!existsSync(file)) {
    bad(`${tag}: file ${file} does not exist`);
    continue;
  }
  if (c.kind === "real_capture_required" && !c.verified) bad(`${tag}: real capture not marked verified`);
  if (!c.runId) bad(`${tag}: runId missing`);
  if (!c.capturedAt) bad(`${tag}: capturedAt missing`);
  const segs = c.segments?.length ? c.segments : c.sourceInSeconds != null ? [{ in: c.sourceInSeconds, out: c.sourceOutSeconds }] : [];
  if (segs.length === 0) bad(`${tag}: no trim range (sourceIn/Out or segments)`);
  const dur = probeDuration(file);
  if (dur === null) bad(`${tag}: ffprobe could not read ${file}`);
  let frames = 0;
  for (const s of segs) {
    if (s.out <= s.in) bad(`${tag}: segment out <= in`);
    if (dur !== null && s.out > dur + 0.05) bad(`${tag}: segment out ${s.out}s beyond file duration ${dur.toFixed(2)}s`);
    frames += Math.round(((s.out - s.in) * FPS) / (s.rate ?? 1));
  }
  const need = SLOT_FRAMES[c.shotId];
  if (need && frames < need) bad(`${tag}: trimmed footage ${frames} frames < slot ${need} frames`);
  if (segs.length > 1 && !segs.some((s: { shortened?: boolean }) => s.shortened)) {
    notes.push(`${tag}: multiple segments without a 'shortened' label — confirm cuts don't hide processing time`);
  }
  if (evidence && !JSON.stringify(evidence).includes(String(c.runId))) bad(`${tag}: runId ${c.runId} not found in evidence.json`);
}
if (!runIds.S09 || runIds.S09 !== runIds.S05 || runIds.S09 !== runIds.S06) {
  bad(`S09 run ID (${runIds.S09}) must equal S05 (${runIds.S05}) and S06 (${runIds.S06})`);
}
const s03 = m.clips.find((c: { shotId: string }) => c.shotId === "S03");
if (s03?.appAudio) {
  if (!s03.subtitle?.hi || !s03.subtitle?.en) bad("S03: subtitle {hi, en} for the app's Hindi answer missing (copy exact on-screen text)");
  const w = narrationDoc.appAudioWindows?.S03;
  if (w?.startSeconds == null) notes.push("S03 app-audio window follows the voice beat; set narration appAudioWindows.S03 to the real answer's timing");
}
for (const c of m.clips) {
  if (c.status === "ready" && Array.isArray(c.segments) && c.segments.length > 1 && !c.segments.every((x: { shortened?: boolean }, i: number) => i === 0 || x.shortened)) {
    notes.push(`${c.shotId}: later segments should carry shortened: true so "Time shortened" shows`);
  }
}

// Narration + captions
const n = m.narration;
if (!n.finalApproved) bad("narration not approved by Vansh (narration.finalApproved)");
if (n.kind === "recorded") {
  if (n.status !== "ready") bad("recorded narration not ready");
  else if (!existsSync(join("public", n.path))) bad(`narration file public/${n.path} missing`);
  else {
    const d = probeDuration(join("public", n.path));
    if (d !== null && d + (n.offsetSeconds ?? 0) > 170) bad(`narration runs ${d.toFixed(1)}s past the 170s cut`);
  }
  if (narrationDoc.status !== "aligned_to_final_audio") bad(`captions not aligned to recorded audio (narration.json status: ${narrationDoc.status})`);
} else {
  // AI voice (Kokoro): per-scene files + word timings drive audio and captions.
  const vt = existsSync("src/data/voice-timing.json") ? JSON.parse(readFileSync("src/data/voice-timing.json", "utf8")) : null;
  if (!vt) bad("src/data/voice-timing.json missing (npm run voice)");
  for (const sid of Object.keys(SCENE_SECONDS)) {
    const v = vt?.scenes?.[sid];
    if (!v) { bad(`voice for ${sid} missing`); continue; }
    if (!existsSync(join("public", v.file))) bad(`voice file public/${v.file} missing`);
    if (v.lead + v.duration > SCENE_SECONDS[sid]) bad(`voice ${sid} overruns its scene`);
  }
  if (n.status !== "ready") bad(`AI narration status is "${n.status}" (set "ready" once the script is final)`);
  notes.push(`narration uses an AI voice (${n.engine ?? vt?.engine}): disclose it in CREDITS.md and the writeup`);
}
if (!f.appUrl) notes.push("facts.appUrl is null: closing card omits the URL in final mode");

console.log(`Pyau manifest check (${FINAL ? "FINAL" : "draft"} mode)`);
for (const s of notes) console.log(`  note: ${s}`);
if (problems.length === 0) {
  console.log("  OK — all final-render gates pass.");
} else {
  console.log(`  ${problems.length} blocking issue(s) for final render:`);
  for (const p of problems) console.log(`  - ${p}`);
}
if (FINAL && problems.length > 0) {
  console.error("\nFinal render BLOCKED. Draft preview remains available: npm run render:draft");
  process.exit(1);
}
