"""Natural scratch/optional narration with Kokoro-82M (Pyau) (Apache-2.0, runs locally, stock voice, no cloning).

Reads src/data/narration.json + asset-manifest facts, writes one WAV per scene to public/audio/voice/
and word timings to src/data/voice-timing.json (drives caption cues and animation sync).

Run: npm run voice   (uses .venv-tts)
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SR = 24000
SCENES = {  # keep in sync with src/data/timeline.ts
    "S01": (0, 540), "S02": (540, 180), "S03": (720, 600), "S04": (1320, 360), "S05": (1680, 1200),
    "S06": (2880, 600), "S07": (3480, 300), "S08": (3780, 780), "S09": (4560, 300), "S10": (4860, 240),
}

doc = json.loads((ROOT / "src/data/narration.json").read_text(encoding="utf8"))
facts = json.loads((ROOT / "asset-manifest.json").read_text(encoding="utf8"))["facts"]
tokens = {
    "beforePercent": round(facts["coverageBefore"]["percent"]),
    "afterPercent": round(facts["coverageAfter"]["percent"]),
    "clusterBRequests": facts["clusterB"]["requests"],
}
pron = doc.get("pronunciations", {})
phon = doc.get("kokoroPhonemes", {})


def speakable(text):
    """Pronunciation rewrites apply to TTS input only; captions keep the display spelling."""
    for k, v in phon.items():  # misaki inline phonemes keep the display word as the token text
        text = re.sub(rf"(?<![\w\[]){re.escape(k)}(?![\w\]])", f"[{k}](/{v}/)", text)
    for k, v in pron.items():
        if k not in phon:
            text = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", v, text)
    return text
voice = doc["voice"]["voice"]
base_speed = float(doc["voice"].get("speed", 1.0))
only = sys.argv[1:]  # optional scene ids

pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
out_dir = ROOT / "public/audio/voice"
out_dir.mkdir(parents=True, exist_ok=True)
timing_path = ROOT / "src/data/voice-timing.json"
timing = json.loads(timing_path.read_text(encoding="utf8")) if timing_path.exists() else {}
timing_scenes = timing.get("scenes", {}) if isinstance(timing, dict) else {}


PAUSE = 1.0  # seconds of silence for each "||" beat marker in the script


def synth(text, speed, pause=PAUSE):
    """Returns audio, word timings and the beats (silences inserted for each '||'), in seconds from audio start."""
    chunks, words, beats, offset = [], [], [], 0.0
    for i, part in enumerate(p.strip() for p in text.split("||")):
        if i > 0:
            chunks.append(np.zeros(int(pause * SR), dtype=np.float32))
            beats.append({"start": round(offset, 3), "end": round(offset + pause, 3)})
            offset += pause
        for r in pipe(speakable(part), voice=voice, speed=speed, split_pattern=r"\n+"):
            a = r.audio.numpy()
            for t in r.tokens or []:
                if t.start_ts is None or not re.search(r"\w", t.text):
                    continue
                words.append({"w": t.text, "start": round(offset + t.start_ts, 3), "end": round(offset + (t.end_ts or t.start_ts), 3)})
            chunks.append(a)
            offset += len(a) / SR
    return np.concatenate(chunks), words, beats


for sid, (start, frames) in SCENES.items():
    if only and sid not in only:
        continue
    text = re.sub(r"\{(\w+)\}", lambda m: str(tokens[m.group(1)]), doc["scenes"][sid])
    lead = float(doc["leadSeconds"].get(sid, 0.4))
    avail = frames / FPS - lead - 0.35
    speed = base_speed
    pause = float(doc.get("pauseSeconds", {}).get(sid, PAUSE))
    audio, words, beats = synth(text, speed, pause)
    while len(audio) / SR > avail and speed < base_speed + 0.12:
        speed = round(speed + 0.03, 2)
        audio, words, beats = synth(text, speed, pause)
    dur = len(audio) / SR
    flag = "" if dur <= avail else f"  !! {dur - avail:.2f}s too long"
    sf.write(out_dir / f"{sid}.wav", audio, SR, subtype="PCM_16")
    timing_scenes[sid] = {
        "file": f"audio/voice/{sid}.wav", "lead": lead, "duration": round(dur, 3), "speed": speed,
        "words": words, "beats": beats,
    }
    print(f"{sid}: {dur:5.2f}s of {avail:5.2f}s available, speed {speed}{flag}")

# App-audio windows: in S03 the single beat is where the real app's Hindi answer plays (narration silent).
for sid in doc.get("appAudioWindows", {}):
    sv = timing_scenes.get(sid)
    if sv and sv.get("beats"):
        b = sv["beats"][0]
        print(f"{sid} app-audio window (scene seconds): {sv['lead'] + b['start']:.2f}–{sv['lead'] + b['end']:.2f}")

timing_path.write_text(json.dumps({"engine": "kokoro-82m", "voice": voice, "scenes": timing_scenes}, indent=1), encoding="utf8")
print(f"Wrote {timing_path.relative_to(ROOT)}")
