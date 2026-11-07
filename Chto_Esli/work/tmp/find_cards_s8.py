import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')

# Scene 8 is frames 1053 to 1269 (35.1s to 42.3s in original)
# Let's see what happens every 10 frames from 1053 to 1269
cap.set(cv2.CAP_PROP_POS_FRAMES, 1053)

prev = None
card_events = []
for f in range(1053, 1270):
    ret, frame = cap.read()
    if not ret: break
    inner = frame[250:1200, 100:980]
    gray = cv2.cvtColor(cv2.resize(inner, (100, 100)), cv2.COLOR_BGR2GRAY)
    if prev is not None:
        diff = np.mean(np.abs(gray.astype(float) - prev.astype(float)))
        if diff > 5.0:
            card_events.append((f, f - 1053, (f - 1053)/30.0, diff))
    prev = gray

print("Card events in Scene 8 of original video:")
for f, rel_f, rel_t, diff in card_events:
    print(f"orig_f={f} (rel_f={rel_f:3d}, rel_t={rel_t:4.2f}s): diff={diff:.2f}")
