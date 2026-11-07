"""
Сведение «Язык к качелям» с голосом Сергея (v3): подложка из v2 (ветер + звуки Mixkit) в новом времени + голос.

    python tools/mix_tongue_vo.py

Время ролика новое (под голос; карта старое → новое — knots в ../episodes/tongue_frost/voice/timeline.json,
её пишет tools/voice_tongue.py): все звуки из audio/sfx.json и автоматика ветра (старое время) переводятся по карте;
тиканье часов — на целых секундах нового времени (секундная стрелка на странице считает по новому времени);
мурчание в конце продлено петлёй до конца ролика (финал стал длиннее).
Подложка на BED_DB тише, чем в v2; под голосом ветер приседает ещё на DUCK_WIND, звуки — на DUCK_SFX
(начинает за 0,12 с до строки, отпускает за 0,35 с после; паузы короче 0,6 с не отпускает).
Голос — файлы voice/fast/<id>.wav (темп из timeline.json: v3 ×1,14, v4 ×1,20) с start из timeline.json, без обработки; голос отдельно ≈ VOICE_LUFS.
Мастер: линейное усиление к −16 LUFS, лимитер −2 dBFS (истинный пик ≤ −1,5 dBTP), затухание 0,35 с в конце.
Выход: ../episodes/tongue_frost/audio/mix_vo.wav (48 кГц, стерео) + замеры: итог, голос отдельно, подложка отдельно.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.argv = sys.argv[:1]  # mix_tongue читает сдвиг мастера из argv при импорте
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mix_tongue import dec, lin, auto, loop, lvl, pk, put, r128, SR, FO, EP, TP_LIMIT  # noqa: E402

VO = EP.parent / 'voice'
TARGET = -16.0
VOICE_LUFS = -16.5   # голос отдельно (до мастера)
BED_DB = -4.0        # подложка относительно уровней v2 (там мастер +1 дБ)
DUCK_WIND, DUCK_SFX = -4.0, -5.0   # звуки под голосом ≈ на 8–9 дБ тише голоса (как −9 дБ в finish_mix.py)


def wr(path, x):
    x16 = (np.clip(x, -1, 1) * 32767).astype('<i2')
    w = wave.open(str(path), 'wb'); w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x16.tobytes()); w.close()


def loud(x, name):
    p = EP / f'_{name}.wav'
    sc = max(1.0, np.abs(x).max() / 0.999)  # замер без клипа: масштаб учтём
    wr(p, x / sc); r = r128(p); p.unlink()
    d = 20 * np.log10(sc)
    I, LRA, TP, S, M = r
    return I + d, LRA, TP + d, {k: v + d for k, v in S.items()}, {k: v + d for k, v in M.items()}


def main():
    tl = json.loads((VO / 'timeline.json').read_text(encoding='utf-8'))
    K = np.array(tl['knots'], dtype=float)
    def nt(t): return float(np.interp(t, K[:, 0], K[:, 1]))
    meta = json.loads((EP / 'sfx.json').read_text())
    OLD = meta['dur']; DUR = tl['dur']; NS = int(round(DUR * SR))
    assert abs(K[-1, 0] - OLD) < 1e-6
    def mk(keys): return [(nt(t), v) for t, v in keys]

    # ---- ветер (как в v2, ключи переведены в новое время) ----
    BED_RMS = -28.0
    wet = loop(dec(FO / 'src' / '1175.mp3', ch=2), NS)
    mud = loop(dec(FO / 'src' / '1175.mp3', af='lowpass=f=420,lowpass=f=420', ch=2), NS)
    fzl = np.clip(auto(mk([(0, -120), (8.02, -120), (8.1, 0), (15.25, 0), (15.33, -120), (OLD, -120)]), NS), 0, 1)
    bedw = wet * (1 - fzl) + mud * fzl * lin(4)
    wind = auto(mk([(0, -60), (0.3, 0), (5.42, 0), (5.5, -24), (6.26, -24), (6.36, 0), (8.0, 0), (8.1, -7), (15.25, -7), (15.33, 0),
                    (27.8, 0), (28.35, -60), (OLD, -60)]), NS)
    w0 = 10 * np.log10((wet[: 10 * SR] ** 2).mean() + 1e-12)
    windtrack = bedw * wind * lin(BED_RMS - w0 + 1.0)  # +1 — мастер v2

    # ---- звуки действий (как в v2, время переведено) ----
    cut = {n: dec(FO / f'{n}.wav')[:, 0] for n in ['msg_pop', 'snow_step_a', 'snow_step_b', 'snow_step_c', 'swing_creak', 'key_click', 'key_click2',
                                                  'mouth_blow', 'lip_smack', 'mouth_wet', 'sip', 'ring_marimba', 'purr', 'clock_tick']}
    cut['meow_lp'] = dec(FO / 'meow_small.wav', af='lowpass=f=2200,lowpass=f=2200')[:, 0]
    mono = np.zeros(NS, np.float32)
    rng = np.random.default_rng(7)
    L = {'msg_pop': -21, 'snow_step_a': -19, 'snow_step_b': -19, 'snow_step_c': -23, 'meow_lp': -23, 'swing_creak': -20,
         'mouth_blow': -20, 'lip_smack': -22, 'mouth_wet': -27, 'sip': -21, 'ring_marimba': -20, 'purr': -23}
    P = {'key_click': -11, 'key_click2': -11, 'tap': -8, 'clock_tick': -19}
    CAP = -2.0
    placed = []
    def place(nm, t, extra=0.0, src=None):
        x = cut[src or nm]; g = (L[nm] - lvl(x)) if nm in L else (P[nm] - pk(x))
        g = min(g + extra, CAP - pk(x)) + 1.0  # +1 — мастер v2
        put(mono, x, t, g); placed.append((nm, round(t, 3)))
    steps = ['snow_step_a', 'snow_step_b']; k_step = 0
    for s in sorted(meta['sfx'], key=lambda s: s['t']):
        t, i = s['t'], s['id']; T = nt(t)
        if i == 'notif': place('msg_pop', T - 0.02)
        elif i == 'step':
            nm = 'snow_step_c' if s.get('gain', 0) <= -15 else steps[k_step % 2]; k_step += 1
            place(nm, T - 0.02)
        elif i == 'meow': place('meow_lp', T - 0.02)
        elif i == 'creak': place('swing_creak', T - 0.06)
        elif i == 'typing':
            for j in range(1, 18): place('key_click' if j % 2 else 'key_click2', nt(18.3 + j / 17) - 0.009, rng.uniform(-2, 0))
        elif i == 'tap': place('tap', T - 0.009, src='key_click')
        elif i == 'breath': place('mouth_blow', T - 0.02, rng.uniform(-1, 0))
        elif i == 'release': place('lip_smack', T - 0.02)
        elif i == 'sip': place('sip', T - 0.03)
        elif i == 'rinse': place('mouth_wet', T)
        elif i == 'ring': place('ring_marimba', T)
        elif i == 'purr':
            p = cut['purr'].copy(); f = int(0.3 * SR); p[:f] *= np.linspace(0, 1, f)
            g = min(L['purr'] - lvl(cut['purr']), CAP - pk(p)) + 1.0
            need = int((DUR - T) * SR) + SR // 10
            p = loop(p[:, None], max(need, len(p)), xf=0.6)[:, 0] if need > len(p) else p  # финал длиннее — мурчание до конца
            put(mono, p, T, g); placed.append(('purr', round(T, 3)))
        else: print('нет звука для', i)
    home = nt(28.5)  # дом: с первой целой секунды
    for sec in range(int(np.ceil(home + 0.3)), int(DUR) + 1): place('clock_tick', sec - 0.32, rng.uniform(-1.5, 0))
    sfx = np.repeat(mono[:, None], 2, axis=1)

    # ---- голос ----
    voice = np.zeros(NS, np.float32)
    for ln in tl['lines']:
        x = dec(EP.parent / ln['file'])[:, 0]
        assert ln['start'] + len(x) / SR <= DUR - 0.36, f'{ln["id"]} не влезает до затухания'
        put(voice, x, ln['start'], 0.0)
    vI = loud(np.repeat(voice[:, None], 2, axis=1), 'v')[0]
    voice *= lin(VOICE_LUFS - vI)
    voice2 = np.repeat(voice[:, None], 2, axis=1)

    # ---- приседание подложки под голосом ----
    t = np.arange(NS) / SR
    iv = sorted((ln['start'] - 0.12, ln['end'] + 0.35) for ln in tl['lines'])
    mg = [list(iv[0])]
    for a, b in iv[1:]:
        if a - mg[-1][1] < 0.6: mg[-1][1] = max(mg[-1][1], b)
        else: mg.append([a, b])
    env = np.zeros(NS, np.float32)  # 0 — нет голоса, 1 — голос
    for a, b in mg:
        ia, ib = int(a * SR), int(b * SR)
        env[max(0, ia + int(0.12 * SR)):min(NS, ib - int(0.35 * SR))] = 1
        r = np.arange(max(0, ia), min(NS, ia + int(0.12 * SR))); env[r] = np.maximum(env[r], (r - ia) / (0.12 * SR))
        r = np.arange(max(0, ib - int(0.35 * SR)), min(NS, ib)); env[r] = np.maximum(env[r], (ib - r) / (0.35 * SR))
    env = np.clip(env, 0, 1)[:, None]
    gw = lin(BED_DB + DUCK_WIND * env); gs = lin(BED_DB + DUCK_SFX * env)
    bed = windtrack * gw + sfx * gs
    mix = bed + voice2

    # ---- мастер: усиление к −16 LUFS (с учётом лимитера), лимитер, затухание ----
    raw = EP / '_raw_vo.wav'; out = EP / 'mix_vo.wav'
    sc = max(1.0, np.abs(mix).max() / 0.999); wr(raw, mix / sc)
    g = TARGET - loud(mix, 'm')[0] + 20 * np.log10(sc)
    for it in range(4):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'volume={g:.3f}dB,alimiter=limit={TP_LIMIT}:attack=4:release=60:level=0,'
                        f'afade=t=out:st={DUR - 0.35:.3f}:d=0.35', '-ar', str(SR), '-c:a', 'pcm_s16le', str(out)], check=True)
        I, LRA, TP, S, M = r128(out)
        if abs(I - TARGET) < 0.05: break
        g += TARGET - I
    raw.unlink()
    gm = g - 20 * np.log10(sc)  # усиление мастера к массиву mix
    print(f'новая длина {DUR:.3f} с; пик до лимитера {pk(mix) + gm:.1f} dBFS (лимит {20 * np.log10(TP_LIMIT):.1f}); мастер {gm:+.2f} дБ')
    print(f'ИТОГ mix_vo.wav: I={I:.2f} LUFS, LRA={LRA:.1f} LU, истинный пик {TP:.2f} dBTP')
    vI, _, vTP, vS, vM = loud(voice2 * lin(gm), 'v2')
    bI, _, _, bS, bM = loud(bed * lin(gm), 'b')
    wI, _, _, wS, wM = loud(windtrack * gw * lin(gm), 'w')
    print(f'  голос отдельно I={vI:.1f} LUFS; подложка отдельно I={bI:.1f} LUFS; ветер отдельно I={wI:.1f} LUFS')
    rows = []
    for ln in tl['lines']:
        ks = [k for k in vM if ln['start'] + 0.4 <= k <= ln['end']]
        if not ks: ks = [k for k in vM if ln['start'] <= k <= ln['end'] + 0.4]
        v = np.mean([vM[k] for k in ks]); w = np.mean([wM.get(k, -99) for k in ks]); b = max(bM.get(k, -99) for k in ks)
        rows.append(f'{ln["id"]} голос M≈{v:.1f}, ветер {w:.1f}, подложка макс {b:.1f}')
    print('  под строками (M, LUFS): ' + '; '.join(rows))
    ev = sorted(set((n, tt) for n, tt in placed if n not in ('clock_tick', 'key_click', 'key_click2')), key=lambda e: e[1])
    def mx(Md, tt): return max(Md.get(round(tt + d, 1), -99) for d in (0.1, 0.2, 0.3, 0.4))
    print('  звуки (M подложки / M голоса рядом): ' + ', '.join(f'{n}@{tt:.2f} {mx(bM, tt):.1f}/{mx(vM, tt):.1f}' for n, tt in ev))
    print(f'  тики: {sum(1 for n, _ in placed if n == "clock_tick")} шт. с {min(tt for n, tt in placed if n == "clock_tick") + 0.32:.0f} с')
    json.dump({'dur': DUR, 'I': I, 'LRA': LRA, 'TP': TP, 'master_db': gm, 'voice_I': vI, 'bed_I': bI, 'placed': placed}, open(EP / 'mix_vo.json', 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
