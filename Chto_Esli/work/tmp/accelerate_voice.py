import subprocess
from pathlib import Path
import json

BASE_VOICE = Path('chtoesli/episodes/brain100/voice')
OUT_DIR = Path('work/tmp/voice_fast')
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Lines mapping:
# b01: "А если включить мозг на все 100%?" -> use b01.wav with atempo=1.20
# b02: "«Работает только 10%» — это миф." -> b02.wav atempo=1.18
# b03: "Мозг работает весь, но не весь сразу." -> b03.wav atempo=1.18
# b04: "Сильный разряд клеток может вызвать приступ." -> b04.wav atempo=1.18
# b05: "Мозг — 2% массы тела, а энергии тратит 20%." -> b05.wav atempo=1.22
# b06: "Мощность мозга — около 20 ватт." -> b06.wav atempo=1.18
# b07: "Таксисты учат улицы — мозг меняется." -> b07.wav atempo=1.18
# b08: "Поддержи мозг: спи, двигайся, учись." -> b08.wav atempo=1.18
# b09: "Не ищи волшебный рычаг — заботься о мозге." -> b09.wav atempo=1.18

speeds = {
    'b01': ('b01.wav', 1.20),
    'b02': ('b02.wav', 1.18),
    'b03': ('b03.wav', 1.18),
    'b04': ('b04.wav', 1.18),
    'b05': ('b05.wav', 1.22),
    'b06': ('b06.wav', 1.18),
    'b07': ('b07.wav', 1.18),
    'b08': ('b08.wav', 1.18),
    'b09': ('b09.wav', 1.18),
}

results = {}
for lid, (fn, sp) in speeds.items():
    inp = BASE_VOICE / fn
    outp = OUT_DIR / f"{lid}_fast.wav"
    cmd = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(inp),
        '-af', f'atempo={sp}',
        '-ar', '48000',
        str(outp)
    ]
    subprocess.run(cmd, check=True)
    
    # get duration via ffprobe
    res = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(outp)
    ], capture_output=True, text=True)
    dur = float(res.stdout.strip())
    results[lid] = dur
    print(f"{lid}: sp={sp} -> dur={dur:.3f}s")

with open('work/tmp/voice_fast_durs.json', 'w') as f:
    json.dump(results, f, indent=2)
