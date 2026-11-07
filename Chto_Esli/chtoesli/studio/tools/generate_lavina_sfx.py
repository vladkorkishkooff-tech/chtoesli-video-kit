import wave
import numpy as np
from pathlib import Path

SR = 48000
FO = Path('D:/Chanels/Chto_Esli/chtoesli/studio/foley')
rng = np.random.default_rng(42)

def wr(name, x, peak_db=-12.0):
    x = np.asarray(x, float)
    x = x * (10 ** (peak_db / 20) / (abs(x).max() + 1e-12))
    x = np.clip(x, -1, 1)
    w = wave.open(str(FO / name), 'wb')
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
    w.close()
    print(f"Generated {name}: {len(x)/SR:.2f}s, peak {peak_db} dB")

def shape(x, fn):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * fn(f), len(x))

def band(lo, hi, k=1.0):
    def fn(f):
        a = np.clip((f - lo * 0.7) / (lo * 0.6 + 1e-9), 0, 1) if lo > 0 else np.ones_like(f)
        b = np.clip((hi * 1.3 - f) / (hi * 0.6), 0, 1)
        return (0.5 - 0.5 * np.cos(np.pi * a)) * (0.5 - 0.5 * np.cos(np.pi * b)) * k
    return fn

def env(n, pts):
    t = np.arange(n) / SR
    ts, vs = zip(*pts)
    return np.interp(t, ts, vs)

def noise(sec):
    return rng.standard_normal(int(sec * SR))

# 1. Snow Crack & Rupture (0.8s) for hook
n1 = int(1.2 * SR)
t1 = np.arange(n1) / SR
crk_n = shape(noise(1.2), band(1500, 7000)) * env(n1, [(0, 0), (0.01, 1), (0.04, 0.4), (0.12, 0.6), (0.25, 0)])
boom_n = shape(noise(1.2), band(35, 120)) * env(n1, [(0, 0), (0.02, 0.3), (0.08, 1), (0.45, 0.3), (1.1, 0)]) * 1.8
snow_crack = crk_n + boom_n
wr('snow_crack.wav', snow_crack, peak_db=-10.0)

# 2. Avalanche Roar (6.0s) for rushing snow wave (12.5s - 18.5s)
n2 = int(6.0 * SR)
t2 = np.arange(n2) / SR
low_rumble = shape(noise(6.0), band(30, 220)) * env(n2, [(0, 0), (1.0, 0.8), (3.0, 1.0), (5.0, 0.7), (6.0, 0)]) * 1.6
white_spray = shape(noise(6.0), band(300, 2400)) * env(n2, [(0, 0), (0.8, 0.4), (2.5, 0.7), (4.5, 0.4), (6.0, 0)]) * 0.6
avalanche_roar = low_rumble + white_spray
wr('avalanche_roar.wav', avalanche_roar, peak_db=-12.0)

# 3. Snow Lock / Concrete Thud (2.0s) at 26.0s
n3 = int(2.0 * SR)
t3 = np.arange(n3) / SR
thud = np.sin(2 * np.pi * 55 * t3) * np.exp(-t3 / 0.18) + shape(noise(2.0), band(40, 180)) * np.exp(-t3 / 0.35) * 1.2
wr('snow_lock.wav', thud, peak_db=-11.0)

# 4. Avalanche Beacon Beeps (6.0s) for rescue search (36.0s - 42.0s)
# Pings at 457 kHz tone (represented acoustically at ~1150 Hz):
# Starts at 1.0s interval, speeds up to 0.4s interval as rescuer gets close!
n4 = int(6.5 * SR)
beeps = np.zeros(n4)
# Timings of beeps within this 6.5s track:
ping_times = [0.2, 1.3, 2.3, 3.1, 3.8, 4.3, 4.7, 5.1, 5.4, 5.7, 6.0]
pulse_dur = int(0.065 * SR) # 65 ms pulse
t_pulse = np.arange(pulse_dur) / SR
sine_pulse = np.sin(2 * np.pi * 1180 * t_pulse) * (0.5 - 0.5 * np.cos(2 * np.pi * np.linspace(0, 1, pulse_dur)))
harmonic = 0.25 * np.sin(2 * np.pi * 2360 * t_pulse) * (0.5 - 0.5 * np.cos(2 * np.pi * np.linspace(0, 1, pulse_dur)))
single_ping = sine_pulse + harmonic

for pt in ping_times:
    idx = int(pt * SR)
    if idx + pulse_dur < n4:
        beeps[idx:idx+pulse_dur] += single_ping

wr('beeper_ping.wav', beeps, peak_db=-14.0)
