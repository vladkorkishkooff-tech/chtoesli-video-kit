"""
Голос Сергея в «Язык к качелям»: темп голоса, раскладка строк по картинке и «растяжка» времени ролика под голос.

    python tools/voice_tongue.py            # пишет data/tongue_frost.warp.js и ../episodes/tongue_frost/voice/timeline.json

Картинка ролика написана в «старом» времени (41,3 с, без голоса). Здесь строится монотонная кусочно-линейная карта
старое время → новое: голос встаёт на свой визуальный сигнал (карточка, подпись, стоп-кадр), нужные слова — на события
(«слюна» — лёд в лупе, «от» — полоса −5…−15, «горячего/кислого/острого» — зачёркивания, пункты «к врачу»).
Где голосу не хватает времени, растягиваются только «мягкие» куски (статичные карточки, стоп-кадр, взгляд);
«жёсткие» (ходьба, лизание, хват, падение капли, набор, звонок) идут с родной скоростью.
Фон (снег, зерно, хвост кота, пар, пылинки, секундная стрелка, дрожь руки с телефоном) страница считает по новому времени.

v4 (05.11, «слишком длинно, много пустого места; −1000 ауры не озвучивать»): без строк s04 («Минус тысяча ауры») и s11b
(«Плюс пятьсот ауры…») — подписи просто показываются (HOLDS: не короче 1,0 и 1,1 с); темп голоса 1,20; паузы между строками
короче; мягкие куски по умолчанию идут в 1,3 раза быстрее (тянутся, только если голосу нужно); куски без голоса — ходьба
с пузырями, набор, звонок — ускорены (SPEED).
"""
import json, subprocess
from pathlib import Path

ST = Path(__file__).resolve().parent.parent
EP = ST.parent / 'episodes' / 'tongue_frost'
VO = EP / 'voice'
TEMPO = 1.20          # v3: 1,14 (та же строка из прошлого ролика 4,16 с против 3,65 с); v4: 1,20 — ролик короче, речь бодрее (atempo)
OLD_DUR = 41.3
SR = 48000

# строка, источник (папка дубля), визуальный сигнал (старое t), задержка голоса после сигнала, «закончить до» (старое t),
# зазор до этого момента, синхронизация слов: (слово, старое t события, на сколько событие раньше слова)
PLAN = [
    ('s01', VO, 0.35, 0.08, 3.25, 0.05, []),   # после щелчка уведомления (0,35), не поверх «Ч»
    ('s03', VO, 5.60, 0.05, 6.30, 0.05, []),
    # s04 «Минус тысяча ауры» — не озвучивается (v4): подпись «−1000 ауры» 6,5–7,5 просто видна, кадр с котом в родной скорости
    ('s05', VO, 8.05, 0.06, 9.45, 0.05, []),
    ('s06', VO, 9.60, 0.08, 12.40, 0.05, []),
    ('s07', VO, 12.80, 0.06, 15.20, 0.05, [('слюна', 13.30, 0.10)]),
    ('s08', VO, 15.45, 0.05, 18.00, 0.10, [('от', 16.30, 0.10)]),   # с появлением карточки-термометра (15,45)
    ('s10a', VO, 21.00, 0.00, 22.45, 0.08, []),  # чуть раньше смены экрана (21,1) — на нажатии «Найти»
    ('s10b', VO, 22.50, 0.08, 24.40, 0.10, []),
    ('s11a', VO, 24.40, 0.06, 26.95, 0.05, []),
    # s11b «Плюс пятьсот ауры…» — не озвучивается (v4): подпись видна не меньше 1,1 с (HOLDS)
    ('s12a', VO, 28.35, 0.00, 29.95, 0.05, []),
    ('s12b', VO, 30.05, 0.06, 31.45, 0.05, [('горячего', 30.35, 0.05), ('кислого', 30.55, 0.05), ('острого', 30.75, 0.05)]),
    ('s13', VO, 31.60, 0.08, 34.85, 0.05, [('сильно', 32.0, 0.10), ('опух', 32.6, 0.10), ('кровит', 33.2, 0.10), ('трудно', 33.8, 0.10)]),
    ('s15', EP / 'voice_outro' / 'voice', 38.50, 0.05, 41.30, 0.45, []),
]
# жёсткие куски (старое t): скорость 1 (или из SPEED)
RIGID = [(0.30, 0.70), (2.15, 5.60), (6.30, 7.00), (7.00, 7.45), (7.45, 8.35), (9.55, 9.95), (12.35, 12.80), (15.15, 15.80), (16.30, 16.80),
         (18.00, 21.40), (22.50, 22.75), (24.05, 24.50), (25.85, 27.70), (28.45, 28.65),
         (30.35, 30.50), (30.55, 30.70), (30.75, 30.90), (32.0, 32.2), (32.6, 32.8), (33.2, 33.4), (33.8, 34.0), (34.85, 38.40)]
