import json
import os
import shutil
import subprocess
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

BASE_DIR = Path('D:/Chanels/Chto_Esli')
VIDEO_IN = BASE_DIR / 'Незаконченные видео/lift_stuck_new_story_preview.mp4'
EP_DIR = BASE_DIR / 'chtoesli/episodes/lift_stuck'
VOICE_DIR = EP_DIR / 'voice'
EP_FOLEY = EP_DIR / 'foley'
ST_FOLEY = BASE_DIR / 'chtoesli/studio/foley'
TMP_DIR = BASE_DIR / 'work/tmp/lift_v1_0_build'
TMP_DIR.mkdir(parents=True, exist_ok=True)

OUT_MASTER_RENDERS = BASE_DIR / 'renders/lift_master_v1_0.mp4'
OUT_MASTER_CHTOESLI = BASE_DIR / 'chtoesli/renders/lift_master_v1_0.mp4'
OUT_MASTER_RENDERS.parent.mkdir(parents=True, exist_ok=True)
OUT_MASTER_CHTOESLI.parent.mkdir(parents=True, exist_ok=True)

TARGET_LUFS = -16.0
TARGET_TP = -1.50
DUR_STR = '38.633'

def run_cmd(cmd, desc=''):
    print(f'--> {desc}')
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if res.returncode != 0:
        raise RuntimeError(f'Command failed ({res.returncode}): {" ".join(str(x) for x in cmd)}\n{res.stderr}')
    return res

