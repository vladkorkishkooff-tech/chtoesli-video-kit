import cv2

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = 30.0

# Scene 4 in original video is around frames 422 to 567
# Let's save a tile or individual frames every 10 frames from 420 to 560
for f in range(420, 560, 10):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f'work/tmp/sc4_f_{f}.jpg', frame)
print("Saved scene 4 frames")
