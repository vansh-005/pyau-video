"""Original ambient music bed + UI sound effects, synthesized from scratch (project-owned, no samples).

Writes public/audio/bed.wav + bed.mp3 (170 s) and public/audio/sfx/{whoosh,tick,pop,chime}.wav.
Deterministic (fixed seed). Run: npm run sound
"""
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
DUR = 170.0
N = int(SR * DUR)
rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_ads(n, attack, release):
    e = np.ones(n, dtype=np.float32)
    a = min(int(attack * SR), n)
    r = min(int(release * SR), n)
    e[:a] = np.linspace(0, 1, a) ** 2
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return e


def pad_chord(notes, length, brightness):
    """Soft additive pad: three detuned partial stacks per note, stereo spread."""
    n = int(length * SR)
    t = np.arange(n) / SR
    L = np.zeros(n, dtype=np.float32)
    R = np.zeros(n, dtype=np.float32)
    for i, m in enumerate(notes):
        f = midi(m)
        for cents, pan in ((-7, 0.8), (0, 0.5), (7, 0.2)):
            ff = f * 2 ** (cents / 1200)
            ph = rng.uniform(0, 2 * np.pi)
            wob = 1 + 0.002 * np.sin(2 * np.pi * 0.13 * t + ph)
            x = np.sin(2 * np.pi * ff * t * wob + ph)
            x += brightness * 0.22 * np.sin(4 * np.pi * ff * t + ph)
            x += brightness * 0.07 * np.sin(6 * np.pi * ff * t + ph)
            x = x.astype(np.float32) / (1 + 0.15 * i)
            L += x * pan
            R += x * (1 - pan)
    e = env_ads(n, 2.2, 3.0)
    return L * e, R * e


def bell(m, vel):
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.1)
    x += 0.28 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / 0.45)
    x += 0.10 * np.sin(2 * np.pi * 3.0 * f * t) * np.exp(-t / 0.25)
    x *= np.minimum(1, t / 0.006)
    return (x * vel).astype(np.float32)


def thump():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 52 + 30 * np.exp(-t / 0.04)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    return (x * np.minimum(1, t / 0.004)).astype(np.float32)


