"""
Сведение звука «Язык к качелям» (без голоса и музыки, только настоящие записи Mixkit):
ветер-подложка с автоматикой (тишина на контакте, глухой ветер на «стоп-кадре», уход в белое) +
звуки действий из window.__sfx + тиканье часов дома.

    python tools/mix_tongue.py [сдвиг_мастера_дБ]   # по умолчанию +1

Уровни заданы в итоговых величинах: ветер на дворе RMS −28 dBFS (≈ −25 LUFS), звуки действий — RMS громкого окна 400 мс
около −19…−24 dBFS, пик каждого звука не выше −2 dBFS; лимитер −2 dBFS страхует истинный пик ≤ −1,5 dBTP.

Вход: episodes/tongue_frost/audio/sfx.json (node tools/sfx_dump.cjs), foley/*.wav (python tools/foley.py <имена>),
      foley/src/1175.mp3 (Mixkit «Winter wind loop»).
Выход: episodes/tongue_frost/audio/mix.wav (48 кГц, стерео) + замеры EBU R128.
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

ST = Path(__file__).resolve().parent.parent
FO = ST / 'foley'
EP = ST.parent / 'episodes' / 'tongue_frost' / 'audio'
SR = 48000
MASTER = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
TP_LIMIT = 0.79  # −2 dBFS по сэмплам → истинный пик ≈ −1.5 dBTP и ниже


def dec(path, af=None, ch=1):
    cmd = ['ffmpeg', '-v', 'error', '-i', str(path)] + (['-af', af] if af else []) + ['-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()
    return x.reshape(-1, ch)


def lin(v):
    return 10 ** (v / 20)


def auto(keys, n):  # [(t, дБ)] → усиление по сэмплам, линейно в дБ
    k = np.array(keys, dtype=float)
    return lin(np.interp(np.arange(n) / SR, k[:, 0], k[:, 1])).astype(np.float32)[:, None]


def loop(x, n, xf=1.5):  # петля с равномощной склейкой
    L, f = len(x), int(xf * SR)
    out = np.zeros((n, x.shape[1]), np.float32)
    fi = np.sin(np.linspace(0, np.pi / 2, f, dtype=np.float32))[:, None]
    fo = np.cos(np.linspace(0, np.pi / 2, f, dtype=np.float32))[:, None]
    pos, first = 0, True
    while pos < n:
        a = x.copy()
        if not first: a[:f] *= fi
        a[-f:] *= fo
        m = min(L, n - pos); out[pos:pos + m] += a[:m]
        pos += L - f; first = False
    return out


def lvl(x, win=0.4):  # «моментальный» уровень: RMS самого громкого окна 400 мс, дБFS
    n = int(win * SR)
    if len(x) <= n: return 10 * np.log10((x ** 2).mean() + 1e-12)
    c = np.concatenate([[0], np.cumsum(x.astype(np.float64) ** 2)])
    return 10 * np.log10(((c[n:] - c[:-n]) / n).max() + 1e-12)


def pk(x):
    return 20 * np.log10(np.abs(x).max() + 1e-12)


def put(buf, x, t, g_db):
    i = int(round(t * SR)); x = x * lin(g_db)
    if i < 0: x, i = x[-i:], 0
    m = min(len(x), len(buf) - i)
    if m > 0: buf[i:i + m] += x[:m]


def r128(path):
    log = subprocess.run(['ffmpeg', '-nostats', '-loglevel', 'verbose', '-i', str(path), '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'],
                         capture_output=True, text=True, errors='replace').stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1]); LRA = float(re.findall(r'LRA:\s+(-?[\d.]+) LU', log)[-1])
    TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', log)[-1])
    frames = re.findall(r't:\s*([\d.]+)\s+TARGET:\S+ LUFS\s+M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)', log)
    S = {round(float(t), 1): (float(s) if s != '-inf' else -99.0) for t, m, s in frames}
    M = {round(float(t), 1): (float(m) if m != '-inf' else -99.0) for t, m, s in frames}
    return I, LRA, TP, S, M


def main():
    meta = json.loads((EP / 'sfx.json').read_text())
    DUR = meta['dur']; N = int(DUR * SR)
    mix = np.zeros((N, 2), np.float32)

    # ---- ветер: сухой и глухой (стоп-кадр), автоматика громкости ----
    BED_RMS = -28.0  # ветер на дворе, дБFS RMS (фон, на ~8–10 дБ тише звуков действий)
    wet = loop(dec(FO / 'src' / '1175.mp3', ch=2), N)
    mud = loop(dec(FO / 'src' / '1175.mp3', af='lowpass=f=420,lowpass=f=420', ch=2), N)
    fz = auto([(0, -120), (8.02, -120), (8.1, 0), (15.25, 0), (15.33, -120), (DUR, -120)], N)  # доля глухого ветра
    fzl = np.clip(fz, 0, 1)
    bed = wet * (1 - fzl) + mud * fzl * lin(4)  # глухой — громче по сэмплам, иначе пропадает
    wind = auto([(0, -60), (0.3, 0), (5.42, 0), (5.5, -24), (6.26, -24), (6.36, 0), (8.0, 0), (8.1, -7), (15.25, -7), (15.33, 0),
                 (27.8, 0), (28.35, -60), (DUR, -60)], N)
    w0 = 10 * np.log10((wet[: 10 * SR] ** 2).mean() + 1e-12)
    mix += bed * wind * lin(BED_RMS - w0)

    # ---- звуки действий ----
    cut = {n: dec(FO / f'{n}.wav')[:, 0] for n in ['msg_pop', 'snow_step_a', 'snow_step_b', 'snow_step_c', 'swing_creak', 'key_click', 'key_click2',
                                                  'mouth_blow', 'lip_smack', 'mouth_wet', 'sip', 'ring_marimba', 'purr', 'clock_tick']}
    cut['meow_lp'] = dec(FO / 'meow_small.wav', af='lowpass=f=2200,lowpass=f=2200')[:, 0]  # за стеклом
    mono = np.zeros(N, np.float32)
    rng = np.random.default_rng(7)
    # цель: уровень звука (RMS громкого окна 400 мс, дБFS) — или пик для щелчков; потом общий мастер
    L = {'msg_pop': -21, 'snow_step_a': -19, 'snow_step_b': -19, 'snow_step_c': -23, 'meow_lp': -23, 'swing_creak': -20,
         'mouth_blow': -20, 'lip_smack': -22, 'mouth_wet': -27, 'sip': -21, 'ring_marimba': -20, 'purr': -23}
    P = {'key_click': -11, 'key_click2': -11, 'tap': -8, 'clock_tick': -19}
    CAP = -2.0  # пик любого звука, dBFS
    def place(nm, t, extra=0.0, src=None):
        x = cut[src or nm]; g = (L[nm] - lvl(x)) if nm in L else (P[nm] - pk(x))
        g = min(g + extra, CAP - pk(x))
        put(mono, x, t, g)
    steps = ['snow_step_a', 'snow_step_b']
    k_step = 0
    for s in sorted(meta['sfx'], key=lambda s: s['t']):
        t, i = s['t'], s['id']
        if i == 'notif': place('msg_pop', t - 0.02)
        elif i == 'step':
            nm = 'snow_step_c' if s.get('gain', 0) <= -15 else steps[k_step % 2]; k_step += 1
            place(nm, t - 0.02)
        elif i == 'meow': place('meow_lp', t - 0.02)
        elif i == 'creak': place('swing_creak', t - 0.06)
        elif i == 'typing':
            for j in range(1, 18): place('key_click' if j % 2 else 'key_click2', 18.3 + j / 17 - 0.009, rng.uniform(-2, 0))
        elif i == 'tap': place('tap', t - 0.009, src='key_click')
        elif i == 'breath': place('mouth_blow', t - 0.02, rng.uniform(-1, 0))
        elif i == 'release': place('lip_smack', t - 0.02)
        elif i == 'sip': place('sip', t - 0.03)
        elif i == 'rinse': place('mouth_wet', t)
        elif i == 'ring': place('ring_marimba', t)
        elif i == 'purr':
            p = cut['purr'].copy(); f = int(0.3 * SR); p[:f] *= np.linspace(0, 1, f); cut['purr_f'] = p
            put(mono, p, t, min(L['purr'] - lvl(cut['purr']), CAP - pk(p)))
        else: print('нет звука для', i)
    # часы дома: тик на каждой целой секунде (стрелка шагает так же)
    for sec in range(29, int(DUR) + 1): place('clock_tick', sec - 0.32, rng.uniform(-1.5, 0))
    mix += mono[:, None]

    # ---- мастер: линейное усиление к цели, лимитер −2 dBFS, хвост ----
    EP.mkdir(parents=True, exist_ok=True)
    raw = EP / '_raw.wav'
    def wr(path, x):
        x16 = (np.clip(x, -1, 1) * 32767).astype('<i2')
        import wave
        w = wave.open(str(path), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x16.tobytes()); w.close()
    p0 = np.abs(mix).max()
    wr(raw, mix / max(1.0, p0 / 0.999) if p0 * lin(MASTER) <= 1 else mix)
    g = MASTER if p0 * lin(MASTER) <= 1 else MASTER  # запас считаем ниже
    out = EP / 'mix.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'volume={g:.2f}dB,alimiter=limit={TP_LIMIT}:attack=4:release=60:level=0,afade=t=out:st={DUR - 0.35:.2f}:d=0.35',
                    '-ar', str(SR), '-c:a', 'pcm_s16le', str(out)], check=True)
    raw.unlink()
    print(f'пик до лимитера {20 * np.log10(p0) + g:.1f} dBFS (лимит {20 * np.log10(TP_LIMIT):.1f})')
    I, LRA, TP, S, M = r128(out)
    print(f'ИТОГ: I={I:.1f} LUFS, LRA={LRA:.1f} LU, истинный пик {TP:.1f} dBTP')
    for lbl, tt in [('ветер (двор)', 4.8), ('стоп-кадр', 12.0), ('ветер у трубы', 17.5), ('дом, часы', 34.9), ('мурчание', 40.5)]:
        print(f'  S({tt:>4}) {lbl}: {S.get(round(tt, 1), float("nan")):.1f} LUFS')
    print(f'  M(6.1) тишина на контакте: {M.get(6.1, float("nan")):.1f} LUFS')
    ev = [('уведомление', 0.35), ('шаг', 2.57), ('мяу', 6.5), ('скрип', 7.62), ('набор', 18.8), ('тап', 20.8), ('выдох', 24.5), ('чмок', 27.2), ('глоток', 28.8), ('звонок', 35.4), ('тик', 33.0)]
    print('  M (0,4 с) в моменты звуков: ' + ', '.join(f'{n} {max(M.get(round(t + d, 1), -99) for d in (0.1, 0.2, 0.3, 0.4)):.1f}' for n, t in ev))


if __name__ == '__main__':
    main()
