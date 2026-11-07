import os
import json
import subprocess
import numpy as np
import scipy.io.wavfile as wav
from pathlib import Path

voice_dir = r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina\voice'
foley_dir = r'D:\Chanels\Chto_Esli\chtoesli\studio\foley'
timings_file = r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina\timings.json'
raw_wav = r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina\audio_raw_v2_2.wav'
master_wav = r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina\audio_master_v2_2.wav'

sr = 48000
total_dur = 48.166667
total_samples = int(round(total_dur * sr))

master_buf = np.zeros(total_samples, dtype=np.float64)

with open(timings_file, 'r', encoding='utf-8') as f:
    timings = json.load(f)

def load_wav(path, target_sr=48000):
    rate, data = wav.read(path)
    if data.ndim > 1:
        data = data.mean(axis=1)
    if data.dtype == np.int16:
        data = data.astype(np.float64) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float64) / 2147483648.0
    elif data.dtype == np.float32:
        data = data.astype(np.float64)
    if rate != target_sr:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(rate, target_sr)
        data = resample_poly(data, target_sr // g, rate // g)
    return data

def overlay(buf, snd, start_sec, gain_db=0.0):
    gain = 10.0 ** (gain_db / 20.0)
    idx = int(round(start_sec * sr))
    n = len(snd)
    if idx < 0:
        snd = snd[-idx:]
        idx = 0
        n = len(snd)
    avail = len(buf) - idx
    if avail <= 0:
        return
    k = min(n, avail)
    buf[idx:idx + k] += snd[:k] * gain

print("1. Adding Voice Segments...")
for item in timings:
    v_path = os.path.join(r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina', item['file'])
    data = load_wav(v_path, sr)
    overlay(master_buf, data, item['start'], gain_db=0.0)
    print(f"  + {item['id']} at {item['start']:.2f}s ({len(data)/sr:.2f}s)")

print("2. Adding Foley / Sound Effects...")
# Wind bed across entire video (subtle mountain ambiance)
wind_path = os.path.join(foley_dir, 'wind.wav')
if os.path.exists(wind_path):
    wind_data = load_wav(wind_path, sr)
    while len(wind_data) < total_samples:
        wind_data = np.concatenate([wind_data, wind_data])
    wind_data = wind_data[:total_samples]
    overlay(master_buf, wind_data, 0.0, gain_db=-24.0)
    print("  + Wind ambiance at 0.0s (-24 dB)")

# Snow crack at 0.5s
overlay(master_buf, load_wav(os.path.join(foley_dir, 'snow_crack.wav'), sr), 0.5, gain_db=-12.0)
print("  + Snow crack at 0.5s (-12 dB)")

# Avalanche roar at 12.5s
overlay(master_buf, load_wav(os.path.join(foley_dir, 'avalanche_roar.wav'), sr), 12.5, gain_db=-15.0)
print("  + Avalanche roar at 12.5s (-15 dB)")

# Snow lock at 24.5s
overlay(master_buf, load_wav(os.path.join(foley_dir, 'snow_lock.wav'), sr), 24.5, gain_db=-12.0)
print("  + Snow lock at 24.5s (-12 dB)")

# Beeper ping pulses at 35.8s
overlay(master_buf, load_wav(os.path.join(foley_dir, 'beeper_ping.wav'), sr), 35.8, gain_db=-14.0)
print("  + Beeper pulses at 35.8s (-14 dB)")

# Curtain whoosh at 45.8s
curt_path = os.path.join(foley_dir, 'curtain.wav')
if os.path.exists(curt_path):
    overlay(master_buf, load_wav(curt_path, sr), 45.8, gain_db=-16.0)
    print("  + Curtain whoosh at 45.8s (-16 dB)")

# Save raw mixed audio
out_int16 = np.clip(master_buf * 32767.0, -32768.0, 32767.0).astype(np.int16)
wav.write(raw_wav, sr, out_int16)
print(f"3. Raw Mix Saved: {raw_wav}")

print("4. Two-Pass EBU R128 Loudness Mastering with FFmpeg...")
target_i = -16.0
target_tp = -1.5

cmd1 = [
    'ffmpeg', '-hide_banner', '-i', raw_wav,
    '-af', f'loudnorm=I={target_i}:TP={target_tp}:print_format=json',
    '-f', 'null', '-'
]
res1 = subprocess.run(cmd1, capture_output=True, text=True, encoding='utf-8', errors='replace')
log1 = res1.stderr
js1 = json.loads(log1[log1.rindex('{'):log1.rindex('}') + 1])

tp_lim = target_tp - 0.10
offset = float(js1['target_offset'])
meas_i = js1['input_i']
meas_tp = js1['input_tp']
meas_lra = js1['input_lra']
meas_th = js1['input_thresh']

af = (
    f"loudnorm=I={target_i}:TP={tp_lim:.2f}:LRA=11:"
    f"measured_I={meas_i}:measured_TP={meas_tp}:"
    f"measured_LRA={meas_lra}:measured_thresh={meas_th}:"
    f"offset={offset:.2f}:linear=true"
)

cmd2 = [
    'ffmpeg', '-v', 'error', '-y', '-i', raw_wav,
    '-af', af, '-ar', '48000', master_wav
]
subprocess.run(cmd2, check=True)

# Verification step
cmd3 = [
    'ffmpeg', '-hide_banner', '-i', master_wav,
    '-af', f'loudnorm=I={target_i}:TP={target_tp}:print_format=json',
    '-f', 'null', '-'
]
res3 = subprocess.run(cmd3, capture_output=True, text=True, encoding='utf-8', errors='replace')
log3 = res3.stderr
js3 = json.loads(log3[log3.rindex('{'):log3.rindex('}') + 1])
print(f"Master Audio Verified -> Integrated Loudness: {js3['input_i']} LUFS | True Peak: {js3['input_tp']} dBTP")
