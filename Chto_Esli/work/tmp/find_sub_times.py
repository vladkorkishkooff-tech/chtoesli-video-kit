import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

# Let's inspect when the subtitles change at the bottom
# Subtitle box: y: 1720 to 1890, x: 100 to 980
prev_gray = None
changes = []
fno = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    if fno % 2 == 0:
        gray = cv2.cvtColor(frame[1720:1890, 100:980], cv2.COLOR_BGR2GRAY)
        if prev_gray is not None:
            diff = np.mean(cv2.absdiff(gray, prev_gray))
            if diff > 10.0:
                t = fno / fps
                changes.append((t, fno, diff))
        prev_gray = gray
    fno += 1

cap.release()

print("Subtitle change points (approx):")
for c in changes:
    print(f"t={c[0]:.2f}s (f={c[1]}): diff={c[2]:.2f}")
