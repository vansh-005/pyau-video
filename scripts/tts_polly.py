"""Optional narration with Amazon Polly — Kajal (neural, bilingual Indian English + Hindi). Stock voice, no cloning.

Same inputs/outputs as tts.py: reads src/data/narration.json + asset-manifest facts, writes one WAV per scene and
word timings (from Polly speech marks) so `at(scene, word)` and captions keep working.

Needs Vansh's go-ahead to use his AWS credentials for this one API (polly:SynthesizeSpeech). Nothing is deployed.

Run:
  npm run voice:polly                       -> public/audio/voice/*.wav + src/data/voice-timing.json (replaces Kokoro)
  .venv-tts\\Scripts\\python scripts/tts_polly.py --alt [S01 ...]
                                            -> public/audio/voice-polly/*.wav + src/data/voice-timing.polly.json (A/B only)
Env: AWS_PROFILE (optional), POLLY_REGION (default ap-south-1).
"""
import json
import os
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

import boto3
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SR = 16000  # Polly neural PCM supports 8000 / 16000 Hz
VOICE = "Kajal"
SCENES = {  # keep in sync with src/data/timeline.ts
    "S01": (0, 540), "S02": (540, 180), "S03": (720, 600), "S04": (1320, 360), "S05": (1680, 1200),
    "S06": (2880, 600), "S07": (3480, 300), "S08": (3780, 780), "S09": (4560, 300), "S10": (4860, 240),
}

args = sys.argv[1:]
ALT = "--alt" in args
only = [a for a in args if not a.startswith("--")]

doc = json.loads((ROOT / "src/data/narration.json").read_text(encoding="utf8"))
facts = json.loads((ROOT / "asset-manifest.json").read_text(encoding="utf8"))["facts"]
tokens = {
    "beforePercent": round(facts["coverageBefore"]["percent"]),
    "afterPercent": round(facts["coverageAfter"]["percent"]),
    "clusterBRequests": facts["clusterB"]["requests"],
}
PAUSE = 1.0

session = boto3.Session(profile_name=os.environ.get("AWS_PROFILE")) if os.environ.get("AWS_PROFILE") else boto3.Session()
polly = session.client("polly", region_name=os.environ.get("POLLY_REGION", "ap-south-1"))

out_dir = ROOT / ("public/audio/voice-polly" if ALT else "public/audio/voice")
out_dir.mkdir(parents=True, exist_ok=True)
timing_path = ROOT / ("src/data/voice-timing.polly.json" if ALT else "src/data/voice-timing.json")
timing = json.loads(timing_path.read_text(encoding="utf8")) if timing_path.exists() else {}
timing_scenes = timing.get("scenes", {}) if timing.get("engine") == "polly-kajal-neural" else {}


def ssml(text, pause, rate):
    """'||' beats become <break>s bracketed by marks so their exact position comes back in the speech marks."""
    parts = [escape(p.strip()) for p in text.split("||")]
    body = ""
    for i, p in enumerate(parts):
        if i > 0:
            body += f'<mark name="beat{i - 1}s"/><break time="{int(pause * 1000)}ms"/><mark name="beat{i - 1}e"/>'
        body += p
    return f'<speak><prosody rate="{rate}%">{body}</prosody></speak>'


def synth(text, pause, rate):
    s = ssml(text, pause, rate)
    common = dict(Engine="neural", VoiceId=VOICE, LanguageCode="en-IN", TextType="ssml", Text=s)
    audio = polly.synthesize_speech(OutputFormat="pcm", SampleRate=str(SR), **common)["AudioStream"].read()
    marks_raw = polly.synthesize_speech(OutputFormat="json", SpeechMarkTypes=["word", "ssml"], **common)["AudioStream"].read()
    marks = [json.loads(line) for line in marks_raw.decode("utf8").splitlines() if line.strip()]
    pcm = np.frombuffer(audio, dtype="<i2").astype(np.float32) / 32768.0
    dur = len(pcm) / SR
    words_m = [m for m in marks if m["type"] == "word"]
    words = []
    for i, m in enumerate(words_m):
        start = m["time"] / 1000
        end = words_m[i + 1]["time"] / 1000 if i + 1 < len(words_m) else dur
        words.append({"w": m["value"], "start": round(start, 3), "end": round(min(end, start + 1.2), 3)})
    beats = []
    ssml_m = {m["value"]: m["time"] / 1000 for m in marks if m["type"] == "ssml"}
    k = 0
    while f"beat{k}s" in ssml_m:
        beats.append({"start": round(ssml_m[f"beat{k}s"], 3), "end": round(ssml_m.get(f"beat{k}e", ssml_m[f"beat{k}s"] + pause), 3)})
        k += 1
    return pcm, words, beats


for sid, (start, frames) in SCENES.items():
    if only and sid not in only:
        continue
    text = re.sub(r"\{(\w+)\}", lambda m: str(tokens[m.group(1)]), doc["scenes"][sid])
    lead = float(doc["leadSeconds"].get(sid, 0.4))
    avail = frames / FPS - lead - 0.35
    pause = float(doc.get("pauseSeconds", {}).get(sid, PAUSE))
    rate = 100
    pcm, words, beats = synth(text, pause, rate)
    while len(pcm) / SR > avail and rate < 112:
        rate += 3
        pcm, words, beats = synth(text, pause, rate)
    dur = len(pcm) / SR
    flag = "" if dur <= avail else f"  !! {dur - avail:.2f}s too long"
    sf.write(out_dir / f"{sid}.wav", pcm, SR, subtype="PCM_16")
    rel = out_dir.relative_to(ROOT / "public").as_posix()
    timing_scenes[sid] = {"file": f"{rel}/{sid}.wav", "lead": lead, "duration": round(dur, 3), "rate": rate, "words": words, "beats": beats}
    print(f"{sid}: {dur:5.2f}s of {avail:5.2f}s available, rate {rate}%{flag}")

timing_path.write_text(json.dumps({"engine": "polly-kajal-neural", "voice": VOICE, "scenes": timing_scenes}, indent=1), encoding="utf8")
print(f"Wrote {timing_path.relative_to(ROOT)}")
