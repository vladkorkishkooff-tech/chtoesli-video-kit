import json
import subprocess
import os
from pathlib import Path

video_in = 'D:/Chanels/Chto_Esli/chtoesli/renders/lavina_clean_visual.mp4'
timings_path = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/timings.json'
ep_dir = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina'
foley_dir = 'D:/Chanels/Chto_Esli/chtoesli/studio/foley'
out_mp4 = 'D:/Chanels/Chto_Esli/chtoesli/renders/chtoesli_lavina_v2_1.mp4'
premix_wav = 'D:/Chanels/Chto_Esli/work/tmp/lavina_v2_1_premix.wav'

os.makedirs('D:/Chanels/Chto_Esli/work/tmp', exist_ok=True)
os.makedirs(os.path.dirname(out_mp4), exist_ok=True)

tl = json.loads(Path(timings_path).read_text(encoding='utf-8'))

# Inputs:
# 0..7: 8 voice tracks
# 8: wind.wav
# 9: curtain.wav
ins = []
for s in tl:
    ins += ['-i', str(Path(ep_dir) / s['file'])]

wind_path = os.path.join(foley_dir, 'wind.wav')
curtain_path = os.path.join(foley_dir, 'curtain.wav')
ins += ['-i', wind_path]
ins += ['-i', curtain_path]

# Chains
chains = []
for i, s in enumerate(tl):
    ms = int(round(s['start'] * 1000))
    chains.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms},apad[v{i}]')

voice_inputs = ''.join(f'[v{i}]' for i in range(len(tl)))
chains.append(f'{voice_inputs}amix=inputs={len(tl)}:normalize=0:duration=longest[vo]')

# Wind: fade out at 42.5s over 1s, volume -22dB
chains.append('[8:a]aresample=48000,volume=-22dB,afade=t=out:st=42.5:d=1.0,atrim=0:43.5[wind]')

# Curtain: delay to 45.3s (45300ms), volume -14dB
chains.append('[9:a]aresample=48000,adelay=45300|45300,volume=-14dB,apad[curt]')

# Mix voices + wind + curtain
chains.append('[vo][wind][curt]amix=inputs=3:normalize=0:duration=first[fullmix]')

graph = ';'.join(chains)

dur_str = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video_in], capture_output=True, text=True).stdout.strip()
dur = float(dur_str)
print(f"Target duration: {dur:.3f}s")

print("Rendering premix WAV...")
cmd_premix = [
    'ffmpeg', '-y', '-v', 'error',
    *ins,
    '-filter_complex', graph,
    '-map', '[fullmix]',
    '-t', str(dur),
    premix_wav
]
subprocess.run(cmd_premix, check=True)
print("Premix rendered.")

# Measure loudnorm
def loudnorm_pass(args):
    log = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    return json.loads(log[log.rindex('{'):log.rindex('}') + 1])

m = loudnorm_pass(['ffmpeg', '-hide_banner', '-i', premix_wav, '-af', 'loudnorm=I=-16.0:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
print(f"Measured I={m['input_i']}, TP={m['input_tp']}, LRA={m['input_lra']}")

af = f'loudnorm=I=-16.0:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true'

print("Muxing final video and mastering audio...")
cmd_mux = [
    'ffmpeg', '-y', '-v', 'error',
    '-i', video_in,
    '-i', premix_wav,
    '-map', '0:v',
    '-map', '1:a',
    '-c:v', 'copy',
    '-af', af,
    '-ar', '48000',
    '-c:a', 'aac',
    '-b:a', '192k',
    out_mp4
]
subprocess.run(cmd_mux, check=True)
if os.path.exists(premix_wav):
    os.remove(premix_wav)

# Final check
final_m = loudnorm_pass(['ffmpeg', '-hide_banner', '-i', out_mp4, '-vn', '-af', 'loudnorm=I=-16.0:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
print(f"Final master: {out_mp4}")
print(f"LUFS: {final_m['input_i']}, True Peak: {final_m['input_tp']} dBTP")
