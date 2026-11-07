#!/usr/bin/env python3
"""Уютная Lo-Fi / Jazz-hop музыкальная тема Гостиной.
Синтез тёплого электропианино (Rhodes), контрабаса и акустической калимбы без внешних семплов.
Запуск: python tools/make_music.py → 09_game/audio/livingroom.ogg
"""
import math, os, subprocess, tempfile, wave
import numpy as np

SR = 44100
BPM = 70.0
BEAT = 60.0 / BPM
BARS = 8
N = round(BARS * 4 * BEAT * SR)
out = np.zeros((N, 2), dtype=np.float64)
rng = np.random.default_rng(42)


def hz(midi):
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def rhodes_key(note, start_beat, duration, velocity, pan):
    """Тёплый звук Rhodes: фундаментальная частота + колокольный обертон + мягкий тремоло."""
    count = round(duration * SR)
    t = np.arange(count, dtype=np.float64) / SR
    f0 = hz(note)

    # Основа и обертоны Rhodes
    env_body = np.exp(-1.4 * t)
    env_bell = np.exp(-4.8 * t)
    tremolo = 1.0 + 0.08 * np.sin(2.0 * np.pi * 4.5 * t)

    sig = (
        np.sin(2.0 * np.pi * f0 * t) * env_body * 1.0
        + 0.40 * np.sin(2.0 * np.pi * f0 * 2.0 * t) * env_body * 0.7
        + 0.22 * np.sin(2.0 * np.pi * f0 * 3.01 * t) * env_bell
        + 0.08 * np.sin(2.0 * np.pi * f0 * 4.0 * t) * env_bell
    ) * tremolo

    # Мягкая атака и затухание
    attack_samples = int(0.015 * SR)
    release_samples = int(0.12 * SR)
    if count > attack_samples:
        sig[:attack_samples] *= np.linspace(0.0, 1.0, attack_samples)
    if count > release_samples:
        sig[-release_samples:] *= np.linspace(1.0, 0.0, release_samples)

    idx = (round(start_beat * BEAT * SR) + np.arange(count)) % N
    gain = velocity * 0.14
    out[idx, 0] += gain * sig * math.sqrt(max(0.0, (1.0 - pan) / 2.0))
    out[idx, 1] += gain * sig * math.sqrt(max(0.0, (1.0 + pan) / 2.0))


def bass_note(note, start_beat, duration, velocity):
    """Мягкий глубокий акустический бас."""
    count = round(duration * SR)
    t = np.arange(count, dtype=np.float64) / SR
    f0 = hz(note)

    env = np.exp(-2.2 * t)
    sig = (
        np.sin(2.0 * np.pi * f0 * t) * 1.0
        + 0.55 * np.sin(2.0 * np.pi * f0 * 2.0 * t) * 0.7
        + 0.18 * np.sin(2.0 * np.pi * f0 * 3.0 * t) * 0.4
    ) * env

    attack_samples = int(0.02 * SR)
    if count > attack_samples:
        sig[:attack_samples] *= np.linspace(0.0, 1.0, attack_samples)

    idx = (round(start_beat * BEAT * SR) + np.arange(count)) % N
    gain = velocity * 0.22
    out[idx, 0] += gain * sig * 0.7
    out[idx, 1] += gain * sig * 0.7


def kalimba_lead(note, start_beat, duration, velocity, pan):
    """Прозрачная калимба/колокольчик для мелодических штрихов."""
    count = round(duration * SR)
    t = np.arange(count, dtype=np.float64) / SR
    f0 = hz(note)

    env = np.exp(-3.5 * t)
    vibe = 1.0 + 0.005 * np.sin(2.0 * np.pi * 5.0 * t)
    sig = (
        np.sin(2.0 * np.pi * f0 * vibe * t)
        + 0.25 * np.sin(2.0 * np.pi * f0 * 2.76 * t) * np.exp(-8.0 * t)
        + 0.10 * np.sin(2.0 * np.pi * f0 * 5.4 * t) * np.exp(-12.0 * t)
    ) * env

    idx = (round(start_beat * BEAT * SR) + np.arange(count)) % N
    gain = velocity * 0.10
    out[idx, 0] += gain * sig * math.sqrt(max(0.0, (1.0 - pan) / 2.0))
    out[idx, 1] += gain * sig * math.sqrt(max(0.0, (1.0 + pan) / 2.0))


