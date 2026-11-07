"""
Тайминги сцен из готовой озвучки (переносимо, без фабрики): длина каждой сцены = голос + вдох.

    python tools/timings_from_voice.py <папка эпизода>              # голос: <эпизод>/voice/<id>.wav|.mp3
    python tools/timings_from_voice.py <папка эпизода> --estimate   # голоса нет: оценка 16,5 символа/с (черновой просмотр)

Вход: <эпизод>/script.json {"scenes": [{"id", "line"}]}. Выход: <эпизод>/timings.json —
[{id, line, start, dur, voice, file}], тот же формат, что у конвейера. Повторный запуск даёт тот же файл.
"""
import json
import subprocess
import sys
from pathlib import Path

PAD_SEC = 0.35   # вдох после реплики, чтобы склейка не съела последнее слово
SCENE_MIN = 2.0
CPS = 16.5       # скорость диктора для оценки без голоса


def seconds(f: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def layout(takes: list) -> list:
    """takes: [(id, line, seconds, file)] → сцены подряд, длина = голос + вдох, не меньше минимума."""
    out, t = [], 0.0
    for sid, line, sec, file in takes:
        dur = round(max(SCENE_MIN, sec + PAD_SEC), 3)
        out.append({'id': sid, 'line': line, 'start': round(t, 3), 'dur': dur, 'voice': round(sec, 3), 'file': file})
        t += dur
    return out


def main(ep: str, estimate: bool):
    root = Path(ep)
    takes = []
    for s in json.loads((root / 'script.json').read_text(encoding='utf-8'))['scenes']:
        if estimate:
            takes.append((s['id'], s['line'], round(len(s['line']) / CPS, 3), None))
            continue
        found = [f for ext in ('wav', 'mp3') for f in [root / 'voice' / f"{s['id']}.{ext}"] if f.exists()]
        if not found:
            sys.exit(f"нет голоса для {s['id']}: положи voice/{s['id']}.wav или .mp3 (или запусти с --estimate)")
        takes.append((s['id'], s['line'], seconds(found[0]), found[0].relative_to(root).as_posix()))
    tl = layout(takes)
    (root / 'timings.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'итого {tl[-1]["start"] + tl[-1]["dur"]:.1f} с' + (' (оценка без голоса)' if estimate else ''))


if __name__ == '__main__':
    main(sys.argv[1], '--estimate' in sys.argv)