def get_loudness_stats(audio_file):
    cmd = [
        'ffmpeg', '-hide_banner', '-i', str(audio_file),
        '-af', f'loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:print_format=json',
        '-f', 'null', '-'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    log = res.stderr
    js_str = log[log.rindex('{'):log.rindex('}') + 1]
    return json.loads(js_str)

print('=== 1. PREPARING AUDIO MIX ===')
voice_cues = [
    (VOICE_DIR / 's01.wav', 0.30),
    (VOICE_DIR / 's02.wav', 5.40),
    (VOICE_DIR / 's03.wav', 10.60),
    (VOICE_DIR / 's04.wav', 15.10),
    (VOICE_DIR / 's05.wav', 21.25),
    (VOICE_DIR / 's06.wav', 25.90),
    (VOICE_DIR / 's07.wav', 30.80),
    (VOICE_DIR / 's08.wav', 34.70),
]

# Transient-aligned foley cues:
# - switch_click peak at +0.063s -> start at 11.35 - 0.063 = 11.287s -> peak exactly at 11.35s
# - clock_tick peak at +0.368s -> start at t - 0.368s -> peaks exactly at 21.5s, 23.9s, 26.0s, 28.0s
# - cloth rustle peak at +0.627s -> start at 20.6s -> rustle during hero settling
# - curtain peak at +0.427s -> start at 34.8s -> curtain whoosh at 35.2s
foley_cues = [
    (EP_FOLEY / 'lift_hum.wav', 0.0, -18.0),
    (EP_FOLEY / 'lift_jolt.wav', 0.8, -6.0),
    (ST_FOLEY / 'switch_click.wav', 11.287, 0.0),
    (EP_FOLEY / 'dispatcher_bell.wav', 12.2, -6.0),
    (EP_FOLEY / 'intercom_connect.wav', 14.8, -8.0),
    (ST_FOLEY / 'cloth.wav', 20.6, 0.0),
    (ST_FOLEY / 'clock_tick.wav', 21.132, 2.0),
    (ST_FOLEY / 'clock_tick.wav', 23.532, 2.0),
    (ST_FOLEY / 'clock_tick.wav', 25.632, 2.0),
    (ST_FOLEY / 'clock_tick.wav', 27.632, 2.0),
    (EP_FOLEY / 'door_open_servo.wav', 31.8, -5.0),
    (ST_FOLEY / 'curtain.wav', 34.8, 0.0),
]

inputs, chains = [], []
idx = 0
voice_labels = []
for p, st in voice_cues:
    inputs += ['-i', str(p)]
    ms = int(round(st * 1000))
    chains.append(f'[{idx}:a]aresample=48000,adelay={ms}|{ms},apad[v{idx}]')
    voice_labels.append(f'[v{idx}]')
    idx += 1

foley_labels = []
for p, st, vol in foley_cues:
    inputs += ['-i', str(p)]
    ms = int(round(st * 1000))
    chains.append(f'[{idx}:a]aresample=48000,volume={vol}dB,adelay={ms}|{ms},apad[fx{idx}]')
    foley_labels.append(f'[fx{idx}]')
    idx += 1

num_v = len(voice_cues)
num_fx = len(foley_cues)
v_mix = ''.join(voice_labels) + f'amix=inputs={num_v}:normalize=0:duration=longest[voice_mix]'
fx_mix = ''.join(foley_labels) + f'amix=inputs={num_fx}:normalize=0:duration=longest[fx_mix_raw]'
fx_ducked = '[fx_mix_raw]volume=-9dB[fx_mix]'
final_mix = '[voice_mix][fx_mix]amix=inputs=2:normalize=0:duration=longest[mix]'
filter_graph = ';'.join(chains + [v_mix, fx_mix, fx_ducked, final_mix])

premix_wav = TMP_DIR / 'lift_v1_premix.wav'
cmd_premix = [
    'ffmpeg', '-v', 'error', '-y',
    *inputs,
    '-filter_complex', filter_graph,
    '-map', '[mix]',
    '-t', DUR_STR,
    str(premix_wav)
]
run_cmd(cmd_premix, 'Рендер предварительного аудио-микса с выровненными транзиентами')

print('--> Измерение громкости EBU R128 (Pass 1)...')
p1 = get_loudness_stats(premix_wav)
print(f'    Raw stats: I={p1["input_i"]} LUFS, TP={p1["input_tp"]} dBTP, offset={p1["target_offset"]}')

# Fine-tuned target for exact -16.0 LUFS and true peak < -1.50 dBTP
tp_safe = TARGET_TP - 0.15
offset_adj = float(p1["target_offset"]) + 0.12
norm_af = (
    f'loudnorm=I={TARGET_LUFS}:TP={tp_safe:.2f}:LRA=11:'
    f'measured_I={p1["input_i"]}:measured_TP={p1["input_tp"]}:'
    f'measured_LRA={p1["input_lra"]}:measured_thresh={p1["input_thresh"]}:'
    f'offset={offset_adj:.2f}:linear=true'
)

norm_wav = TMP_DIR / 'lift_v1_norm.wav'
cmd_norm = [
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(premix_wav),
    '-af', norm_af,
    '-ar', '48000',
    str(norm_wav)
]
run_cmd(cmd_norm, 'Применение двухпроходной нормализации EBU R128')
p2 = get_loudness_stats(norm_wav)
print(f'    Результат WAV: I={p2["input_i"]} LUFS, TP={p2["input_tp"]} dBTP')

print('=== 2. DYNAMIC INK WIPE ON FRAMES 449-455 ===')
run_cmd([
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(VIDEO_IN),
    '-vf', r'select=between(n\,449\,456)',
    '-fps_mode', 'passthrough',
    '-start_number', '449',
    str(TMP_DIR / 'raw_f_%04d.png')
], 'Извлечение кадров 449-456 за один проход')

im456 = np.array(Image.open(TMP_DIR / 'raw_f_0456.png'))
sub456 = im456[1540:1630, 50:1030]
ink_mask456 = (sub456 < 90).all(axis=-1)

patched_frames_dir = TMP_DIR / 'patched_frames'
patched_frames_dir.mkdir(parents=True, exist_ok=True)

for f in range(449, 456):
    raw_frame_path = TMP_DIR / f'raw_f_{f:04d}.png'
    im_f = np.array(Image.open(raw_frame_path))
    sub_f = im_f[1540:1630, 50:1030]
    
    clay_f = (sub_f[:,:,0]>160)&(sub_f[:,:,1]>80)&(sub_f[:,:,1]<160)&(sub_f[:,:,2]>60)&(sub_f[:,:,2]<140)
    yc, xc = np.where(clay_f)
    strip_patch = np.zeros((90, 980, 4), dtype=np.uint8)
    if len(xc):
        x_tip = xc.max()
        reveal = (np.arange(sub_f.shape[1])[None, :] <= (x_tip - 10)) & ink_mask456
        strip_patch[reveal, :3] = sub456[reveal]
        strip_patch[reveal, 3] = 255
        print(f'    Кадр {f}: открыто {np.sum(reveal)} px текста за кончиком кисти (x<={x_tip - 10})')
    else:
        print(f'    Кадр {f}: кисть не найдена')
    
    Image.fromarray(strip_patch, mode='RGBA').save(patched_frames_dir / f'patch_{f:04d}.png')

print('=== 3. RENDERING MASTER MP4 WITH DYNAMIC PATCH ===')
vf = (
    '[1:v]setpts=PTS-STARTPTS+(449/30)/TB[patch];'
    '[0:v][patch]overlay=50:1540:enable=\'between(n,449,455)\'[v]'
)

cmd_master = [
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(VIDEO_IN),
    '-framerate', '30', '-start_number', '449', '-i', str(patched_frames_dir / 'patch_%04d.png'),
    '-i', str(norm_wav),
    '-filter_complex', vf,
    '-map', '[v]',
    '-map', '2:a',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart',
    '-t', DUR_STR,
    str(OUT_MASTER_RENDERS)
]
run_cmd(cmd_master, 'Рендер финального мастер-файла lift_master_v1_0.mp4')

shutil.copy2(OUT_MASTER_RENDERS, OUT_MASTER_CHTOESLI)
shutil.copy2(OUT_MASTER_RENDERS, BASE_DIR / 'renders/lift_stuck_master.mp4')
shutil.copy2(OUT_MASTER_RENDERS, BASE_DIR / 'chtoesli/renders/lift_stuck_master.mp4')
print(f'Мастер сохранен: {OUT_MASTER_RENDERS}')
print(f'Копия сохранена: {OUT_MASTER_CHTOESLI}')
print(f'Копия сохранена: {BASE_DIR / "renders/lift_stuck_master.mp4"}')
print(f'Копия сохранена: {BASE_DIR / "chtoesli/renders/lift_stuck_master.mp4"}')

print('=== 4. GENERATING CRISP 1080x1920 COVER ===')
cover_src_path = BASE_DIR / 'work/tmp/cover_lift_orig_768x1376.jpg'
if not cover_src_path.exists():
    cover_src_path = BASE_DIR / 'chtoesli/branding/cover_lift_9x16.jpg'
cover_src = Image.open(cover_src_path)

target_w, target_h = 1080, 1920
scale = max(target_w / cover_src.width, target_h / cover_src.height)
new_w = int(round(cover_src.width * scale))
new_h = int(round(cover_src.height * scale))
resized = cover_src.resize((new_w, new_h), Image.Resampling.LANCZOS)

left = (new_w - target_w) // 2
top = (new_h - target_h) // 2
cropped = resized.crop((left, top, left + target_w, top + target_h))
crisp_cover = cropped.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=3))

