import json
import os
import shutil
import subprocess
import numpy as np
import cv2
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageFont

BASE_DIR = Path('D:/Chanels/Chto_Esli')
VIDEO_IN = BASE_DIR / 'Незаконченные видео/lift_stuck_new_story_preview.mp4'
EP_DIR = BASE_DIR / 'chtoesli/episodes/lift_stuck'
VOICE_DIR = EP_DIR / 'voice'
EP_FOLEY = EP_DIR / 'foley'
ST_FOLEY = BASE_DIR / 'chtoesli/studio/foley'
TONGUE_FOLEY = BASE_DIR / 'tongue_wip_10/studio/foley'
TMP_DIR = BASE_DIR / 'work/tmp/lift_v2_0_build'
TMP_DIR.mkdir(parents=True, exist_ok=True)

OUT_MASTER_V2 = BASE_DIR / 'renders/lift_master_v2_0.mp4'
OUT_MASTER_V1 = BASE_DIR / 'renders/lift_master_v1_0.mp4'
OUT_MASTER_STUCK = BASE_DIR / 'renders/lift_stuck_master.mp4'
OUT_CHTOESLI_V2 = BASE_DIR / 'chtoesli/renders/lift_master_v2_0.mp4'
OUT_CHTOESLI_V1 = BASE_DIR / 'chtoesli/renders/lift_master_v1_0.mp4'
OUT_CHTOESLI_STUCK = BASE_DIR / 'chtoesli/renders/lift_stuck_master.mp4'

for p in [OUT_MASTER_V2, OUT_CHTOESLI_V2]:
    p.parent.mkdir(parents=True, exist_ok=True)

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

print('=== 1. PREPARING ADVANCED AUDIO MIX (V2.0 HIGH-RETENTION) ===')
# Voice cues shifted tighter to visuals - start s01 at 0.08s (no dead 300ms silence!)
voice_cues = [
    (VOICE_DIR / 's01.wav', 0.08),
    (VOICE_DIR / 's02.wav', 5.25),
    (VOICE_DIR / 's03.wav', 10.45),
    (VOICE_DIR / 's04.wav', 14.90),
    (VOICE_DIR / 's05.wav', 21.15),
    (VOICE_DIR / 's06.wav', 25.75),
    (VOICE_DIR / 's07.wav', 30.65),
    (VOICE_DIR / 's08.wav', 34.70),
]

