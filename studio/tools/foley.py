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
    # «Язык к качелям»: Mixkit — Footsteps on the snow 539, Message pop alert 2354, Little cat attention meow 86,
    # Door creak opened by the wind 1163, Typing text on a smartphone 1395, Person's mouth blowing 2661,
    # Sleeping mouth smacking lips 2480, Sip of water 1307, Marimba ringtone 1359, Sphinx cat purr 3091
    'snow_step_a': ('539', 0.13, 0.34, 0.10),
    'snow_step_b': ('539', 0.98, 0.37, 0.12),
    'snow_step_c': ('539', 2.83, 0.30, 0.10),
    'msg_pop': ('2354', 0.03, 0.25, 0.08),
    'meow_small': ('86', 0.06, 0.66, 0.15),
    'swing_creak': ('1163', 1.00, 0.60, 0.20),
    'key_click': ('1395', 0.565, 0.040, 0.010),
    'key_click2': ('1395', 1.865, 0.040, 0.010),
    'mouth_blow': ('2661', 0.08, 1.00, 0.35),
    'lip_smack': ('2480', 0.98, 0.16, 0.05),
    'mouth_wet': ('2480', 1.70, 0.85, 0.25),
    'sip': ('1307', 0.12, 0.68, 0.15),
    'ring_marimba': ('1359', 0.00, 0.80, 0.20),
    'purr': ('3091', 2.95, 2.90, 0.60),
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
    import sys
    only = set(sys.argv[1:])  # можно перечислить имена: python tools/foley.py snow_step_a sip
    for n, c in CUTS.items():
        if not only or n in only:
            cut(n, *c)