cover_destinations = [
    BASE_DIR / 'chtoesli/branding/cover_lift_9x16.jpg',
    BASE_DIR / 'chtoesli/renders/cover_lift_9x16.jpg',
    BASE_DIR / 'renders/cover_lift_9x16.jpg',
]
for dst in cover_destinations:
    dst.parent.mkdir(parents=True, exist_ok=True)
    crisp_cover.save(dst, quality=95)
    print(f'Обложка 1080x1920 сохранена: {dst}')

print('=== 5. AUDIT & QUALITY METRICS ===')
final_stats = get_loudness_stats(OUT_MASTER_RENDERS)
print(f'Интегральная громкость: {final_stats["input_i"]} LUFS')
print(f'True Peak: {final_stats["input_tp"]} dBTP')
print(f'LRA: {final_stats["input_lra"]} LU')

probe_cmd = ['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(OUT_MASTER_RENDERS)]
probe_res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
p_info = json.loads(probe_res.stdout)
for st in p_info['streams']:
    if st['codec_type'] == 'video':
        print(f'Видео: {st["codec_name"]}, {st["width"]}x{st["height"]}, fps={st["r_frame_rate"]}, frames={st.get("nb_frames", "N/A")}')
    elif st['codec_type'] == 'audio':
        print(f'Аудио: {st["codec_name"]}, {st["sample_rate"]} Hz, channels={st["channels"]}')

print('=== 6. AUTOMATED VERIFICATION ===')
verify_frames_dir = TMP_DIR / 'verify_frames'
verify_frames_dir.mkdir(parents=True, exist_ok=True)
run_cmd([
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(OUT_MASTER_RENDERS),
    '-vf', r'select=between(n\,448\,458)',
    '-fps_mode', 'passthrough',
    '-start_number', '448',
    str(verify_frames_dir / 'f_%04d.png')
], 'Извлечение кадров 448..458 для верификации плавности')

vf_arr = {}
for f in range(448, 459):
    fp = verify_frames_dir / f'f_{f:04d}.png'
    if fp.exists():
        vf_arr[f] = np.array(Image.open(fp), dtype=float)

for f in range(448, 458):
    if f in vf_arr and f + 1 in vf_arr:
        d = float(np.abs(vf_arr[f + 1] - vf_arr[f]).mean())
        print(f'Кадр {f} -> {f+1}: mean diff = {d:.4f}')
        if d <= 0.4:
            raise AssertionError(f'Frame diff too small (freeze/duplicate): {f}->{f+1} = {d:.4f} <= 0.4')

# Loudness assertion: I = -16.0 +- 0.5 LUFS, TP < -1.50 dBTP
i_lufs = float(final_stats["input_i"])
tp_val = float(final_stats["input_tp"])
assert abs(i_lufs - (-16.0)) <= 0.5, f'Loudness I={i_lufs} not within -16.0 +- 0.5'
assert tp_val < -1.50, f'True Peak {tp_val} >= -1.50 dBTP'
print(f'Громкость подтверждена: I={i_lufs} LUFS (норма: -16.0 +- 0.5), TP={tp_val} dBTP (норма: < -1.50)')

print('=== 100/100 PRODUCTION COMPLETE ===')
