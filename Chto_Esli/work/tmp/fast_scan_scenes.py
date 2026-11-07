import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = 30.0
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# We want to find:
# 1. Exact start and end frames of each scene
# 2. Transition types (hard cut vs dissolve)
# 3. In Scene 8 (cards): when do cards 1, 2, 3 appear?

prev_gray = None
diffs = []
sub_inks = []

f = 0
while True:
    ret, frame = cap.read()
    if not ret: break
    inner = frame[155:1435, 55:1025]
    small = cv2.resize(inner, (120, 160))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    
    sub = frame[1450:1750, 50:1030]
    ink = np.sum(sub < 100)
    sub_inks.append(ink)
    
    if prev_gray is not None:
        diff = np.mean(np.abs(gray.astype(float) - prev_gray.astype(float)))
        diffs.append(diff)
    else:
        diffs.append(0.0)
    prev_gray = gray
    f += 1

cap.release()

diffs = np.array(diffs)
sub_inks = np.array(sub_inks)

# Find peaks in diffs
peaks = np.where(diffs > 10.0)[0]
print(f"Total frames scanned: {f}")
print("Significant frame diff peaks (>10.0):")
for p in peaks:
    print(f"f={p:4d} (t={p/30:5.2f}s): diff={diffs[p]:.2f}, sub_ink={sub_inks[p]}")

# Subtitle changes
sub_diffs = np.abs(np.diff(sub_inks))
sub_jumps = np.where(sub_diffs > 5000)[0]
print("\nSubtitle jumps (>5000 px change):")
for sj in sub_jumps:
    print(f"f={sj:4d} (t={sj/30:5.2f}s): ink_before={sub_inks[sj]}, ink_after={sub_inks[sj+1]}")
