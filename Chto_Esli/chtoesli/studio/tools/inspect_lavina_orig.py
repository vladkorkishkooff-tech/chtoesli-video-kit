import cv2, os

cap = cv2.VideoCapture('D:/Chanels/Chto_Esli/Незаконченные видео/Лавина_черновой_монтаж_без_голоса.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)
total = cap.get(cv2.CAP_PROP_FRAME_COUNT)
dur = total / fps
print(f'FPS: {fps}, Total frames: {total}, Duration: {dur:.3f}s')

out_dir = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig'
os.makedirs(out_dir, exist_ok=True)

timestamps = [42.0, 43.0, 43.5, 43.8, 44.0, 44.5, 45.0, 45.5, 46.0, 46.5, 47.0, 47.5, 48.0]
for t in timestamps:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f'{out_dir}/orig_{t:.1f}.jpg', frame)
cap.release()
print('Frames saved successfully.')
