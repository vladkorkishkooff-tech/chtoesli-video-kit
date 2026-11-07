"""
Тайминги слов озвучки (переносимо): по ним действия в кадре ставятся точно на слово — W(сцена, слово) в странице.

    python tools/word_times_portable.py <папка эпизода>

Вход: <эпизод>/timings.json. Выход: <эпизод>/words.json — {сцена: [[слово, начало, конец], ...]} от старта ролика.
Есть faster-whisper (pip install faster-whisper) — слова распознаются по голосу. Нет голоса или whisper —
слова раскладываются по длине сцены пропорционально числу букв: это ЧЕРНОВИК, перед финалом пересчитай по голосу.
"""
import json
import sys
from pathlib import Path


def spread(line: str, start: float, dur: float) -> list:
    """Слова сцены по её длительности пропорционально длине слова — для чернового монтажа."""
    words = line.split()
    total = sum(len(w) + 1 for w in words) or 1
    out, t = [], start
    for w in words:
        d = dur * 0.9 * (len(w) + 1) / total
        out.append([w, round(t, 2), round(t + d, 2)])
        t += d
    return out


def main(ep: str):
    root = Path(ep)
    tl = json.loads((root / 'timings.json').read_text(encoding='utf-8'))
    model = None
    if all(s.get('file') for s in tl):
        try:
            from faster_whisper import WhisperModel
            model = WhisperModel('small', device='cpu', compute_type='int8')
        except ImportError:
            print('faster-whisper не установлен — слова разложены по длине (черновик)')
    out = {}
    for s in tl:
        if model:
            segs, _ = model.transcribe(str(root / s['file']), language='ru', beam_size=1, word_timestamps=True)
            out[s['id']] = [[w.word.strip(), round(s['start'] + w.start, 2), round(s['start'] + w.end, 2)] for seg in segs for w in seg.words]
        else:
            out[s['id']] = spread(s['line'], s['start'], s['dur'])
    (root / 'words.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    for k, v in out.items():
        print(k, ' '.join(f'{w}@{a}' for w, a, _ in v))


if __name__ == '__main__':
    main(sys.argv[1])
