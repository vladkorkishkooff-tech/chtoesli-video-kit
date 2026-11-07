import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')

pairs = [
    ("Scene 2: f=130 vs f=200", 130, 200),
    ("Scene 3: f=290 vs f=380", 290, 380),
    ("Scene 7: f=900 vs f=1000", 900, 1000),
    ("Scene 8: f=1090 vs f=1230", 1090, 1230),
]

for label, f1, f2 in pairs:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f1)
    ret1, frame1 = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, f2)
    ret2, frame2 = cap.read()
    sub1 = frame1[1450:1750, 50:1030]
    sub2 = frame2[1450:1750, 50:1030]
    diff = np.mean(np.abs(sub1.astype(float) - sub2.astype(float)))
    print(f"{label}: sub diff = {diff:.3f}")
