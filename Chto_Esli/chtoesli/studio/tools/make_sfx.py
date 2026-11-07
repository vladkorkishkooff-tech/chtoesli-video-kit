"""Новые звуки для ep_blackout_calm_paper: гул до отключения, ветер, спичка, газ, пробка. Детерминированно (seed)."""
import json, wave
import numpy as np
from pathlib import Path
ST = Path('/data/chtoesli/studio'); FO = ST / 'foley'; SR = 48000
WD = json.loads((ST / 'data/blackout_calm.words.json').read_text(encoding='utf-8'))
norm = lambda w: w.lower().strip('.,:;!?—«»').replace('ё', 'е')
def W(sc, *ws): return next(x[1] for x in WD[sc] if norm(x[0]) in [norm(w) for w in ws])
TL = json.loads((ST / 'data/blackout_calm.timings.json').read_text(encoding='utf-8'))
DUR = TL[-1]['start'] + TL[-1]['dur'] + 1.2
rng = np.random.default_rng(11)

def rd(name):
    w = wave.open(str(FO / name)); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; return x
def wr(name, x, peak_db=-12.0, rms_db=None):
    x = np.asarray(x, float)
    if rms_db is not None: x = x * (10 ** (rms_db / 20) / (np.sqrt((x ** 2).mean()) + 1e-12))
    else: x = x * (10 ** (peak_db / 20) / (abs(x).max() + 1e-12))
    x = np.clip(x, -1, 1); w = wave.open(str(FO / name), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
    print(name, f'{len(x) / SR:.2f} s', f'peak {20 * np.log10(abs(x).max() + 1e-12):.1f} dB', f'rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12):.1f} dB')
def shape(x, fn):   # спектральный фильтр: fn(f) — амплитуда на частоте f
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * fn(f), len(x))
def band(lo, hi, k=1.0):
    def fn(f):
        a = np.clip((f - lo * 0.7) / (lo * 0.6 + 1e-9), 0, 1) if lo > 0 else np.ones_like(f)
        b = np.clip((hi * 1.3 - f) / (hi * 0.6), 0, 1); return (0.5 - 0.5 * np.cos(np.pi * a)) * (0.5 - 0.5 * np.cos(np.pi * b)) * k
    return fn
def env(n, pts):   # кусочно-линейная огибающая по [(t, v)]
    t = np.arange(n) / SR; ts, vs = zip(*pts); return np.interp(t, ts, vs)
def noise(sec): return rng.standard_normal(int(sec * SR))

# 1) гул «электричества» до отключения: петля из fridge_hum, обрыв на гашении нашего окна (wSv1 + 1.3)
CUT = W('s01', 'свет') + 1.3
h = rd('fridge_hum.wav'); a, b = int(0.3 * SR), int(1.45 * SR); seg = h[a:b]; xf = int(0.08 * SR)
out = h[:b].copy()
while len(out) < int((CUT + 0.2) * SR):
    r = np.linspace(0, 1, xf); out[-xf:] = out[-xf:] * (1 - r) + seg[:xf] * r; out = np.concatenate([out, seg[xf:]])
n = int(CUT * SR); out = out[:n + int(0.03 * SR)]
g = np.ones(len(out)); g[:int(0.12 * SR)] = np.linspace(0, 1, int(0.12 * SR)); g[n:] = np.linspace(1, 0, len(out) - n)
wr('hum_cut.wav', out * g, peak_db=-12)
print('  обрыв гула на', round(CUT, 3))

