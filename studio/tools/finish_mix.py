"""
Сведение ролика «тушь и глина»: картинка и SFX из рендера + голос по таймингам → громкость RULES.md (−16 LUFS).

    python tools/finish_mix.py <рендер.mp4> <timings.json> <папка эпизода> <выход.mp4>

SFX из рендера тише голоса на SFX_DB; голос каждой сцены ставится в её start. Повторный запуск даёт тот же файл.
"""
import json
import subprocess
import sys
from pathlib import Path

SFX_DB = -9
TARGET = -16.0


def loudnorm(args: list) -> dict:
    log = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    return json.loads(log[log.rindex('{'):log.rindex('}') + 1])


def main(render: str, timings: str, ep: str, out: str):
    tl = json.loads(Path(timings).read_text(encoding='utf-8'))
    ins, chains = ['-i', render], []
    for i, s in enumerate(tl, start=1):
        ins += ['-i', str(Path(ep) / s['file'])]
        ms = int(round(s['start'] * 1000))
        chains.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms},apad[v{i}]')
    voices = ''.join(f'[v{i}]' for i in range(1, len(tl) + 1))
    graph = ';'.join(chains) + f';{voices}amix=inputs={len(tl)}:normalize=0:duration=longest[vo];[0:a]aresample=48000,volume={SFX_DB}dB[fx];[vo][fx]amix=inputs=2:normalize=0:duration=first[mix]'
    tmp = Path(out).with_suffix('.premix.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', graph, '-map', '[mix]', '-t', str(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', render], capture_output=True, text=True).stdout)), str(tmp)], check=True)
    m = loudnorm(['ffmpeg', '-hide_banner', '-i', str(tmp), '-af', f'loudnorm=I={TARGET}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    af = f'loudnorm=I={TARGET}:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', render, '-i', str(tmp), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', out], check=True)
    tmp.unlink()
    f = loudnorm(['ffmpeg', '-hide_banner', '-i', out, '-vn', '-af', f'loudnorm=I={TARGET}:print_format=json', '-f', 'null', '-'])
    print(f'{out}: {f["input_i"]} LUFS, true peak {f["input_tp"]} dBTP')


if __name__ == '__main__':
    main(*sys.argv[1:5])
