import cv2
import json

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

# Let's inspect each scene's start, end, and duration in brain100_short_v10.mp4
# In assemble_episodes.py:
# Scene 1: b01 0.00s - 2.97s (dur 2.97s)
# Scene 2: b02 2.97s - 8.27s (dur 5.30s)
# Scene 3: b03 8.27s - 14.07s (dur 5.80s)
# Scene 4: b04 14.07s - 18.90s (dur 4.83s)
# Scene 5: b05 18.90s - 23.70s (dur 4.80s)
# Scene 6: b06 23.70s - 27.90s (dur 4.20s)
# Scene 7: b07 27.90s - 35.10s (dur 7.20s)
# Scene 8: b08 35.10s - 42.30s (dur 7.20s)
# Scene 9: b09 42.30s - 46.40s (dur 4.10s)

# Let's check what happens inside each scene by sampling 5 frames per scene:
scenes = [
    ("Scene 1 (Switch)", 0.00, 2.97),
    ("Scene 2 (Myth 10%)", 2.97, 8.27),
    ("Scene 3 (Brain all)", 8.27, 14.07),
    ("Scene 4 (Neural zap)", 14.07, 18.90),
    ("Scene 5 (2% mass, 20% energy)", 18.90, 23.70),
    ("Scene 6 (20W lamp)", 23.70, 27.90),
    ("Scene 7 (Taxi London)", 27.90, 35.10),
    ("Scene 8 (Sleep, move, learn)", 35.10, 42.30),
    ("Scene 9 (Care for brain)", 42.30, 46.40),
]

for name, st, en in scenes:
    dur = en - st
    print(f"=== {name}: {st:.2f}s -> {en:.2f}s (dur {dur:.2f}s) ===")