# 2) ветер: бурый шум ниже ~500 Гц + порывы; снаружи громко, в квартире еле слышно, тише после штор; снова громче на кадре дома
wSvet = W('s08', 'свет'); wOkno = W('s07', 'окно')
H2_IN, H2_PAN0, H2_PAN1 = wSvet - 0.2, wSvet + 1.02, wSvet + 2.02
L = int((DUR + 0.3) * SR); x = noise(L / SR)
x = shape(x, lambda f: np.where(f > 25, 1 / np.maximum(f, 25) ** 0.9, 0) * band(0, 520)(f))
howl = shape(noise(L / SR), band(380, 900)) * 0.18
gust_t = np.arange(0, DUR + 3, 1.3); gust_v = 0.55 + 0.45 * rng.random(len(gust_t))
tt = np.arange(L) / SR; gust = np.interp(tt, gust_t, gust_v); k = int(0.6 * SR); gust = np.convolve(gust, np.ones(k) / k, mode='same')
x = x / np.sqrt((x ** 2).mean()); howl = howl / (np.sqrt((howl ** 2).mean()) + 1e-12) * 0.25
wind = (x + howl * (gust - 0.4)) * gust
E = env(L, [(0, 0), (0.35, 1), (2.85, 1), (3.95, 0.22), (wOkno + 0.5, 0.22), (wOkno + 1.05, 0.12), (H2_IN - 0.02, 0.12), (H2_IN + 0.06, 0.8), (H2_PAN0, 0.8), (H2_PAN1, 0.12), (DUR - 1.0, 0.1), (DUR, 0)])
wind = wind * E; wind = wind / np.sqrt((wind[:int(2.8 * SR)] ** 2).mean()) * 10 ** (-22 / 20)
wr('wind.wav', wind, peak_db=None) if False else None
x = np.clip(wind, -1, 1); w = wave.open(str(FO / 'wind.wav'), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
print('wind.wav', f'{L / SR:.2f} s', f'peak {20 * np.log10(abs(x).max()):.1f} dB', 'rms снаружи −22 dB')

# 3) спичка: чирк (скрежет 2–7 кГц) + вспышка «фшш»
n = int(0.75 * SR); t = np.arange(n) / SR
scr = shape(noise(0.75), band(2000, 7000)); gate = (rng.random(n) > 0.55).astype(float); gate = np.convolve(gate, np.ones(40) / 40, mode='same')
s1 = scr * gate * env(n, [(0, 0), (0.005, 1), (0.05, 0.8), (0.085, 0.9), (0.1, 0)])
fl = shape(noise(0.75), band(500, 3000)) * env(n, [(0, 0), (0.07, 0), (0.1, 1), (0.25, 0.45), (0.7, 0)]) * 0.7
bo = shape(noise(0.75), band(60, 320)) * env(n, [(0, 0), (0.08, 0), (0.11, 1), (0.35, 0)]) * 1.2
wr('match.wav', s1 / abs(s1).max() + fl / abs(fl).max() * 0.55 + bo / abs(bo).max() * 0.35, peak_db=-12)

# 4) газ вспыхнул на конфорке: мягкое «пфф» + низкий хлопок
n = int(0.8 * SR)
lo = shape(noise(0.8), band(40, 260)) * env(n, [(0, 0), (0.025, 1), (0.12, 0.5), (0.5, 0)])
hs = shape(noise(0.8), band(1200, 5000)) * env(n, [(0, 0), (0.02, 0.6), (0.2, 0.25), (0.8, 0)])
wr('gas_on.wav', lo / abs(lo).max() + hs / abs(hs).max() * 0.3, peak_db=-13)

# 5) пробка села в слив: глухое «туп» + звяк цепочки
n = int(0.35 * SR); t = np.arange(n) / SR
f = np.interp(t, [0, 0.06], [230, 110]); ph = 2 * np.pi * np.cumsum(f) / SR
thup = np.sin(ph) * np.exp(-t / 0.035) + shape(noise(0.35), band(200, 1500)) * np.exp(-t / 0.006) * 0.4
tink = sum(np.where(t > d, np.sin(2 * np.pi * fr * (t - d)) * np.exp(-np.maximum(t - d, 0) / 0.012) * a, 0) for d, fr, a in [(0.035, 3300, 0.22), (0.075, 4200, 0.16), (0.12, 3700, 0.12)])
wr('plug_plop.wav', thup + tink, peak_db=-13)
json.dump({'CUT': CUT, 'H2_IN': H2_IN, 'H2_PAN0': H2_PAN0, 'H2_PAN1': H2_PAN1, 'DUR': DUR}, open(ST / 'data/blackout_calm.sfx_times.json', 'w'))
