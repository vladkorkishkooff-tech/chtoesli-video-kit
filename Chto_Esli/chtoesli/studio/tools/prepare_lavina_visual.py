"""
Сборка чистого видеоряда для ролика «Лавина»:
1. Часть 1 (0.00s - 43.50s): Видеоряд лавины из чернового монтажа (до белой вспышки/перехода).
2. Часть 2 (52.033s - 56.700s): Канонический финал из blackout_stil_kanala_v7_1.mp4
   (герой естественно сидит на диване, кот спит рядом, шторы закрываются, опускается плашка).
   В верхнем правом углу в первые доли секунды до опускания ламбрекена текст бесшовно заклеивается
   чистой текстурой бумажного фона.
3. Аудио части 2: ИСКЛЮЧИТЕЛЬНО чистый foley (шум комнаты / шелест штор cloth.wav),
   БЕЗ какого-либо дикторского голоса (устранена наводка двойного голоса в финале!).
4. Бесшовная склейка part1 и outro.
"""
import cv2, subprocess, json, os
import numpy as np
from pathlib import Path

LAVINA_SRC = 'D:/Chanels/Chto_Esli/Незаконченные видео/Лавина_черновой_монтаж_без_голоса.mp4'
BLACKOUT_SRC = 'D:/Chanels/Chto_Esli/blackout_stil_kanala_v7_1.mp4'
OUT_VISUAL = 'D:/Chanels/Chto_Esli/chtoesli/renders/lavina_clean_visual.mp4'
TMP_DIR = Path('D:/Chanels/Chto_Esli/work/tmp/assembly')
TMP_DIR.mkdir(parents=True, exist_ok=True)

# 1. Срез части 1 видео и аудио: 0.00 до 43.50с
part1_mp4 = TMP_DIR / 'part1.mp4'
cmd1 = [
    'ffmpeg', '-y', '-ss', '0.00', '-to', '43.50',
    '-i', LAVINA_SRC,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'pcm_s16le', '-ar', '48000',
    str(part1_mp4)
]
print("Extracting part 1...")
subprocess.run(cmd1, check=True)

# 2. Обработка части 2 видео: с 52.033 до 56.700с (4.667с = 140 кадров при 30fps)
print("Processing part 2 outro frames...")
cap = cv2.VideoCapture(BLACKOUT_SRC)
fps = 30.0
start_msec = 52033.33
total_frames = int(round(4.666667 * fps)) # 140 frames

outro_raw_mp4 = TMP_DIR / 'outro_processed.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_writer = cv2.VideoWriter(str(outro_raw_mp4), fourcc, fps, (1080, 1920))

cap.set(cv2.CAP_PROP_POS_MSEC, start_msec)
for frame_idx in range(total_frames):
    ret, frame = cap.read()
    if not ret:
        break
    
    # Первые ~18 кадров (0.6с), пока ламбрекен не опустился, убираем старый титр 'свет дали'
    if frame_idx < 18:
        # Текст 'свет дали' находится в x: [680, 1000], y: [145, 230]
        # Берем чистый участок бумажной текстуры той же высоты слева: x: [280, 600], y: [145, 230]
        patch = frame[145:230, 280:600].copy()
        mask = np.ones((85, 320), dtype=np.float32)
        mask[:, :20] = np.linspace(0, 1, 20)[None, :]
        mask[:, -20:] = np.linspace(1, 0, 20)[None, :]
        mask = mask[:, :, None]
        
        target_roi = frame[145:230, 680:1000].astype(np.float32)
        blended = (patch.astype(np.float32) * mask + target_roi * (1.0 - mask)).astype(np.uint8)
        frame[145:230, 680:1000] = blended

    out_writer.write(frame)

cap.release()
out_writer.release()

# Создаем ЧИСТЫЙ фолей для outro: мягкий шелест ткани штор (cloth.wav) и легкий воздух, БЕЗ голоса
foley_cloth = Path('D:/Chanels/Chto_Esli/chtoesli/studio/foley/cloth.wav')
foley_curt = Path('D:/Chanels/Chto_Esli/chtoesli/studio/foley/curtain.wav')
outro_audio_wav = TMP_DIR / 'outro_foley.wav'

# Генерируем 4.667с аудио с шелестом штор на 0.5с и 2.0с
cmd_foley = [
    'ffmpeg', '-y',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-i', str(foley_cloth),
    '-filter_complex', '[1:a]volume=0.35,adelay=400|400,apad[a1];[0:a][a1]amix=inputs=2:duration=first:normalize=0',
    '-t', '4.666667',
    str(outro_audio_wav)
]
subprocess.run(cmd_foley, check=True)

# Перекодируем outro видео с чистым foley (без голоса!)
outro_mp4 = TMP_DIR / 'outro.mp4'
cmd2 = [
    'ffmpeg', '-y',
    '-i', str(outro_raw_mp4),
    '-i', str(outro_audio_wav),
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'pcm_s16le', '-ar', '48000',
    str(outro_mp4)
]
print("Encoding outro with clean Foley...")
subprocess.run(cmd2, check=True)

# 3. Бесшовная склейка part1 и outro
concat_txt = TMP_DIR / 'concat.txt'
concat_txt.write_text(f"file '{part1_mp4.as_posix()}'\nfile '{outro_mp4.as_posix()}'\n", encoding='utf-8')

Path(OUT_VISUAL).parent.mkdir(parents=True, exist_ok=True)
cmd3 = [
    'ffmpeg', '-y',
    '-f', 'concat', '-safe', '0', '-i', str(concat_txt),
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    OUT_VISUAL
]
print("Concatenating into final visual...")
subprocess.run(cmd3, check=True)

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT_VISUAL], capture_output=True, text=True).stdout.strip())
print(f"DONE! lavina_clean_visual.mp4 generated, duration = {dur:.3f}s")
