import cv2
import numpy as np

cap = cv2.VideoCapture('renders/brain100_master.mp4')
fps = 30.0
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

prev_sub = None
jumps = []

for f in range(total):
    ret, frame = cap.read()
    if not ret: break
    sub = frame[1450:1750, 80:1000]
    gray = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY)
    if prev_sub is not None:
        diff = np.mean(np.abs(gray.astype(float) - prev_sub.astype(float)))
        if diff > 5.0: # Significant change in subtitle area
            jumps.append((f, f/fps, diff))
    prev_sub = gray

print(f"Total subtitle changes found: {len(jumps)}")
for f, t, d in jumps:
    print(f"Frame {f:4d} (t={t:5.2f}s): sub diff = {d:.2f}")
