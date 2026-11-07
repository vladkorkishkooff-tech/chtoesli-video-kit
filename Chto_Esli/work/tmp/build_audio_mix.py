import json
import subprocess
from pathlib import Path

BASE_DIR = Path('D:/Chanels/Chto_Esli')
EP_DIR = BASE_DIR / 'chtoesli/episodes/brain100'
VOICE_FAST_DIR = BASE_DIR / 'work/tmp/voice_fast'
FOLEY_DIR = EP_DIR / 'foley'
LIFT_FOLEY_DIR = BASE_DIR / 'chtoesli/episodes/lift_stuck/foley'
STUDIO_FOLEY = BASE_DIR / 'chtoesli/studio/foley'

# Voice cues: (file_path, start_time_sec)
voice_cues = [
    (VOICE_FAST_DIR / 'b01_fast.wav', 1.85),
    (VOICE_FAST_DIR / 'b02_fast.wav', 4.65),
    (VOICE_FAST_DIR / 'b03_fast.wav', 7.55),
    (VOICE_FAST_DIR / 'b04_fast.wav', 10.35),
    (VOICE_FAST_DIR / 'b05_fast.wav', 13.15),
    (VOICE_FAST_DIR / 'b06_fast.wav', 17.55),
    (VOICE_FAST_DIR / 'b07_fast.wav', 20.15),
    (VOICE_FAST_DIR / 'b08_fast.wav', 23.15),
    (VOICE_FAST_DIR / 'b09_fast.wav', 26.55),
]

# Foley cues: (file_path, start_time_sec, volume_dB)
foley_cues = [
    # Ambiance bed
    (FOLEY_DIR / 'room_ambiance.wav', 0.0, -22.0),
    # Hook (0.00s - 1.80s)
    (FOLEY_DIR / 'neural_zap.wav', 0.30, -8.0),
    (FOLEY_DIR / 'switch_lever.wav', 0.85, -6.0),
    (LIFT_FOLEY_DIR / 'lift_jolt.wav', 0.85, -10.0),
    (STUDIO_FOLEY / 'curtain.wav', 1.55, -12.0),
    # Scene 1: Switch
    (FOLEY_DIR / 'switch_lever.wav', 2.50, -8.0),
    # Scene 2: Brain hatch & punch
    (FOLEY_DIR / 'head_hatch.wav', 4.80, -10.0),
    (FOLEY_DIR / 'card_pop.wav', 6.80, -9.0),
    # Scene 3: Walking
    (FOLEY_DIR / 'steps_walk.wav', 7.60, -13.0),
    # Scene 4: Neural Zap
    (FOLEY_DIR / 'neural_zap.wav', 10.35, -9.0),
    (LIFT_FOLEY_DIR / 'lift_jolt.wav', 11.80, -16.0),
    # Scene 5: Dials
    (FOLEY_DIR / 'dial_tick.wav', 13.90, -11.0),
    (FOLEY_DIR / 'dial_tick.wav', 15.30, -11.0),
    # Scene 6: Lamp
    (FOLEY_DIR / 'lamp_click.wav', 17.65, -8.0),
    # Scene 7: Taxi
    (FOLEY_DIR / 'taxi_pass.wav', 20.30, -10.0),
    # Scene 8: Card pops
    (FOLEY_DIR / 'card_pop.wav', 23.90, -10.0),
    (FOLEY_DIR / 'card_pop.wav', 24.65, -10.0),
    (FOLEY_DIR / 'card_pop.wav', 25.40, -10.0),
    # Scene 9: Cat purr
    (FOLEY_DIR / 'cat_purr.wav', 26.80, -13.0),
]

# Build filtergraph
inputs = []
chains = []
idx = 0

voice_labels = []
for fpath, st in voice_cues:
    inputs += ['-i', str(fpath)]
    ms = int(round(st * 1000))
    chains.append(f"[{idx}:a]aresample=48000,adelay={ms}|{ms},apad[v{idx}]")
    voice_labels.append(f"[v{idx}]")
    idx += 1

foley_labels = []
for fpath, st, vol in foley_cues:
    inputs += ['-i', str(fpath)]
    ms = int(round(st * 1000))
    chains.append(f"[{idx}:a]aresample=48000,volume={vol}dB,adelay={ms}|{ms},apad[fx{idx}]")
    foley_labels.append(f"[fx{idx}]")
    idx += 1

num_v = len(voice_cues)
num_fx = len(foley_cues)

v_mix = "".join(voice_labels) + f"amix=inputs={num_v}:normalize=0:duration=longest[voice_mix]"
fx_mix = "".join(foley_labels) + f"amix=inputs={num_fx}:normalize=0:duration=longest[fx_mix_raw]"
# CRAFT.md: Foley placed ~ -9 dB under voice
fx_ducked = "[fx_mix_raw]volume=-6dB[fx_mix]"
final_mix = "[voice_mix][fx_mix]amix=inputs=2:normalize=0:duration=longest[mix]"

filter_graph = ";".join(chains + [v_mix, fx_mix, fx_ducked, final_mix])

dur_str = "31.000"
premix_wav = BASE_DIR / 'work/tmp/brain_fast_premix.wav'

cmd_premix = [
    'ffmpeg', '-v', 'error', '-y',
    *inputs,
    '-filter_complex', filter_graph,
    '-map', '[mix]',
    '-t', dur_str,
    str(premix_wav)
]

print("Rendering premix audio...")
subprocess.run(cmd_premix, check=True)
print(f"Rendered premix: {premix_wav}")

# EBU R128 2-pass Loudnorm:
# Target -16.0 LUFS, True Peak <= -1.5 dBTP (target -1.65 dBTP for AAC compression safety)
TARGET_LUFS = -16.0
TARGET_TP = -1.65

cmd_meas = [
    'ffmpeg', '-hide_banner', '-i', str(premix_wav),
    '-af', f'loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:print_format=json',
    '-f', 'null', '-'
]
res = subprocess.run(cmd_meas, capture_output=True, text=True, errors='replace')
log = res.stderr
js_str = log[log.rindex('{'):log.rindex('}') + 1]
stats = json.loads(js_str)
print(f"Pass 1 measurement: I={stats['input_i']} LUFS, TP={stats['input_tp']} dBTP, LRA={stats['input_lra']}")

norm_af = (
    f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:"
    f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
    f"offset={stats['target_offset']}:linear=true"
)

norm_wav = BASE_DIR / 'work/tmp/brain_fast_norm.wav'
cmd_norm = [
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(premix_wav),
    '-af', norm_af,
    '-ar', '48000',
    str(norm_wav)
]
subprocess.run(cmd_norm, check=True)

# Final stats verification
cmd_check = [
    'ffmpeg', '-hide_banner', '-i', str(norm_wav),
    '-af', f'loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:print_format=json',
    '-f', 'null', '-'
]
res_c = subprocess.run(cmd_check, capture_output=True, text=True, errors='replace')
js_c = json.loads(res_c.stderr[res_c.stderr.rindex('{'):res_c.stderr.rindex('}') + 1])
print(f"Pass 2 normalized: I={js_c['input_i']} LUFS, TP={js_c['input_tp']} dBTP")
