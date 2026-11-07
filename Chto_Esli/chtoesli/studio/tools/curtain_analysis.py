import cv2, os

cap = cv2.VideoCapture('D:/Chanels/Chto_Esli/Незаконченные видео/Лавина_черновой_монтаж_без_голоса.mp4')
fps = 30.0

out_dir = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/curtain_analysis'
os.makedirs(out_dir, exist_ok=True)

start_frame = int(43.50 * fps)
end_frame = int(47.00 * fps)

for f_idx in range(start_frame, end_frame, 3):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if ret:
        t = f_idx / fps
        cv2.imwrite(f'{out_dir}/frame_{f_idx}_t{t:.2f}.jpg', frame)

cap.release()
print('Curtain frames saved.')
