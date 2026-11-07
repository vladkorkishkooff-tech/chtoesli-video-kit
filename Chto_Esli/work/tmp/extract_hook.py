import cv2

cap = cv2.VideoCapture('renders/brain100_master.mp4')
fps = 30.0

times = [0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.1, 1.3, 1.5, 1.7, 1.8, 2.0, 2.2, 2.4, 2.6]
for t in times:
    f = int(t * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f'work/tmp/hook_f_{f:03d}_{t:.1f}s.jpg', frame)
print("Saved hook frames!")
