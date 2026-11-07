import cv2
import os

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

times = [
    0.0, 0.73, 1.5, 2.8, 3.13, 5.0, 8.27, 8.43, 11.5, 14.07, 14.23, 16.5,
    18.90, 19.07, 21.3, 23.70, 23.87, 26.0, 27.90, 28.07, 31.5, 35.10,
    35.27, 38.8, 42.30, 42.47, 45.0, 46.3
]

os.makedirs('work/tmp/scene_checks', exist_ok=True)
for t in times:
    fno = int(round(t * fps))
    cap.set(cv2.CAP_PROP_POS_FRAMES, fno)
    ret, frame = cap.read()
    if ret:
        # save small thumbnail
        thumb = cv2.resize(frame, (270, 480))
        cv2.imwrite(f'work/tmp/scene_checks/t_{t:05.2f}.jpg', thumb)
        print(f"Saved t={t:05.2f}s (f={fno})")

cap.release()
