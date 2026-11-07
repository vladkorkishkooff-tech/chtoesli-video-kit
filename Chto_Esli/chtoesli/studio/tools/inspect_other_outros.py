import cv2, os

videos = [
    'D:/Chanels/Chto_Esli/Незаконченные видео/Месяц_без_сахара_исправлено.mp4',
    'D:/Chanels/Chto_Esli/Незаконченные видео/tongue_frost_v5_huk.mp4',
    'D:/Chanels/Chto_Esli/Незаконченные видео/lift_stuck_new_story_preview.mp4',
    'D:/Chanels/Chto_Esli/Незаконченные видео/brain100_short_v10.mp4'
]

out_dir = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_other_outros'
os.makedirs(out_dir, exist_ok=True)

for v in videos:
    name = os.path.splitext(os.path.basename(v))[0]
    cap = cv2.VideoCapture(v)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    dur = total / fps if fps > 0 else 0
    print(f'{name}: {dur:.2f}s, fps={fps}')
    # take frame at dur - 3.5s and dur - 1.5s
    for dt in [3.5, 2.0, 1.0]:
        t = max(0, dur - dt)
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ret, frame = cap.read()
        if ret:
            cv2.imwrite(f'{out_dir}/{name}_t{t:.1f}.jpg', frame)
    cap.release()
print('Done!')
