"""
Сборка и мастеринг двух эпизодов канала «Что если?»:
1. «Застрял в лифте» (lift_stuck)
2. «Мозг на 100%» (brain100)

Соответствие стандартам CRAFT.md:
- Интегральная громкость строго -16.0 LUFS
- True Peak max -1.5 dBTP
- Голос Сергея Лебедева (XuEV9VY3VUASYgJVNBh0, eleven_v3)
- Foley под голосом на -9 dB
- Устранение бага на 15.0 с в «Лифте» через оверлей оригинальной текстуры бумаги
"""
import json
import os
import shutil
import subprocess
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

BASE_DIR = Path('D:/Chanels/Chto_Esli')
RENDERS_DIR = BASE_DIR / 'renders'
CHTOESLI_RENDERS_DIR = BASE_DIR / 'chtoesli/renders'

RENDERS_DIR.mkdir(parents=True, exist_ok=True)
CHTOESLI_RENDERS_DIR.mkdir(parents=True, exist_ok=True)

TARGET_LUFS = -16.0
TARGET_TP = -1.65


def run_cmd(cmd, desc=""):
    print(f"--> {desc}")
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if res.returncode != 0:
        print(f"ERROR: {res.stderr}")
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{res.stderr}")
    return res


def get_loudness_stats(audio_file):
    cmd = [
        'ffmpeg', '-hide_banner', '-i', str(audio_file),
        '-af', f'loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:print_format=json',
        '-f', 'null', '-'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    log = res.stderr
    js_str = log[log.rindex('{'):log.rindex('}') + 1]
    return json.loads(js_str)


def build_lift_master():
    print("\n==========================================")
    print("1. СБОРКА И МАСТЕРИНГ: «Застрял в лифте»")
    print("==========================================")
    
    video_in = BASE_DIR / 'Незаконченные видео/lift_stuck_new_story_preview.mp4'
    ep_dir = BASE_DIR / 'chtoesli/episodes/lift_stuck'
    voice_dir = ep_dir / 'voice'
    ep_foley = ep_dir / 'foley'
    st_foley = BASE_DIR / 'chtoesli/studio/foley'
    tmp_dir = BASE_DIR / 'work/tmp/lift_v1_0_build'
    tmp_dir.mkdir(parents=True, exist_ok=True)
    
    voice_cues = [
        (voice_dir / 's01.wav', 0.30),
        (voice_dir / 's02.wav', 5.40),
        (voice_dir / 's03.wav', 10.60),
        (voice_dir / 's04.wav', 15.10),
        (voice_dir / 's05.wav', 21.25),
        (voice_dir / 's06.wav', 25.90),
        (voice_dir / 's07.wav', 30.80),
        (voice_dir / 's08.wav', 34.70),
    ]
    
    foley_cues = [
        (ep_foley / 'lift_hum.wav', 0.0, -18.0),
        (ep_foley / 'lift_jolt.wav', 0.8, -6.0),
        (st_foley / 'switch_click.wav', 11.287, 0.0),
        (ep_foley / 'dispatcher_bell.wav', 12.2, -6.0),
        (ep_foley / 'intercom_connect.wav', 14.8, -8.0),
        (st_foley / 'cloth.wav', 20.6, 0.0),
        (st_foley / 'clock_tick.wav', 21.132, 2.0),
        (st_foley / 'clock_tick.wav', 23.532, 2.0),
        (st_foley / 'clock_tick.wav', 25.632, 2.0),
        (st_foley / 'clock_tick.wav', 27.632, 2.0),
        (ep_foley / 'door_open_servo.wav', 31.8, -5.0),
        (st_foley / 'curtain.wav', 34.8, 0.0),
    ]
    
    inputs, chains = [], []
    idx = 0
    voice_labels = []
    for p, st in voice_cues:
        inputs += ['-i', str(p)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,adelay={ms}|{ms},apad[v{idx}]")
        voice_labels.append(f"[v{idx}]")
        idx += 1
        
    foley_labels = []
    for p, st, vol in foley_cues:
        inputs += ['-i', str(p)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,volume={vol}dB,adelay={ms}|{ms},apad[fx{idx}]")
        foley_labels.append(f"[fx{idx}]")
        idx += 1
        
    num_v = len(voice_cues)
    num_fx = len(foley_cues)
    
    v_mix = "".join(voice_labels) + f"amix=inputs={num_v}:normalize=0:duration=longest[voice_mix]"
    fx_mix = "".join(foley_labels) + f"amix=inputs={num_fx}:normalize=0:duration=longest[fx_mix_raw]"
    fx_ducked = "[fx_mix_raw]volume=-9dB[fx_mix]"
    final_mix = "[voice_mix][fx_mix]amix=inputs=2:normalize=0:duration=longest[mix]"
    
    filter_graph = ";".join(chains + [v_mix, fx_mix, fx_ducked, final_mix])
    
    premix_wav = tmp_dir / 'lift_v1_premix.wav'
    dur_str = "38.633"
    
    cmd_premix = [
        'ffmpeg', '-v', 'error', '-y',
        *inputs,
        '-filter_complex', filter_graph,
        '-map', '[mix]',
        '-t', dur_str,
        str(premix_wav)
    ]
    run_cmd(cmd_premix, "Рендер предварительного аудио-микса (голос + Foley)")
    
    print("--> Измерение громкости EBU R128 первого прохода...")
    p1 = get_loudness_stats(premix_wav)
    print(f"    Raw stats: I={p1['input_i']} LUFS, TP={p1['input_tp']} dBTP, offset={p1['target_offset']}")
    
    tp_safe = TARGET_TP - 0.05
    offset_adj = float(p1["target_offset"]) + 0.12
    norm_af = (
        f"loudnorm=I={TARGET_LUFS}:TP={tp_safe:.2f}:LRA=11:"
        f"measured_I={p1['input_i']}:measured_TP={p1['input_tp']}:"
        f"measured_LRA={p1['input_lra']}:measured_thresh={p1['input_thresh']}:"
        f"offset={offset_adj:.2f}:linear=true"
    )
    
    norm_wav = tmp_dir / 'lift_v1_norm.wav'
    cmd_norm = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(premix_wav),
        '-af', norm_af,
        '-ar', '48000',
        str(norm_wav)
    ]
    run_cmd(cmd_norm, "Применение двухпроходной громкости EBU R128")
    
    # 3. Dynamic ink wipe patch on frames 449-455
    run_cmd([
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(video_in),
        '-vf', r'select=between(n\,449\,456)',
        '-fps_mode', 'passthrough',
        '-start_number', '449',
        str(tmp_dir / 'raw_f_%04d.png')
    ], 'Извлечение кадров 449-456 за один проход')
    
    im456 = np.array(Image.open(tmp_dir / 'raw_f_0456.png'))
    sub456 = im456[1540:1630, 50:1030]
    ink_mask456 = (sub456 < 90).all(axis=-1)
    
    patched_frames_dir = tmp_dir / 'patched_frames'
    patched_frames_dir.mkdir(parents=True, exist_ok=True)
    
    for f in range(449, 456):
        raw_frame_path = tmp_dir / f'raw_f_{f:04d}.png'
        im_f = np.array(Image.open(raw_frame_path))
        sub_f = im_f[1540:1630, 50:1030]
        clay_f = (sub_f[:,:,0]>160)&(sub_f[:,:,1]>80)&(sub_f[:,:,1]<160)&(sub_f[:,:,2]>60)&(sub_f[:,:,2]<140)
        yc, xc = np.where(clay_f)
        strip_patch = np.zeros((90, 980, 4), dtype=np.uint8)
        if len(xc):
            x_tip = xc.max()
            reveal = (np.arange(sub_f.shape[1])[None, :] <= (x_tip - 10)) & ink_mask456
            strip_patch[reveal, :3] = sub456[reveal]
            strip_patch[reveal, 3] = 255
        Image.fromarray(strip_patch, mode='RGBA').save(patched_frames_dir / f'patch_{f:04d}.png')
        
    vf = (
        '[1:v]setpts=PTS-STARTPTS+(449/30)/TB[patch];'
        '[0:v][patch]overlay=50:1540:enable=\'between(n,449,455)\'[v]'
    )
    
    out_master_v1 = RENDERS_DIR / 'lift_master_v1_0.mp4'
    out_master_stuck = RENDERS_DIR / 'lift_stuck_master.mp4'
    
    cmd_master = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(video_in),
        '-framerate', '30', '-start_number', '449', '-i', str(patched_frames_dir / 'patch_%04d.png'),
        '-i', str(norm_wav),
        '-filter_complex', vf,
        '-map', '[v]',
        '-map', '2:a',
        '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-movflags', '+faststart',
        '-t', dur_str,
        str(out_master_v1)
    ]
    run_cmd(cmd_master, "Финальный рендер мастера «Застрял в лифте» с динамическим видеопатчем и сведением")
    
    shutil.copy2(out_master_v1, CHTOESLI_RENDERS_DIR / 'lift_master_v1_0.mp4')
    shutil.copy2(out_master_v1, out_master_stuck)
    shutil.copy2(out_master_v1, CHTOESLI_RENDERS_DIR / 'lift_stuck_master.mp4')
    print(f"Файл сохранен: {out_master_v1}")
    print(f"Копия сохранена: {CHTOESLI_RENDERS_DIR / 'lift_master_v1_0.mp4'}")
    print(f"Копия сохранена: {out_master_stuck}")
    print(f"Копия сохранена: {CHTOESLI_RENDERS_DIR / 'lift_stuck_master.mp4'}")
    
    # 4. Generate crisp 1080x1920 cover
    cover_src_path = BASE_DIR / 'work/tmp/cover_lift_orig_768x1376.jpg'
    if not cover_src_path.exists():
        cover_src_path = BASE_DIR / 'chtoesli/branding/cover_lift_9x16.jpg'
    if cover_src_path.exists():
        cover_src = Image.open(cover_src_path)
        target_w, target_h = 1080, 1920
        scale = max(target_w / cover_src.width, target_h / cover_src.height)
        new_w = int(round(cover_src.width * scale))
        new_h = int(round(cover_src.height * scale))
        resized = cover_src.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        cropped = resized.crop((left, top, left + target_w, top + target_h))
        crisp_cover = cropped.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=3))
        for dst in [
            BASE_DIR / 'chtoesli/branding/cover_lift_9x16.jpg',
            BASE_DIR / 'chtoesli/renders/cover_lift_9x16.jpg',
            BASE_DIR / 'renders/cover_lift_9x16.jpg',
        ]:
            dst.parent.mkdir(parents=True, exist_ok=True)
            crisp_cover.save(dst, quality=95)
            
    final_stats = get_loudness_stats(out_master_v1)
    print(f"Контроль мастера Лифта: {final_stats['input_i']} LUFS, True Peak: {final_stats['input_tp']} dBTP")