# куски без голоса, которые идут быстрее родного: (старое t0, t1, скорость)
SPEED = [(3.25, 5.45, 1.15),   # подход к качелям с пузырями «Мам, мне 27» / «…а правда прилипнет?» (пузыри ≈0,8 с)
         (18.00, 19.40, 1.5),  # набор «язык прилип к кач»
         (19.90, 21.00, 1.2),  # подсказки уже на экране — до нажатия
         (35.10, 36.05, 1.4),  # звонок: рингтон, тянется к телефону
         (37.50, 38.30, 1.25)]  # хвост пузыря «Не, ты фто»
SOFT0 = 1.3           # мягкие куски по умолчанию быстрее в 1,3 раза; где нужно голосу — растягиваются
# подписи без голоса: не короче (старое t0, t1, новых секунд)
HOLDS = [(6.50, 7.50, 1.0),    # «−1000 ауры»
         (27.25, 28.10, 1.1)]  # «+500 ауры за спокойствие»
MAX_FAST = 1.30       # мягкий кусок можно и ускорить, но не больше чем в 1,3 раза


class Warp:
    def __init__(self, pts):
        self.k = sorted(set([0.0, OLD_DUR] + [round(p, 4) for p in pts]))
        self.el = [not any(r0 - 1e-6 <= a and b <= r1 + 1e-6 for r0, r1 in RIGID) for a, b in zip(self.k, self.k[1:])]
        def sp(a, b, e):
            v = SOFT0 if e else 1.0
            for r0, r1, s in SPEED:
                if r0 - 1e-6 <= a and b <= r1 + 1e-6: v = s
            return v
        self.L = [(b - a) / sp(a, b, e) for (a, b), e in zip(zip(self.k, self.k[1:]), self.el)]   # длина куска в новом времени

    def N(self, t):
        acc = 0.0
        for (a, b), L in zip(zip(self.k, self.k[1:]), self.L):
            if t <= b + 1e-9: return acc + L * (t - a) / (b - a)
            acc += L
        return acc

    def idx(self, a, b):
        return [i for i, (x, y) in enumerate(zip(self.k, self.k[1:])) if x >= a - 1e-9 and y <= b + 1e-9]

    def need(self, a, b, d, why):  # N(b) − N(a) не меньше d
        cur = self.N(b) - self.N(a)
        if cur >= d - 1e-6: return 0.0
        E = [i for i in self.idx(a, b) if self.el[i]]
        if not E: raise SystemExit(f'{why}: нет мягких кусков в {a}–{b}')
        w = sum(self.k[i + 1] - self.k[i] for i in E)
        for i in E: self.L[i] += (d - cur) * (self.k[i + 1] - self.k[i]) / w
        return d - cur

    def fit(self, a, b, d, why):  # N(b) − N(a) ≈ d: растянуть или (если слово раньше события) ужать мягкие куски
        cur = self.N(b) - self.N(a)
        if cur < d: return self.need(a, b, d, why)
        E = [i for i in self.idx(a, b) if self.el[i]]
        extra = cur - d
        for i in E:
            room = self.L[i] - (self.k[i + 1] - self.k[i]) / MAX_FAST
            take = min(room, extra); self.L[i] -= take; extra -= take
            if extra <= 1e-6: break
        return -(cur - d - extra)


