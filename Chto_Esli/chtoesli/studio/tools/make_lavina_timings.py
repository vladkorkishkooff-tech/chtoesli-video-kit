import subprocess, json
from pathlib import Path

ep_voice = Path('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/voice')
tempos = {
    's01': 1.12,
    's02': 1.35,
    's03': 1.10,
    's04': 1.05,
    's05': 1.24,
    's06': 1.30,
    's07': 1.05,
    's08': 1.10
}

for i in range(1, 9):
    sid = f's0{i}'
    inp = ep_voice / f'{sid}.wav'
    out = ep_voice / f'{sid}_fast.wav'
    tempo = tempos[sid]
    cmd = ['ffmpeg', '-y', '-i', str(inp), '-filter:a', f'atempo={tempo}', '-ar', '48000', str(out)]
    subprocess.run(cmd, check=True, capture_output=True)

# Exact on-screen card appearance times from visual scan
starts = [0.30, 8.53, 12.60, 18.70, 26.00, 32.50, 35.40, 43.80]
lines = json.loads((ep_voice / 'lines.json').read_text(encoding='utf-8'))

timings = []
for i, (item, st) in enumerate(zip(lines, starts), start=1):
    f_wav = ep_voice / f's0{i}_fast.wav'
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f_wav)], capture_output=True, text=True).stdout.strip())
    timings.append({
        'id': item['id'],
        'line': item['text'],
        'start': st,
        'dur': round(dur + 0.25, 3),
        'voice': round(dur, 3),
        'file': f'voice/s0{i}_fast.wav'
    })
    end_t = st + dur
    print(f"{item['id']}: start={st:.2f}s, dur={dur:.2f}s, ends={end_t:.2f}s")

out_json = Path('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/timings.json')
out_json.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding='utf-8')
print('timings.json saved successfully')