def build_brain_master():
    print("\n==========================================")
    print("2. СБОРКА И МАСТЕРИНГ: «Мозг на 100%»")
    print("==========================================")
    
    video_in = BASE_DIR / 'Незаконченные видео/brain100_short_v10.mp4'
    ep_dir = BASE_DIR / 'chtoesli/episodes/brain100'
    voice_dir = ep_dir / 'voice'
    foley_dir = ep_dir / 'foley'
    
    # 1. Голосовые дорожки с таймингами появления титров
    # b01_fast: 0.07s-2.97s -> старт 0.15s (dur 2.74s, ends 2.89s)
    # b02: 3.13s-8.27s -> старт 3.35s (dur 3.21s, ends 6.56s)
    # b03: 8.43s-14.07s -> старт 8.65s (dur 2.89s, ends 11.54s)
    # b04: 14.23s-18.90s -> старт 14.45s (dur 2.84s, ends 17.29s)
    # b05_fast: 19.07s-23.70s -> старт 19.25s (dur 4.25s, ends 23.50s)
    # b06: 23.87s-27.90s -> старт 24.10s (dur 2.66s, ends 26.76s)
    # b07: 28.07s-35.10s -> старт 28.30s (dur 3.06s, ends 31.36s)
    # b08: 35.27s-42.30s -> старт 35.50s (dur 3.49s, ends 38.99s)
    # b09: 42.47s-46.30s -> старт 42.65s (dur 3.31s, ends 45.96s)
    voice_cues = [
        ('b01_fast.wav', 0.10),
        ('b02.wav', 3.35),
        ('b03.wav', 8.65),
        ('b04.wav', 14.45),
        ('b05_fast.wav', 19.25),
        ('b06.wav', 24.10),
        ('b07.wav', 28.30),
        ('b08.wav', 35.50),
        ('b09.wav', 42.65),
    ]
    
    # 2. Foley дорожки
    foley_cues = [
        ('room_ambiance.wav', 0.0, -20.0),       # атмосфера бумажной комнаты
        ('switch_lever.wav', 0.70, -10.0),       # включение рубильника на 100% (кадр 22 / 0.733 с)
        ('head_hatch.wav', 3.30, -12.0),         # открытие макушки (кадр 99 / 3.300 с)
        ('steps_walk.wav', 9.20, -14.0),         # шаги по комнате («двигаемся»)
        ('neural_zap.wav', 14.37, -12.0),        # электрический разряд клеток (кадр 431 / 14.367 с)
        ('dial_tick.wav', 19.25, -14.0),         # шкала 2% массы тела (кадр 577 / 19.233 с)
        ('dial_tick.wav', 20.30, -14.0),         # шкала 20% энергии
        ('lamp_click.wav', 24.00, -12.0),        # щелчок лампы (мощность 20 Вт, кадр 720 / 24.000 с)
        ('taxi_pass.wav', 29.50, -12.0),         # лондонское такси (клаксон и мотор)
        ('card_pop.wav', 36.20, -14.0),          # карточка «спи»
        ('card_pop.wav', 37.20, -14.0),          # карточка «двигайся»
        ('card_pop.wav', 38.20, -14.0),          # карточка «учись»
        ('cat_purr.wav', 42.80, -15.0),          # мурлыканье кота в финале (кадр 1280 / 42.667 с)
    ]
    
    inputs = []
    chains = []
    
    idx = 0
    voice_labels = []
    for fname, st in voice_cues:
        inputs += ['-i', str(voice_dir / fname)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,adelay={ms}|{ms},apad[v{idx}]")
        voice_labels.append(f"[v{idx}]")
        idx += 1
        
    foley_labels = []
    for fname, st, vol in foley_cues:
        inputs += ['-i', str(foley_dir / fname)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,volume={vol}dB,adelay={ms}|{ms},apad[fx{idx}]")
        foley_labels.append(f"[fx{idx}]")
        idx += 1
        
    num_v = len(voice_cues)
    num_fx = len(foley_cues)
    
    v_mix = "".join(voice_labels) + f"amix=inputs={num_v}:normalize=0:duration=longest[voice_mix]"
    fx_mix = "".join(foley_labels) + f"amix=inputs={num_fx}:normalize=0:duration=longest[fx_mix_raw]"
    fx_ducked = "[fx_mix_raw]volume=-9dB[fx_mix]"
    final_mix = "[voice_mix][fx_mix]amix=inputs=2:normalize=0:duration=longest[mix]"
    
    filter_graph = ";".join(chains + [v_mix, fx_mix, fx_ducked, final_mix])
    
    premix_wav = ep_dir / 'brain_premix.wav'
    dur_str = "46.400"
    
    cmd_premix = [
        'ffmpeg', '-v', 'error', '-y',
        *inputs,
        '-filter_complex', filter_graph,
        '-map', '[mix]',
        '-t', dur_str,
        str(premix_wav)
    ]
    run_cmd(cmd_premix, "Рендер предварительного аудио-микса (голос + Foley)")
    
    print("--> Измерение громкости EBU R128 первого прохода...")
    stats = get_loudness_stats(premix_wav)
    print(f"    Вход: I={stats['input_i']} LUFS, TP={stats['input_tp']} dBTP, LRA={stats['input_lra']}")
    
    norm_af = (
        f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=11:"
        f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}:linear=true"
    )
    
    norm_wav = ep_dir / 'brain_norm.wav'
    cmd_norm = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(premix_wav),
        '-af', norm_af,
        '-ar', '48000',
        str(norm_wav)
    ]
    run_cmd(cmd_norm, "Применение двухпроходной громкости EBU R128")
    
    norm_stats = get_loudness_stats(norm_wav)
    print(f"    Результат нормализации: I={norm_stats['input_i']} LUFS, TP={norm_stats['input_tp']} dBTP")
    
    # Финальный мастер: видеоряд берем напрямую без сток-музыки (-map 0:v -c:v copy)
    out_master = RENDERS_DIR / 'brain100_master.mp4'
    cmd_master = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(video_in),
        '-i', str(norm_wav),
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-t', dur_str,
        str(out_master)
    ]
    run_cmd(cmd_master, "Финальный рендер мастера «Мозг на 100%» (замена звука)")
    
    shutil.copy2(out_master, CHTOESLI_RENDERS_DIR / out_master.name)
    print(f"Файл сохранен: {out_master}")
    print(f"Копия сохранена: {CHTOESLI_RENDERS_DIR / out_master.name}")
    
    final_stats = get_loudness_stats(out_master)
    print(f"Контроль мастера Мозга: {final_stats['input_i']} LUFS, True Peak: {final_stats['input_tp']} dBTP")


if __name__ == '__main__':
    build_lift_master()
    build_brain_master()
    print("\nВСЕ МАСТЕР-ФАЙЛЫ УСПЕШНО СОБРАНЫ!")
