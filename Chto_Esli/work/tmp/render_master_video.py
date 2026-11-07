import cv2
import numpy as np
import subprocess
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

INP_VIDEO = 'Незаконченные видео/brain100_short_v10.mp4'
OUT_VIDEO = 'work/tmp/brain_dynamic_visual.mp4'
font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'

w, h = 1080, 1920
iy0, iy1 = 155, 1435
ix0, ix1 = 55, 1025
iw, ih = ix1 - ix0, iy1 - iy0

# 1. Hook Card Banner (Top)
hook_card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(hook_card)
cx0, cy0, cx1, cy1 = 70, 245, 1010, 495
draw.rounded_rectangle([cx0+4, cy0+5, cx1+4, cy1+5], radius=22, fill=(20, 20, 19, 45))
draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=5)

f1 = ImageFont.truetype(font_path_bold, 50)
f2 = ImageFont.truetype(font_path_bold, 42)
t1_text = "МОЗГ НА 100%?"
t2_text = "ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!"

bb1 = f1.getbbox(t1_text)
w1 = bb1[2] - bb1[0]
x1 = (w - w1) // 2
y1 = cy0 + 34

bb2 = f2.getbbox(t2_text)
w2 = bb2[2] - bb2[0]
x2 = (w - w2) // 2
y2 = cy0 + 124

draw.line([x2 - 12, y2 + 44, x2 + w2 + 12, y2 + 44], fill=(217, 119, 87, 190), width=15)
draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)
hook_card_np = np.array(hook_card)

# 2. Badge "ЧУТЬ РАНЬШЕ"
badge = Image.new('RGBA', (w, h), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(badge)
bx0, by0, bx1, by1 = 370, 520, 710, 590
bdraw.rounded_rectangle([bx0+3, by0+3, bx1+3, by1+3], radius=16, fill=(20, 20, 19, 35))
bdraw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=3)
bf = ImageFont.truetype(font_path_bold, 30)
btext = "ЧУТЬ РАНЬШЕ"
bb = bf.getbbox(btext)
bw = bb[2] - bb[0]
bx = (w - bw) // 2
by = by0 + (70 - (bb[3] - bb[1])) // 2 - 2
bdraw.text((bx, by), btext, fill=(20, 20, 19, 255), font=bf)
badge_np = np.array(badge)