# Upgraded Foley cues:
# - Rich shaft hum throughout (no dead sterile silence)
# - Visceral metallic jolt at 0.48s (+2.0 dB) exactly on brake impact
# - Cable tension creak at 0.72s (-3.0 dB)
# - Secondary settling thump at 1.58s (-4.0 dB)
# - Switch click (+2.0 dB) at 11.287s
# - Dispatcher bell at 12.2s (-3.0 dB)
# - Radio static burst at 14.8s (-6.0 dB)
# - Waiting zone micro-cues at 21.13s, 22.4s, 23.53s, 24.8s, 25.63s, 27.63s, 28.8s
# - Servo door opening at 31.6s
# - Curtain at 34.8s
foley_cues = [
    (EP_FOLEY / 'lift_hum.wav', 0.0, -6.0),
    (EP_FOLEY / 'lift_jolt.wav', 0.48, 2.0),
    (TONGUE_FOLEY / 'swing_creak.wav', 0.72, -3.0),
    (EP_FOLEY / 'lift_jolt.wav', 1.58, -4.0),
    (ST_FOLEY / 'switch_click.wav', 11.287, 2.0),
    (EP_FOLEY / 'dispatcher_bell.wav', 12.2, -3.0),
    (EP_FOLEY / 'intercom_connect.wav', 14.8, -6.0),
    (ST_FOLEY / 'cloth.wav', 20.6, 0.0),
    (ST_FOLEY / 'clock_tick.wav', 21.132, 2.5),
    (TONGUE_FOLEY / 'swing_creak.wav', 22.4, -14.0),
    (ST_FOLEY / 'clock_tick.wav', 23.532, 2.5),
    (ST_FOLEY / 'cloth.wav', 24.8, -6.0),
    (ST_FOLEY / 'clock_tick.wav', 25.632, 2.5),
    (ST_FOLEY / 'clock_tick.wav', 27.632, 2.5),
    (TONGUE_FOLEY / 'swing_creak.wav', 28.8, -16.0),
    (EP_FOLEY / 'door_open_servo.wav', 31.6, 1.0),
    (ST_FOLEY / 'cloth.wav', 32.8, -2.0),
    (ST_FOLEY / 'curtain.wav', 34.8, 1.0),
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
fx_ducked = '[fx_mix_raw]volume=-6dB[fx_mix]'
final_mix = '[voice_mix][fx_mix]amix=inputs=2:normalize=0:duration=longest[mix]'
filter_graph = ';'.join(chains + [v_mix, fx_mix, fx_ducked, final_mix])

premix_wav = TMP_DIR / 'lift_v2_premix.wav'
cmd_premix = [
    'ffmpeg', '-v', 'error', '-y',
    *inputs,
    '-filter_complex', filter_graph,
    '-map', '[mix]',
    '-t', DUR_STR,
    str(premix_wav)
]
run_cmd(cmd_premix, 'Рендер расширенного предварительного аудио-микса V2.0')

print('--> Измерение громкости EBU R128 (Pass 1)...')
p1 = get_loudness_stats(premix_wav)
print(f'    Raw stats: I={p1["input_i"]} LUFS, TP={p1["input_tp"]} dBTP, offset={p1["target_offset"]}')

tp_safe = TARGET_TP - 0.15
offset_adj = float(p1["target_offset"]) + 0.12
norm_af = (
    f'loudnorm=I={TARGET_LUFS}:TP={tp_safe:.2f}:LRA=11:'
    f'measured_I={p1["input_i"]}:measured_TP={p1["input_tp"]}:'
    f'measured_LRA={p1["input_lra"]}:measured_thresh={p1["input_thresh"]}:'
    f'offset={offset_adj:.2f}:linear=true'
)

norm_wav = TMP_DIR / 'lift_v2_norm.wav'
cmd_norm = [
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(premix_wav),
    '-af', norm_af,
    '-ar', '48000',
    str(norm_wav)
]
run_cmd(cmd_norm, 'Применение двухпроходной нормализации EBU R128')
p2 = get_loudness_stats(norm_wav)
print(f'    Результат WAV V2.0: I={p2["input_i"]} LUFS, TP={p2["input_tp"]} dBTP')

print('=== 2. VISCERAL CAMERA JOLT & DYNAMIC INK REVEAL ===')
# Extract frames 14..22 for camera jolt (t=0.467..0.733s)
jolt_dir = TMP_DIR / 'jolt_frames'
jolt_dir.mkdir(parents=True, exist_ok=True)

run_cmd([
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(VIDEO_IN),
    '-vf', r'select=between(n\,14\,22)',
    '-fps_mode', 'passthrough',
    '-start_number', '14',
    str(jolt_dir / 'raw_jolt_%04d.png')
], 'Извлечение кадров 14-22 для камеры-встряски')

# Frame displacement map (vertical jolt with decay)
jolt_offsets = {
    14: 0,
    15: 7,
    16: -9,
    17: 6,
    18: -4,
    19: 2,
    20: -1,
    21: 1,
    22: 0,
}

patched_jolt_dir = TMP_DIR / 'patched_jolt'
patched_jolt_dir.mkdir(parents=True, exist_ok=True)

for f, dy in jolt_offsets.items():
    raw_path = jolt_dir / f'raw_jolt_{f:04d}.png'
    im = cv2.imread(str(raw_path))
    if dy != 0:
        M = np.float32([[1, 0, 0], [0, 1, dy]])
        im_shifted = cv2.warpAffine(im, M, (im.shape[1], im.shape[0]), borderMode=cv2.BORDER_REFLECT)
    else:
        im_shifted = im
    cv2.imwrite(str(patched_jolt_dir / f'jolt_{f:04d}.png'), im_shifted)

# Extract frames 449-456 for dynamic ink reveal wipe
wipe_raw_dir = TMP_DIR / 'wipe_raw'
wipe_raw_dir.mkdir(parents=True, exist_ok=True)
run_cmd([
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(VIDEO_IN),
    '-vf', r'select=between(n\,449\,456)',
    '-fps_mode', 'passthrough',
    '-start_number', '449',
    str(wipe_raw_dir / 'raw_f_%04d.png')
], 'Извлечение кадров 449-456 для динамической туши')

im456 = np.array(Image.open(wipe_raw_dir / 'raw_f_0456.png'))
sub456 = im456[1540:1630, 50:1030]
ink_mask456 = (sub456 < 90).all(axis=-1)

patched_wipe_dir = TMP_DIR / 'patched_wipe'
patched_wipe_dir.mkdir(parents=True, exist_ok=True)

for f in range(449, 456):
    raw_frame_path = wipe_raw_dir / f'raw_f_{f:04d}.png'
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
    Image.fromarray(strip_patch, mode='RGBA').save(patched_wipe_dir / f'patch_{f:04d}.png')

print('=== 3. COMPOSITING MASTER MP4 V2.0 ===')
# Filter complex applies:
# 1. Jolt frames overlay on 14..22
# 2. Dynamic ink wipe on 449..455
vf = (
    '[1:v]setpts=PTS-STARTPTS+(14/30)/TB[jolt];'
    '[2:v]setpts=PTS-STARTPTS+(449/30)/TB[wipe];'
    '[0:v][jolt]overlay=0:0:enable=\'between(n,14,22)\'[v1];'
    '[v1][wipe]overlay=50:1540:enable=\'between(n,449,455)\'[v]'
)

cmd_master = [
    'ffmpeg', '-v', 'error', '-y',
    '-i', str(VIDEO_IN),
    '-framerate', '30', '-start_number', '14', '-i', str(patched_jolt_dir / 'jolt_%04d.png'),
    '-framerate', '30', '-start_number', '449', '-i', str(patched_wipe_dir / 'patch_%04d.png'),
    '-i', str(norm_wav),
    '-filter_complex', vf,
    '-map', '[v]',
    '-map', '3:a',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart',
    '-t', DUR_STR,
    str(OUT_MASTER_V2)
]
run_cmd(cmd_master, 'Рендер мастер-файла V2.0 с встряской камеры и динамической тушью')

# Synchronize all copies
for dest in [OUT_MASTER_V1, OUT_MASTER_STUCK, OUT_CHTOESLI_V2, OUT_CHTOESLI_V1, OUT_CHTOESLI_STUCK]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUT_MASTER_V2, dest)
    print(f'Мастер синхронизирован: {dest}')

