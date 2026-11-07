#!/usr/bin/env python3
"""Звуки «Клубка» — синтез с нуля (numpy), без чужих записей и лицензий.
Запуск из папки проекта:  python3 tools/make_sfx.py   → 09_game/audio/*.ogg (нужен ffmpeg с libvorbis).
Каждый звук — функция ниже; меняйте числа и запускайте заново."""
import os, subprocess, tempfile, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "09_game", "audio")
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def band(x, lo=0.0, hi=SR / 2, soft=0.15):
    """Полосовой фильтр через спектр: мягкие края, без звона."""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = np.fft.rfft(x)
    g = np.ones_like(f)
    if lo > 0:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (2 / soft * 0.1 + 2))
    if hi < SR / 2:
        g *= 1 / (1 + (f / hi) ** (2 / soft * 0.1 + 2))
    return np.fft.irfft(X * g, len(x))


def attack(x, ms=3.0):
    n = max(1, int(SR * ms / 1000))
    x = x.copy()
    x[:n] *= np.linspace(0, 1, n)
    return x


def fade_out(x, ms=20.0):
    n = max(1, int(SR * ms / 1000))
    x = x.copy()
    x[-n:] *= np.linspace(1, 0, n)
    return x


def partials(t, spec):
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in spec)


def knock():          # балка, лёгкий деревянный стук
    t = t_axis(0.2)
    x = partials(t, [(380, 1.0, 32), (1010, 0.45, 48), (2300, 0.2, 75)])
    x += 0.5 * band(noise(0.2), 900, 5000) * np.exp(-t * 320)
    return attack(x, 1)


def knock_heavy():    # кубик: тяжёлый стук
    t = t_axis(0.32)
    x = partials(t, [(150, 1.0, 17), (410, 0.6, 26), (980, 0.28, 42)])
    x += 0.7 * band(noise(0.32), 0, 900) * np.exp(-t * 55)
    return attack(x, 1.5)


def thud():           # клубок мягко ударился
    t = t_axis(0.26)
    f = 85 + 70 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 20)
    x += 0.55 * band(noise(0.26), 0, 380) * np.exp(-t * 38)
    return attack(x, 4)


def nail():           # гвоздь: металлический «тинь»
    t = t_axis(0.25)
    x = partials(t, [(2150, 0.8, 30), (3420, 0.5, 38), (5230, 0.3, 50)])
    x += 0.8 * partials(t, [(300, 1.0, 45)])
    return attack(x, 1)


def place():          # деталь встала
    t = t_axis(0.1)
    f = 720 - 220 * (t / t[-1])
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 42)
    x += 0.3 * band(noise(0.1), 1500, 6000) * np.exp(-t * 400)
    return attack(x, 1)


def remove():         # деталь убрали — шорох вверх
    t = t_axis(0.2)
    x = band(noise(0.2), 600, 3500) * np.sin(np.pi * t / t[-1]) ** 2 * 0.8
    f = 300 + 500 * (t / t[-1])
    x += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1])
    return x


def click():          # бумажная кнопка
    t = t_axis(0.06)
    x = 0.6 * np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 130)
    x += 0.6 * band(noise(0.06), 2000, 9000) * np.exp(-t * 650)
    return attack(x, 0.5)


def nope():           # нельзя / не засчитано — глухой двойной тук
    t = t_axis(0.22)
    x = np.zeros_like(t)
    for start in (0.0, 0.09):
        tt = np.clip(t - start, 0, None)
        x += (t >= start) * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt * 38)
    return attack(x, 2)


def tone(t, f, a=1.0):
    return a * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t))


def fail():           # неудача — мягкое «у-у»
    t = t_axis(0.75)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
    x = tone(t, 392 * vib) * np.exp(-t * 3) * np.clip((0.27 - t) / 0.03, 0, 1)
    t2 = np.clip(t - 0.24, 0, None)
    x = x + (t >= 0.24) * tone(t2, 311 * vib) * np.exp(-t2 * 3.2)
    return fade_out(attack(x, 8), 60)


def win():            # победа — арпеджио до-ми-соль-до
    t = t_axis(1.3)
    x = np.zeros_like(t)
    for i, f in enumerate((523.25, 659.25, 783.99, 1046.5)):
        st = i * 0.11
        tt = np.clip(t - st, 0, None)
        x += (t >= st) * tone(tt, f, 0.8) * np.exp(-tt * 3.6)
    return fade_out(attack(x, 3), 80)


