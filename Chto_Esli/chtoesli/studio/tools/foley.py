"""
Настоящие звуки действий (foley) для страницы: исходник → подрезка, мягкие края, тихий ровный уровень.

    python tools/foley.py

Исходники — foley/src/<id>.mp3 (Mixkit, бесплатная лицензия, коммерция разрешена, без указания автора).
Выход — foley/<имя>.wav, пик −12 dBFS: звук под голосом, не громче. Громкость в ролике дальше задаёт gain в sfx(),
а finish_mix.py кладёт весь SFX ещё на −9 дБ под голос. Повторный запуск даёт те же файлы.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'foley'
PEAK_DB = -12
# имя: (исходник, начало, длина, затухание в конце) — секунды
CUTS = {
    'water_tap': ('1876', 0.3, 2.6, 0.8),
    'plug_pull': ('1808', 0.0, 0.6, 0.2),
    'switch_click': ('2579', 0.0, 0.17, 0.03),
    'fridge_open': ('1861', 0.0, 1.2, 0.4),
    'fridge_close': ('1862', 0.0, 1.2, 0.4),
    'fridge_hum': ('1866', 0.0, 3.0, 1.5),
    'door_close': ('189', 0.6, 1.6, 0.4),
    'cloth': ('1898', 0.0, 0.9, 0.3),
    'curtain': ('1898', 0.2, 1.2, 0.4),
    'mug': ('2933', 0.0, 0.7, 0.2),
    'clock_tick': ('1060', 0.0, 1.0, 0.2),
}


def peak_db(f: Path) -> float:
    log = subprocess.run(['ffmpeg', '-i', str(f), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    return float(log.split('max_volume:')[1].split('dB')[0])


def cut(name: str, src: str, start: float, dur: float, fade: float):
    tmp, out = ROOT / f'_{name}.wav', ROOT / f'{name}.wav'
    af = f'afade=t=in:d=0.01,afade=t=out:st={dur - fade:.3f}:d={fade:.3f}'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(dur), '-i', str(ROOT / 'src' / f'{src}.mp3'), '-af', af, '-ac', '1', '-ar', '48000', str(tmp)], check=True)
    gain = PEAK_DB - peak_db(tmp)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-af', f'volume={gain:.2f}dB', str(out)], check=True)
    tmp.unlink()
    print(f'{name}: {dur} с, {gain:+.1f} дБ')


if __name__ == '__main__':
    for n, c in CUTS.items():
        cut(n, *c)