print('=== 4. UPGRADING HIGH-CTR 1080x1920 COVER ===')
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

# Enhance cover typography for YouTube Shorts CTR:
# Add a bold high-contrast stamped sub-badge: "3 ПРАВИЛА ВЫЖИВАНИЯ"
draw = ImageDraw.Draw(crisp_cover)

# Load font or default
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 46)
    font_small = ImageFont.truetype("arialbd.ttf", 34)
except Exception:
    font_bold = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Terracotta capsule badge at bottom (y=1640..1750)
badge_box = [190, 1640, 890, 1740]
draw.rounded_rectangle(badge_box, radius=24, fill="#D97757")
draw.rectangle([190, 1640, 890, 1740], outline="#141413", width=4)

badge_text = "3 ПРАВИЛА ВЫЖИВАНИЯ"
# Get text bounding box for centering
bbox = draw.textbbox((0, 0), badge_text, font=font_bold)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (1080 - tw) // 2
ty = 1640 + (100 - th) // 2 - 4
draw.text((tx, ty), badge_text, fill="#FFFFFF", font=font_bold)

cover_destinations = [
    BASE_DIR / 'chtoesli/branding/cover_lift_9x16.jpg',
    BASE_DIR / 'chtoesli/renders/cover_lift_9x16.jpg',
    BASE_DIR / 'renders/cover_lift_9x16.jpg',
]
for dst in cover_destinations:
    dst.parent.mkdir(parents=True, exist_ok=True)
    crisp_cover.save(dst, quality=95)
    print(f'Обновленная обложка сохранена: {dst}')

print('=== 5. AUDIT & QUALITY METRICS V2.0 ===')
final_stats = get_loudness_stats(OUT_MASTER_V2)
print(f'Интегральная громкость: {final_stats["input_i"]} LUFS')
print(f'True Peak: {final_stats["input_tp"]} dBTP')
print(f'LRA: {final_stats["input_lra"]} LU')

# Loudness assertion: I = -16.0 +- 0.5 LUFS, TP < -1.50 dBTP
i_lufs = float(final_stats["input_i"])
tp_val = float(final_stats["input_tp"])
assert abs(i_lufs - (-16.0)) <= 0.5, f'Loudness I={i_lufs} not within -16.0 +- 0.5'
assert tp_val < -1.50, f'True Peak {tp_val} >= -1.50 dBTP'
print(f'Громкость подтверждена: I={i_lufs} LUFS (норма: -16.0 +- 0.5), TP={tp_val} dBTP (норма: < -1.50)')

print('=== V2.0 MASTER RENDER FINISHED SUCCESSFULLY ===')