def apply_inner_zoom(frame, scale=1.0, center=None, shake=(0, 0)):
    if scale == 1.0 and shake == (0, 0):
        return frame
    inner = frame[iy0:iy1, ix0:ix1]
    
    src_w = int(round(iw / scale))
    src_h = int(round(ih / scale))
    
    if center is None:
        icx, icy = iw // 2, ih // 2
    else:
        icx, icy = center
    icx = int(round(icx - shake[0]))
    icy = int(round(icy - shake[1]))
    
    x0 = max(0, min(iw - src_w, icx - src_w // 2))
    y0 = max(0, min(ih - src_h, icy - src_h // 2))
    
    cropped = inner[y0:y0+src_h, x0:x0+src_w]
    zoomed_inner = cv2.resize(cropped, (iw, ih), interpolation=cv2.INTER_LINEAR)
    
    res = frame.copy()
    res[iy0:iy1, ix0:ix1] = zoomed_inner
    return res


def overlay_rgba(base_bgr, overlay_rgba_arr, alpha_mult=1.0):
    if alpha_mult <= 0.0:
        return base_bgr
    alpha = (overlay_rgba_arr[:, :, 3] / 255.0) * alpha_mult
    if np.max(alpha) == 0:
        return base_bgr
    ov_bgr = overlay_rgba_arr[:, :, :3][:, :, ::-1]
    alpha_3d = alpha[:, :, np.newaxis]
    return (base_bgr * (1.0 - alpha_3d) + ov_bgr * alpha_3d).astype(np.uint8)


def cover_hook_sub(frame):
    # Cover bottom subtitle completely: y = 1450 to 1750
    res = frame.copy()
    paper_sample = frame[1750:1880, 50:1030]
    patch_full = cv2.resize(paper_sample, (980, 300), interpolation=cv2.INTER_LINEAR)
    res[1450:1750, 50:1030] = patch_full
    return res


print("Starting refined master video rendering...")
cap = cv2.VideoCapture(INP_VIDEO)

cmd_ffmpeg = [
    'ffmpeg', '-v', 'error', '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{w}x{h}',
    '-pix_fmt', 'bgr24',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    OUT_VIDEO
]

proc = subprocess.Popen(cmd_ffmpeg, stdin=subprocess.PIPE)

def read_segment(start_frame, count):
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    frames = []
    for _ in range(count):
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    return frames

t_start = time.time()
total_written = 0

# ----------------------------------------------------
# 0. HOOK: 1.80s (54 frames)
# Part 1: frames 0..26 (27 frames) from Scene 4 (f=429..455)
# ----------------------------------------------------
print("Rendering Hook Part 1 (Neural Zap)...")
h1_frames = read_segment(429, 27)
for i, f in enumerate(h1_frames):
    shake = (0, 0)
    if i == 0: shake = (6, -4)
    elif i == 1: shake = (-5, 5)
    elif i == 2: shake = (3, -2)
    elif i == 3: shake = (-1, 1)
    
    zf = apply_inner_zoom(f, scale=1.25, center=(iw // 2, ih // 2), shake=shake)
    zf = cover_hook_sub(zf)
    out = overlay_rgba(zf, hook_card_np, alpha_mult=1.0)
    proc.stdin.write(out.tobytes())
    total_written += 1

# Part 2: frames 27..53 (27 frames) from Scene 1 (f=63..89)
print("Rendering Hook Part 2 (Boy 100% Shock)...")
h2_frames = read_segment(63, 27)
for i, f in enumerate(h2_frames):
    shake = (0, 0)
    if i == 0: shake = (4, -3)
    elif i == 1: shake = (-3, 2)
    elif i == 2: shake = (1, -1)
    
    zf = apply_inner_zoom(f, scale=1.15, center=(iw // 2, int(ih * 0.45)), shake=shake)
    zf = cover_hook_sub(zf)
    out = overlay_rgba(zf, hook_card_np, alpha_mult=1.0)
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 1. SCENE 1: Switch (1.80s - 4.60s = 2.80s, 84 frames)
# Source: f=0..83
# ----------------------------------------------------
print("Rendering Scene 1 (Switch)...")
s1_frames = read_segment(0, 84)
for i, f in enumerate(s1_frames):
    scale = 1.0
    shake = (0, 0)
    if 18 <= i <= 24:
        scale = 1.0 + 0.08 * ((i - 18) / 6.0)
        if i == 19: shake = (4, -3)
        elif i == 20: shake = (-3, 2)
    elif i > 24:
        scale = 1.08
    
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, int(ih * 0.45)), shake=shake)
    
    if i < 24:
        alpha = 1.0
        if i > 18:
            alpha = (24 - i) / 6.0
        out = overlay_rgba(out, badge_np, alpha_mult=alpha)
        
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 2. SCENE 2: Myth 10% (4.60s - 7.50s = 2.90s, 87 frames)
# Source: f=89..175
# ----------------------------------------------------
print("Rendering Scene 2 (Myth 10%)...")
s2_frames = read_segment(89, 87)
for i, f in enumerate(s2_frames):
    progress = i / 86.0
    scale = 1.0 + 0.12 * progress
    if 60 <= i <= 72:
        scale += 0.05 * np.sin((i - 60) / 12.0 * np.pi)
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, int(ih * 0.48)))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 3. SCENE 3: Brain works all (7.50s - 10.30s = 2.80s, 84 frames)
# Source: f=248..331
# ----------------------------------------------------
print("Rendering Scene 3 (Brain works all)...")
s3_frames = read_segment(248, 84)
for i, f in enumerate(s3_frames):
    scale = 1.02 + 0.04 * (i / 83.0)
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 4. SCENE 4: Seizure / Neural zap (10.30s - 13.10s = 2.80s, 84 frames)
# Source: f=422..505
# ----------------------------------------------------
print("Rendering Scene 4 (Neural zap)...")
s4_frames = read_segment(422, 84)
for i, f in enumerate(s4_frames):
    scale = 1.04
    shake = (0, 0)
    if 8 <= i <= 15:
        scale = 1.10
        if i in (8, 10): shake = (5, -4)
        elif i in (9, 11): shake = (-4, 3)
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2), shake=shake)
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 5. SCENE 5: 2% mass, 20% energy (13.10s - 17.50s = 4.40s, 132 frames)
# Source: f=567..698
# ----------------------------------------------------
print("Rendering Scene 5 (2% mass, 20% energy)...")
s5_frames = read_segment(567, 132)
for i, f in enumerate(s5_frames):
    progress = i / 131.0
    scale = 1.0 + 0.07 * progress
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 6. SCENE 6: 20W Lamp (17.50s - 20.10s = 2.60s, 78 frames)
# Source: f=711..788
# ----------------------------------------------------
print("Rendering Scene 6 (20W Lamp)...")
s6_frames = read_segment(711, 78)
for i, f in enumerate(s6_frames):
    progress = i / 77.0
    scale = 1.0 + 0.08 * progress
    if 8 <= i <= 12:
        scale += 0.03
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, int(ih * 0.50)))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 7. SCENE 7: London taxi (20.10s - 23.10s = 3.00s, 90 frames)
# Source: f=837..956
# ----------------------------------------------------
print("Rendering Scene 7 (London taxi)...")
s7_raw = read_segment(837, 120)
s7_indices = np.linspace(0, len(s7_raw) - 1, 90).astype(int)
for i, idx in enumerate(s7_indices):
    f = s7_raw[idx]
    progress = i / 89.0
    scale = 1.0 + 0.14 * progress
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 8. SCENE 8: Sleep, move, learn (23.10s - 26.50s = 3.40s, 102 frames)
# Source: f=1053..1163
# ----------------------------------------------------
print("Rendering Scene 8 (Sleep, move, learn)...")
s8_raw = read_segment(1053, 111)
s8_indices = np.linspace(0, len(s8_raw) - 1, 102).astype(int)
for i, idx in enumerate(s8_indices):
    f = s8_raw[idx]
    scale = 1.02
    for pop_f in (24, 48, 72):
        if abs(i - pop_f) <= 3:
            scale += 0.03 * (1.0 - abs(i - pop_f) / 3.0)
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2))
    proc.stdin.write(out.tobytes())
    total_written += 1

# ----------------------------------------------------
# 9. SCENE 9: Care for brain (26.50s - 31.00s = 4.50s, 135 frames)
# Source: f=1269..1391
# ----------------------------------------------------
print("Rendering Scene 9 (Care for brain & Outro)...")
s9_raw = read_segment(1269, 123)
s9_indices = np.linspace(0, len(s9_raw) - 1, 135).astype(int)
for i, idx in enumerate(s9_indices):
    f = s9_raw[idx]
    progress = i / 134.0
    scale = 1.0 + 0.05 * progress
    out = apply_inner_zoom(f, scale=scale, center=(iw // 2, ih // 2))
    if i >= 120:
        alpha = (i - 120) / 15.0
        paper_bgr = np.array([230, 241, 249], dtype=np.uint8)
        out = (out.astype(np.float32) * (1.0 - alpha) + paper_bgr * alpha).astype(np.uint8)
    proc.stdin.write(out.tobytes())
    total_written += 1

cap.release()
proc.stdin.close()
proc.wait()

dur_total = total_written / 30.0
print(f"\nSUCCESS! Written {total_written} frames = {dur_total:.2f} seconds.")
print(f"Video render completed in {time.time() - t_start:.1f} seconds: {OUT_VIDEO}")