# Аккордовая сетка (Jazz-hop / Lo-Fi):
# Cmaj9 -> Am9 -> Dm9 -> G13 -> Em7 -> A7alt -> Dm7 -> Fmaj7/G
progression = [
    # (бас, [аккорд])
    (36, [48, 55, 59, 62, 64]),       # Cmaj9
    (33, [45, 52, 55, 60, 62]),       # Am9
    (38, [45, 50, 53, 57, 60]),       # Dm9
    (31, [43, 50, 53, 57, 59]),       # G13
    (40, [47, 52, 55, 59, 62]),       # Em7
    (33, [45, 52, 55, 58, 61]),       # A7alt
    (38, [45, 50, 53, 57, 60]),       # Dm9
    (31, [43, 48, 53, 57, 60]),       # Fmaj7/G
]

for bar, (bass, chord) in enumerate(progression):
    b0 = bar * 4.0
    # Бас на 1 и 3 доли
    bass_note(bass, b0 + 0.0, 2.2, 0.95)
    bass_note(bass + (7 if bar % 2 == 0 else 5), b0 + 2.5, 1.4, 0.75)

    # Аккорд: арпеджированный с лёгким свингом
    for i, n in enumerate(chord):
        pan = -0.35 + (i / max(1, len(chord) - 1)) * 0.70
        rhodes_key(n, b0 + (i * 0.04), 3.2, 0.75 + 0.1 * (i % 2), pan)
        # Лёгкий синкопированный повтор на доле 2.5
        if i >= 2:
            rhodes_key(n, b0 + 2.5 + (i * 0.02), 1.6, 0.50, pan)

# Мелодический рисунок калимбы (акценты и воздух)
melody = [
    (71, 0.5, 1.5), (74, 1.5, 1.2), (76, 2.5, 2.0),
    (79, 4.5, 1.2), (76, 5.5, 1.0), (74, 6.5, 2.0),
    (72, 8.5, 1.5), (76, 9.5, 1.2), (77, 10.5, 2.2),
    (79, 12.5, 1.2), (76, 13.5, 1.0), (74, 14.5, 2.0),
    (76, 16.5, 1.5), (79, 17.5, 1.2), (81, 18.5, 2.2),
    (83, 20.5, 1.2), (81, 21.5, 1.0), (79, 22.5, 2.0),
    (77, 24.5, 1.5), (76, 25.5, 1.2), (72, 26.5, 2.0),
    (74, 28.5, 1.8), (71, 30.0, 2.4),
]

for note, beat_pos, dur in melody:
    kalimba_lead(note, beat_pos, dur, 0.85, 0.25 if beat_pos % 2 == 0 else -0.25)

# Лёгкий аналоговый шум / текстура винила для уюта
vinyl = rng.standard_normal(N) * 0.003
out[:, 0] += vinyl
out[:, 1] += vinyl

# Мастеринг: нормализация и защита от клиппинга
peak = np.max(np.abs(out))
out *= 0.75 / max(peak, 1e-9)
pcm = (np.clip(out, -1.0, 1.0) * 32767).astype('<i2')

target = os.path.join(os.path.dirname(__file__), '..', '09_game', 'audio', 'livingroom.ogg')
with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
    path = tmp.name
try:
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, '-c:a', 'libvorbis', '-q:a', '4', target], check=True)
finally:
    if os.path.exists(path):
        os.remove(path)

print('livingroom.ogg: %.1f с, %.0f КБ, пик %.2f' % (N / SR, os.path.getsize(target) / 1024, np.max(np.abs(out))))