def purr():           # мурчание: ~25 толчков в секунду, вдох тише выдоха
    dur = 1.9
    t = t_axis(dur)
    pulses = np.zeros_like(t)
    rate = 25.0
    for k in range(int(dur * rate)):
        c = k / rate + 0.004 * rng.standard_normal()
        pulses += np.exp(-((t - c) / 0.011) ** 2)
    body = band(noise(dur), 30, 420) * pulses
    hum = 0.35 * np.sin(2 * np.pi * 50 * t) * pulses
    inhale = 0.55 * np.clip(np.sin(np.pi * np.clip(t / 0.85, 0, 1)), 0, None) ** 0.7
    exhale = np.clip(np.sin(np.pi * np.clip((t - 0.95) / 0.95, 0, 1)), 0, None) ** 0.7
    breath = np.where(t < 0.85, inhale, exhale)
    return fade_out(attack((body + hum) * breath, 20), 80)


def hiss():           # «Ш-ш!»
    t = t_axis(0.65)
    env = np.minimum(t / 0.03, 1) * np.where(t < 0.3, 1, np.exp(-(t - 0.3) * 9))
    flutter = 1 + 0.15 * np.sin(2 * np.pi * 23 * t)
    return fade_out(band(noise(0.65), 2600, 8500) * env * flutter, 40)


def pogrom():         # «ПОГРОМ!» — удар и звон
    t = t_axis(1.1)
    f = 48 + 60 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    crash = band(noise(1.1), 2500, 9000) * np.exp(-t * 5.5) * 0.5
    thump = band(noise(1.1), 0, 1200) * np.exp(-t * 18) * 0.8
    return fade_out(attack(boom + crash + thump, 2), 100)


# ── v0.5: новые детали (в конце списка — так случайные числа старых звуков не меняются) ──

def boing():          # батут: пружинистое «бойнг» — тон скользит вверх и дрожит
    t = t_axis(0.42)
    f = 150 + 210 * (1 - np.exp(-t * 9)) + 18 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 4)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    x += 0.35 * np.sin(2 * np.pi * np.cumsum(2.01 * f) / SR) * np.exp(-t * 11)
    x += 0.25 * band(noise(0.42), 0, 600) * np.exp(-t * 60)
    return fade_out(attack(x, 2), 40)


def burn():           # нитка перегорела: «пш-ш» с треском
    t = t_axis(0.5)
    hiss = band(noise(0.5), 1800, 7000) * np.exp(-t * 7) * 0.6
    crack = np.zeros_like(t)
    n = int(0.004 * SR)
    for _ in range(9):
        i = int(rng.uniform(0.0, 0.3) * SR)
        crack[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0012 * SR))
    return fade_out(attack(hiss + 0.8 * band(crack, 1500, 9000), 3), 60)


def whoosh():         # фен: поток воздуха нарастает и стихает
    t = t_axis(0.9)
    env = np.sin(np.pi * np.minimum(t / 0.9, 1)) ** 1.5
    x = band(noise(0.9), 300, 2400) * env
    x += 0.4 * band(noise(0.9), 2400, 6000) * env ** 2
    return fade_out(attack(x, 20), 80)


def tick():           # домино: сухой щелчок костяшки
    t = t_axis(0.09)
    x = partials(t, [(1900, 1.0, 90), (3100, 0.6, 120), (4700, 0.3, 160)])
    x += 0.6 * band(noise(0.09), 2500, 9000) * np.exp(-t * 400)
    return attack(x, 0.5)


def plop():           # мандарин: мягкий упругий «шлёп»
    t = t_axis(0.18)
    f = 260 + 180 * np.exp(-t * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)
    x += 0.4 * band(noise(0.18), 200, 2000) * np.exp(-t * 90)
    return attack(x, 2)


SOUNDS = [knock, knock_heavy, thud, nail, place, remove, click, nope, fail, win, purr, hiss, pogrom,
          boing, burn, whoosh, tick, plop]


def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.85
    pcm = (x * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, name + ".ogg")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-c:a", "libvorbis", "-q:a", "4", out], check=True)
    os.remove(path)
    return out


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for fn in SOUNDS:
        p = save(fn.__name__, fn())
        print(f"{os.path.basename(p):18s} {os.path.getsize(p) / 1024:5.1f} КБ")
