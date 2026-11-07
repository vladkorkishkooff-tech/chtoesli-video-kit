import os
import shutil
import subprocess
from playwright.sync_api import sync_playwright

html_path = os.path.abspath('D:/Chanels/Chto_Esli/chtoesli/studio/ep_lavina_outro.html')
out_mp4 = os.path.abspath('D:/Chanels/Chto_Esli/work/tmp/assembly/outro_pure.mp4')
frames_dir = os.path.abspath('D:/Chanels/Chto_Esli/work/tmp/assembly/_pframes')

if os.path.exists(frames_dir):
    shutil.rmtree(frames_dir)
os.makedirs(frames_dir, exist_ok=True)
os.makedirs(os.path.dirname(out_mp4), exist_ok=True)

fps = 30
dur = 4.667
total_frames = int(round(dur * fps)) # 140 frames

print(f"Rendering {total_frames} frames ({dur}s @ {fps}fps)...")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(1000)
    
    for i in range(total_frames):
        t = i / float(fps)
        page.evaluate(f'window.__seek({t})')
        frame_path = os.path.join(frames_dir, f'f{i:06d}.jpg')
        page.screenshot(path=frame_path, type='jpeg', quality=95)
        if i % 30 == 0:
            print(f"Rendered frame {i}/{total_frames} (t={t:.2f}s)")
            
    browser.close()

print("Assembling outro_pure.mp4 via ffmpeg...")
cmd = [
    'ffmpeg', '-y', '-v', 'error',
    '-framerate', str(fps),
    '-i', os.path.join(frames_dir, 'f%06d.jpg'),
    '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    out_mp4
]
subprocess.run(cmd, check=True)

shutil.rmtree(frames_dir)
print(f"Outro successfully rendered: {out_mp4}")
