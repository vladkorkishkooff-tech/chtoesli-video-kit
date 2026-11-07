import os
import shutil
import subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

print("=== STARTING MASTER ASSEMBLY V2.2 ===")

# Paths
draft_mp4 = r'D:\Chanels\Chto_Esli\Незаконченные видео\Лавина_черновой_монтаж_без_голоса.mp4'
html_file = r'D:\Chanels\Chto_Esli\chtoesli\studio\ep_lavina_master_outro.html'
master_audio = r'D:\Chanels\Chto_Esli\chtoesli\episodes\lavina\audio_master_v2_2.wav'
temp_dir = r'D:\Chanels\Chto_Esli\work\tmp\assembly_v2_2'
out_visual_mp4 = os.path.join(temp_dir, 'lavina_visual_v2_2.mp4')
final_master_mp4 = r'D:\Chanels\Chto_Esli\chtoesli\renders\chtoesli_lavina_v2_2.mp4'

if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir, exist_ok=True)
outro_frames_dir = os.path.join(temp_dir, 'outro_frames')
os.makedirs(outro_frames_dir, exist_ok=True)

fps = 30
outro_dur = 4.667
outro_frame_count = int(round(outro_dur * fps)) # 140 frames

print(f"\n[Step 1] Rendering {outro_frame_count} Outro Frames with Playwright...")
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.goto(f'file:///{html_file.replace(os.sep, "/")}')
    page.wait_for_timeout(1000)
    
    for i in range(outro_frame_count):
        t = i / float(fps)
        page.evaluate(f'window.__seek({t})')
        frame_path = os.path.join(outro_frames_dir, f'out_{i:04d}.jpg')
        page.screenshot(path=frame_path, type='jpeg', quality=95)
        if i % 30 == 0 or i == outro_frame_count - 1:
            print(f"  Rendered outro frame {i}/{outro_frame_count} (t={t:.2f}s)")
            
    browser.close()

print("\n[Step 2] Processing Video Timeline (Original + Rescue Beacon + Outro)...")
cap = cv2.VideoCapture(draft_mp4)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
orig_fps = cap.get(cv2.CAP_PROP_FPS)

print(f"  Input: {w}x{h} @ {orig_fps:.2f} fps, {total_frames} frames ({total_frames/orig_fps:.2f}s)")

# Font for badge
try:
    badge_font = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 26)
except:
    badge_font = ImageFont.load_default()

# Open VideoWriter for visual track
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_writer = cv2.VideoWriter(out_visual_mp4, fourcc, fps, (w, h))

# Rescue scene range: 35.4s to 43.5s -> frames 1062 to 1304
# Outro scene range: 43.5s to 48.167s -> frames 1305 to 1444
rescue_start_frame = int(round(35.4 * fps)) # 1062
outro_start_frame = int(round(43.5 * fps))   # 1305

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
        
    t = frame_idx / float(fps)
    
    if frame_idx < rescue_start_frame:
        # Part 1: Original draft visual (0.0s - 35.4s)
        out_writer.write(frame)
        
    elif frame_idx < outro_start_frame:
        # Part 2: Rescue scene with animated beacon signal waves and badge (35.4s - 43.5s)
        dt = t - 35.4
        overlay = frame.copy()
        center = (420, 860) # Buried skier chest
        
        # Expanding concentric radio wave arcs
        # Speed: 180 px/sec, repeating every 180 px
        cycle = 180.0
        base_r = (dt * 160.0) % cycle
        
        for offset_r in [0.0, 60.0, 120.0]:
            r = int(base_r + offset_r)
            if r > cycle:
                r -= int(cycle)
            if r > 20:
                # Alpha fades as wave expands: 0.8 at start, 0.1 at 180px
                ring_alpha = max(0.1, 0.85 * (1.0 - (r / cycle)))
                # Draw arc on overlay
                cv2.ellipse(overlay, center, (r, int(r * 0.7)), 0, 210, 330, (87, 119, 217), 3, cv2.LINE_AA)
                cv2.ellipse(overlay, center, (r + 1, int((r + 1) * 0.7)), 0, 212, 328, (244, 242, 235), 1, cv2.LINE_AA)
        
        # Blend radio waves with frame
        blended = cv2.addWeighted(overlay, 0.65, frame, 0.35, 0)
        
        # Add badge from 35.8s to 42.0s
        if 35.8 <= t <= 42.0:
            pil_img = Image.fromarray(cv2.cvtColor(blended, cv2.COLOR_BGR2RGBA))
            draw = ImageDraw.Draw(pil_img)
            
            bx, by, bw, bh = 580, 700, 320, 56
            draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=10, fill='#F4F2EB', outline='#211C1A', width=2)
            
            # Pulsating terracotta dot (2 Hz)
            pulse_size = int(round(16 + 4 * np.sin(dt * 12.0)))
            cx, cy = bx + 24, by + 28
            draw.ellipse([cx - pulse_size//2, cy - pulse_size//2, cx + pulse_size//2, cy + pulse_size//2], fill='#D97757', outline='#211C1A', width=2)
            
            # Text
            draw.text((bx + 44, by + 13), "457 кГц  ·  СИГНАЛ", font=badge_font, fill='#211C1A')
            blended = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGR)
            
        out_writer.write(blended)
        
    else:
        # Part 3: Pristine Master Outro (43.5s - 48.167s)
        outro_idx = frame_idx - outro_start_frame
        if outro_idx < outro_frame_count:
            outro_frame_path = os.path.join(outro_frames_dir, f'out_{outro_idx:04d}.jpg')
            if os.path.exists(outro_frame_path):
                outro_img = cv2.imread(outro_frame_path)
                out_writer.write(outro_img)
            else:
                out_writer.write(frame)
        else:
            # Hold last outro frame
            last_frame_path = os.path.join(outro_frames_dir, f'out_{outro_frame_count - 1:04d}.jpg')
            last_img = cv2.imread(last_frame_path)
            out_writer.write(last_img)
            
    if frame_idx % 150 == 0:
        print(f"  Processed frame {frame_idx}/{total_frames} (t={t:.2f}s)")
        
    frame_idx += 1

cap.release()
out_writer.release()
print(f"  Visual stream completed: {frame_idx} frames written.")

print("\n[Step 3] Re-encoding Visual Track to H.264 High Profile...")
h264_visual = os.path.join(temp_dir, 'lavina_h264.mp4')
cmd_enc = [
    'ffmpeg', '-y', '-v', 'error',
    '-i', out_visual_mp4,
    '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    h264_visual
]
subprocess.run(cmd_enc, check=True)

print("\n[Step 4] Muxing Upgraded Visual Track with Master Audio (-16.0 LUFS)...")
cmd_mux = [
    'ffmpeg', '-y', '-v', 'error',
    '-i', h264_visual,
    '-i', master_audio,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    final_master_mp4
]
subprocess.run(cmd_mux, check=True)

print(f"\nSUCCESS! Master Video Rendered: {final_master_mp4}")