def tempo_file(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af', f'atempo={TEMPO}', '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', str(dst)], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(dst)], capture_output=True, text=True).stdout)
    return d


def main():
    pts = [p for r in RIGID for p in r] + [p for r in SPEED for p in r[:2]] + [p for h in HOLDS for p in h[:2]]
    for (_, _, at, _, until, _, syn) in PLAN: pts += [at, until] + [s[1] for s in syn]
    W = Warp(pts)
    out, log = [], []
    for a, b, d in HOLDS:
        ch = W.need(a, b, d, f'подпись {a}–{b}')
        if ch: log.append(f'  подпись {a:.2f}–{b:.2f}: растяжка до {d:.2f} с → +{ch:.2f} с')
    for (lid, src, at, lead, until, gap, syn) in PLAN:
        words = json.loads((src / 'words.json').read_text(encoding='utf-8'))[lid]
        f = VO / 'fast' / f'{lid}.wav'
        dur = tempo_file(src / f'{lid}.wav', f)
        ws = [[w, max(0.0, s) / TEMPO, e / TEMPO] for w, s, e in words['words']]
        S = W.N(at) + lead
        prev = at
        for (word, te, pre) in syn:
            wt = next(w for w in ws if w[0].lower() == word)[1]
            ch = W.fit(prev, te, (S + wt - pre) - W.N(prev), f'{lid}/{word}')
            log.append(f'  {lid}: «{word}» к событию {te:.2f} → {"+" if ch >= 0 else ""}{ch:.2f} с')
            prev = te
        ch = W.need(prev, until, (S + dur + gap) - W.N(prev), f'{lid}/конец')
        if ch: log.append(f'  {lid}: растяжка до {until:.2f} → +{ch:.2f} с')
        out.append({'id': lid, 'text': words['text'], 'file': str(f.relative_to(EP)), 'at_old': at, 'dur': round(dur, 3), 'words': ws})
    # итог: старт строк по готовой карте
    for o, (lid, src, at, lead, *_r) in zip(out, PLAN):
        o['start'] = round(W.N(at) + lead, 3); o['end'] = round(o['start'] + o['dur'], 3)
        o['words'] = [[w, round(o['start'] + s, 3), round(o['start'] + e, 3)] for w, s, e in o['words']]
    knots = [[round(t, 4), round(W.N(t), 4)] for t in W.k]
    dur = knots[-1][1]
    (EP / 'voice' / 'timeline.json').write_text(json.dumps({'tempo': TEMPO, 'old_dur': OLD_DUR, 'dur': round(dur, 3), 'knots': knots, 'lines': out}, ensure_ascii=False, indent=1), encoding='utf-8')
    (ST / 'data').mkdir(exist_ok=True)
    (ST / 'data' / 'tongue_frost.warp.js').write_text('/* создано tools/voice_tongue.py: карта старое время → новое (голос Сергея) */\n'
                                                     f'window.TF_WARP = {json.dumps({"dur": round(dur, 3), "knots": knots})};\n', encoding='utf-8')
    print(f'новая длина {dur:.2f} с (было {OLD_DUR})')
    for o in out: print(f'{o["id"]:>5} {o["start"]:6.2f}–{o["end"]:6.2f}  {o["text"]}')
    print('\n'.join(log))
    for a, b, d in HOLDS: print(f'подпись без голоса {a:.2f}–{b:.2f} (старое) видна {W.N(b) - W.N(a):.2f} с')
    sl = [(a, b, (b - a) / L) for (a, b), L in zip(zip(W.k, W.k[1:]), W.L) if abs((b - a) / L - 1) > 0.02]
    print('скорость картинки ≠ 1 (старое t: скорость):', ', '.join(f'{a:.2f}–{b:.2f}: {s:.2f}' for a, b, s in sl))


if __name__ == '__main__':
    main()