def add(buf, x, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


def reverb(x, seconds=2.6, seed=0):
    r = np.random.default_rng(seed)
    m = int(seconds * SR)
    t = np.arange(m) / SR
    ir = (r.standard_normal(m) * np.exp(-t / 0.75)).astype(np.float32)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt(np.sum(ir**2))
    size = 1 << int(np.ceil(np.log2(len(x) + m)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y.astype(np.float32)


# ------------------------------------------------------------------ bed
L = np.zeros(N, dtype=np.float32)
R = np.zeros(N, dtype=np.float32)
bells = np.zeros(N, dtype=np.float32)
pulse = np.zeros(N, dtype=np.float32)

# Act 1 (problem, S01 0-18 s): unresolved, darker voicings.
act1 = [
    (0.0, [47, 54, 57, 61, 62], 0.15),   # Bm(add9)
    (4.5, [43, 50, 54, 59, 62], 0.15),   # Gmaj7
    (9.0, [40, 47, 52, 55, 59], 0.2),    # Em9
    (13.5, [42, 49, 54, 59, 61], 0.25),  # F#sus4 -> tension into the pyau reveal at 18 s
]
for at, notes, b in act1:
    l, r = pad_chord(notes, 8.5, b)
    add(L, l, at)
    add(R, r, at)

# Acts 2-3 (Pyau + AWS): warm loop D - A/C# - Bm - G, 8 s per chord, from the pyau reveal at 18 s.
loop = [
    [50, 57, 62, 66, 69, 76],  # Dadd9
    [49, 57, 61, 64, 69, 71],  # A/C#
    [47, 54, 59, 62, 66, 69],  # Bm7
    [43, 50, 55, 59, 62, 66],  # Gmaj7
]
t0 = 17.9
k = 0
while t0 < 162:
    l, r = pad_chord(loop[k % 4], 10.5, 0.45)
    add(L, l, t0)
    add(R, r, t0)
    t0 += 8.0
    k += 1

# Close: resolve on Dmaj9 and let it ring.
l, r = pad_chord([38, 50, 57, 61, 64, 69, 73], 9.0, 0.5)
add(L, l * 1.2, 161.8)
add(R, r * 1.2, 161.8)

# Low drone on D/A (tanpura-like, original synthesis): gentle re-plucked fifths under acts 2-3.
drone = np.zeros(N, dtype=np.float32)


def tanpura(m, length=4.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = np.zeros(n)
    for h, a in ((1, 1.0), (2, 0.55), (3, 0.4), (4, 0.28), (5, 0.18), (6, 0.12), (8, 0.06)):
        # slight harmonic shimmer gives the jawari buzz without samples
        x += a * np.sin(2 * np.pi * f * h * t * (1 + 0.0007 * h) + 0.3 * np.sin(2 * np.pi * 0.7 * h * t))
    x *= np.exp(-t / 2.4) * np.minimum(1, t / 0.02)
    return x.astype(np.float32)


t = 18.2
seq = [45, 50, 50, 38]  # Pa Sa Sa Sa (low)
k = 0
while t < 160:
    add(drone, tanpura(seq[k % 4]) * 0.16, t)
    t += 1.15
    k += 1

# Sparse bells from the reveal onward (D major pentatonic, 76 bpm grid).
beat = 60 / 76
penta = [74, 76, 78, 81, 83, 86]
t = 18.6
while t < 160:
    if rng.random() < 0.32:
        add(bells, bell(int(rng.choice(penta)), float(rng.uniform(0.25, 0.55))), t)
    t += beat
# Soft pulse under the AWS section for momentum.
t = 126.4  # S08 architecture: 126-152 s
while t < 151.5:
    add(pulse, thump() * 0.55, t)
    t += beat

dry_l = L * 0.55 + bells * 0.5 + pulse + drone
dry_r = R * 0.55 + bells * 0.5 + pulse + drone
wet_l = reverb(dry_l, seed=1)
wet_r = reverb(dry_r, seed=2)
out = np.stack([dry_l * 0.7 + wet_l * 0.45, dry_r * 0.7 + wet_r * 0.45], axis=1)
fade = np.ones(N, dtype=np.float32)
fade[: int(2 * SR)] = np.linspace(0, 1, int(2 * SR)) ** 2
fade[-int(4 * SR):] = np.linspace(1, 0, int(4 * SR)) ** 1.5
out *= fade[:, None]
rms = np.sqrt(np.mean(out**2))
out *= 10 ** (-18 / 20) / max(rms, 1e-9)  # ~ -18 dBFS RMS; the edit sets the final level
peak = np.max(np.abs(out))
if peak > 0.89:
    out *= 0.89 / peak
(ROOT / "public/audio/sfx").mkdir(parents=True, exist_ok=True)
sf.write(ROOT / "public/audio/bed.wav", out, SR, subtype="PCM_16")
# Compact copy used by the edit (the 32 MB WAV stays local / git-ignored).
import subprocess

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / "public/audio/bed.wav"), "-b:a", "320k", str(ROOT / "public/audio/bed.mp3")], check=True)
print(f"bed.wav {DUR:.0f}s rms {20*np.log10(np.sqrt(np.mean(out**2))):.1f} dBFS peak {20*np.log10(np.max(np.abs(out))):.1f} dBFS")

# ------------------------------------------------------------------ sfx


def save(name, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.8
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    sf.write(ROOT / f"public/audio/sfx/{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")
    print(f"sfx/{name}.wav {len(x)/SR:.2f}s")


# Whoosh: band-limited noise swelling and panning left -> right.
n = int(1.0 * SR)
noise = rng.standard_normal(n)
spec = np.fft.rfft(noise)
freqs = np.fft.rfftfreq(n, 1 / SR)
spec *= np.exp(-((np.log(freqs + 1) - np.log(900)) ** 2) / 0.9)
w = np.fft.irfft(spec, n)
tt = np.arange(n) / SR
shape = np.sin(np.pi * np.clip(tt / 1.0, 0, 1)) ** 3
w *= shape
pan = np.linspace(0.25, 0.75, n)
save("whoosh", np.stack([w * (1 - pan), w * pan], axis=1))

# Tick: soft confirmation for a checklist item.
n = int(0.16 * SR)
tt = np.arange(n) / SR
save("tick", np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt / 0.03) + 0.5 * np.sin(2 * np.pi * 2640 * tt) * np.exp(-tt / 0.015))

# Pop: node appearing in the architecture.
n = int(0.2 * SR)
tt = np.arange(n) / SR
fr = 520 + 300 * (1 - np.exp(-tt / 0.03))
save("pop", np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt / 0.06) * np.minimum(1, tt / 0.003))

# Chime: brand moment at the close.
save("chime", bell(74, 1.0) + bell(81, 0.6) + bell(78, 0.45))

# Clock: low, woody tick under the S06 outreach countdown.
n = int(0.12 * SR)
tt = np.arange(n) / SR
save("clock", 0.8 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.018) + 0.35 * np.sin(2 * np.pi * 820 * tt) * np.exp(-tt / 0.006))

# Stamp: soft muted thud for "timed out" and the hard cut into S02.
n = int(0.35 * SR)
tt = np.arange(n) / SR
fr = 110 + 60 * np.exp(-tt / 0.03)
save("stamp", np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt / 0.08) * np.minimum(1, tt / 0.002))
