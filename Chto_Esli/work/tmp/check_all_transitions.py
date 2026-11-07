import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = 30.0

# Let's inspect the transition zones in the original video:
# Zone 1: f=75..115 (between S1 and S2)
# Zone 2: f=235..265 (between S2 and S3)
# Zone 3: f=410..445 (between S3 and S4)
# Zone 4: f=555..580 (between S4 and S5)
# Zone 5: f=700..725 (between S5 and S6)
# Zone 6: f=825..855 (between S6 and S7)
# Zone 7: f=1040..1070 (between S7 and S8)
# Zone 8: f=1255..1285 (between S8 and S9)

zones = [
    ("T1_S1_S2", 75, 115),
    ("T2_S2_S3", 235, 265),
    ("T3_S3_S4", 410, 445),
    ("T4_S4_S5", 555, 580),
    ("T5_S5_S6", 700, 725),
    ("T6_S6_S7", 825, 855),
    ("T7_S7_S8", 1040, 1070),
    ("T8_S8_S9", 1255, 1285),
]

for name, f0, f1 in zones:
    print(f"\n--- {name} (f={f0}..{f1}) ---")
    # Check subtitle area diff and inner frame diff
    prev_f = None
    for f in range(f0, f1 + 1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, f)
        ret, frame = cap.read()
        if not ret: break
        inner = frame[155:1435, 55:1025]
        sub = frame[1450:1750, 50:1030]
        # check if subtitle is changing
        sub_ink = np.sum(sub < 100)
        # print if key change
        if f in (f0, f0+5, f0+10, f0+15, f0+20, f0+25, f0+30, f1):
            print(f"f={f:4d} (t={f/30:5.2f}s): sub_ink={sub_ink:5d}, inner_mean={inner.mean():.1f}")
