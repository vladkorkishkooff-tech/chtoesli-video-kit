import cv2
import numpy as np
import sys

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"FPS: {fps}, Total frames: {total_frames}, Duration: {total_frames/fps:.3f}s", flush=True)

prev_sub = None
prev_center = None
fno = 0
changes = []

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # check every 3 frames (~10 fps sample)
    if fno % 3 == 0:
        sub_crop = frame[1720:1880, 50:1030]
        center_crop = frame[300:1600, 100:980]
        if prev_sub is not None:
            diff_sub = float(np.mean(cv2.absdiff(sub_crop, prev_sub)))
            diff_center = float(np.mean(cv2.absdiff(center_crop, prev_center)))
            t = fno / fps
            if diff_sub > 12.0 or diff_center > 20.0:
                changes.append((t, fno, diff_sub, diff_center))
        prev_sub = sub_crop
        prev_center = center_crop
    fno += 1

cap.release()

print(f"Total checked, detected {len(changes)} transition points:", flush=True)
for c in changes:
    print(f"t={c[0]:.2f}s (f={c[1]}): diff_sub={c[2]:.1f}, diff_center={c[3]:.1f}", flush=True)
