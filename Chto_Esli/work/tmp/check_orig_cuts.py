import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')

# Let's inspect what happens around each cut in original video
# Specifically:
# Cut 1: f=80..95 (S1 to S2 transition in original)
# Cut 2: f=170..255 (S2 end to S3 start in original)
# Cut 3: f=325..430 (S3 end to S4 start in original)
# Cut 4: f=500..575 (S4 end to S5 start in original)
# Cut 5: f=690..720 (S5 end to S6 start in original)
# Cut 6: f=780..845 (S6 end to S7 start in original)
# Cut 7: f=950..1060 (S7 end to S8 start in original)
# Cut 8: f=1160..1275 (S8 end to S9 start in original)

cuts_info = [
    ("S1 -> S2", 80, 95),
    ("S2 -> S3", 170, 255),
    ("S3 -> S4", 325, 430),
    ("S4 -> S5", 500, 575),
    ("S5 -> S6", 690, 720),
    ("S6 -> S7", 780, 845),
    ("S7 -> S8", 950, 1060),
    ("S8 -> S9", 1160, 1275),
]

for name, f0, f1 in cuts_info:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)
    ret0, frame0 = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, f1)
    ret1, frame1 = cap.read()
    print(f"{name}: f0={f0} (t={f0/30:.2f}s) to f1={f1} (t={f1/30:.2f}s)")
