import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = 30.0

# Let's inspect the frame ranges used by prior worker:
# h1: 429..456 (27 frames)
# h2: 63..90 (27 frames)
# s1: 0..84 (84 frames)
# s2: 89..176 (87 frames)
# s3: 248..332 (84 frames)
# s4: 422..506 (84 frames)
# s5: 567..699 (132 frames)
# s6: 711..789 (78 frames)
# s7: 837..957 (120 frames downsampled to 90)
# s8: 1053..1164 (111 frames downsampled to 102)
# s9: 1269..1392 (123 frames upsampled to 135)

segments = {
    'h1': (429, 27),
    'h2': (63, 27),
    's1': (0, 84),
    's2': (89, 87),
    's3': (248, 84),
    's4': (422, 84),
    's5': (567, 132),
    's6': (711, 78),
    's7': (837, 120),
    's8': (1053, 111),
    's9': (1269, 123)
}

print("Checking segment boundaries in original video:")
for name, (start, count) in segments.items():
    cap.set(cv2.CAP_PROP_POS_FRAMES, start)
    ret1, f_start = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, start + count - 1)
    ret2, f_end = cap.read()
    # Check if frame exists
    print(f"{name}: start_f={start} (t={start/30:.2f}s), end_f={start+count-1} (t={(start+count-1)/30:.2f}s), ret=({ret1},{ret2})")
