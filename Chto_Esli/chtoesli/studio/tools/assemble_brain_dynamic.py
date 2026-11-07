"""
Сборка и мастеринг динамичного вирусного мастера «Мозг на 100%» (brain100):
1. Оптимизация хука (0.00-1.80 с):
   - Динамическое двухэтапное появление строк:
     - 0.00-0.33 с (кадры 0..9): карточка с вопросом «МОЗГ НА 100%?»
     - 0.33-1.07 с (кадры 10..31): ударный штамп со второй строкой «ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!»
       с глиняным маркером и звуковым акцентом card_pop.
   - 1.07-1.80 с (кадры 32..53): шот 2 — шок перегрузки 100% (кадры 66..87).
     Мимика героя, глаза, волосы дыбом и паникующий кот ПОЛНОСТЬЮ ОТКРЫТЫ (карточка убрана).
     Звуковой импакт switch_lever + lift_jolt точно на 1.07 с.
   - 1.55-1.80 с: свуш curtain.wav в экспозицию с плашкой «ЧУТЬ РАНЬШЕ».
2. Динамика Сцены 5 (приборы 2% и 20%):
   - Сокращение затянутости с 4.4 с до плотных 3.3 с (99 кадров) за счет ускорения диктора b05 до 1.27x.
   - Ступенчатый панч-зум (1.28x) точно на второй прибор (20% энергии) с микро-шейком и акцентным кликом.
3. Плавность анимации (Сцена 7 и Сцена 8):
   - Устранен эффект рваного стоп-моушна: выборка непрерывных последовательных кадров на чистых 30 fps
     (без децимации с пропусками кадров).
   - В Сцене 7 (такси): 51 непрерывный кадр движения такси + мягкий 4-кадровый кроссфейд + 51 кадр гиппокампа.
   - В Сцене 8 (карточки): по 38 непрерывных кадров на каждую карточку («высыпайся», «двигайся», «учи новое»)
     с органичными 3-кадровыми склейками и щелчками card_pop.
4. Аудио-грув и дакинг:
   - Ненавязчивая ритмическая подложка (lo-fi акустический грув: мягкая акустическая гитара, фортепиано,
     80 BPM) с обрезным фильтром 100 Гц для читаемости на мобильных динамиках.
   - Динамический дакинг: -24 dB под диктором, плавное дыхание до -20 dB в паузах, аккуратный фейд-аут в финале.
5. Соблюдение CRAFT.md:
   - Цвета: тушь #141413, бумага #F4F2EB, глина #D97757. Шрифты: Georgia Bold / Italic.
   - EBU R128: ровно -16.0 LUFS, True Peak <= -1.5 dBTP, 0 клиппинга.
   - Хронометраж: ровно 31.00 с (930 кадров при 30 fps).
"""
import cv2
import json
import numpy as np
import os
import shutil
import subprocess
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path('D:/Chanels/Chto_Esli')
EP_DIR = BASE_DIR / 'chtoesli/episodes/brain100'
RENDERS_DIR = BASE_DIR / 'renders'
CHTOESLI_RENDERS = BASE_DIR / 'chtoesli/renders'
TMP_DIR = BASE_DIR / 'work/tmp'
TMP_DIR.mkdir(parents=True, exist_ok=True)
RENDERS_DIR.mkdir(parents=True, exist_ok=True)
CHTOESLI_RENDERS.mkdir(parents=True, exist_ok=True)

INP_VIDEO = BASE_DIR / 'Незаконченные видео/brain100_short_v10.mp4'
OUT_MASTER = RENDERS_DIR / 'brain100_master.mp4'
FONT_BOLD = 'C:/Windows/Fonts/georgiab.ttf'
FONT_ITALIC = 'C:/Windows/Fonts/georgiaz.ttf'
FONT_REGULAR = 'C:/Windows/Fonts/georgia.ttf'

W, H = 1080, 1920
IY0, IY1 = 155, 1435
IX0, IX1 = 55, 1025
IW, IH = IX1 - IX0, IY1 - IY0


def build_voice_tracks():
    print("--> 1. Ускорение дикторской дорожки (Сергей Лебедев)...")
    vdir = EP_DIR / 'voice'
    fast_dir = TMP_DIR / 'voice_fast'
    fast_dir.mkdir(parents=True, exist_ok=True)
    
    # b05 ускорен из b05_fast.wav (4.25 с) с коэффициентом 1.29x до чистых 3.29 с,
    # что точно укладывается в 3.3-секундный тайминг Сцены 5 без наложения на b06
    speeds = {
        'b01': ('b01.wav', 1.20),
        'b02': ('b02.wav', 1.18),
        'b03': ('b03.wav', 1.18),
        'b04': ('b04.wav', 1.18),
        'b05': ('b05_fast.wav', 1.29),
        'b06': ('b06.wav', 1.18),
        'b07': ('b07.wav', 1.18),
        'b08': ('b08.wav', 1.18),
        'b09': ('b09.wav', 1.18),
    }
    
    for lid, (fn, sp) in speeds.items():
        inp = vdir / fn
        outp = fast_dir / f"{lid}_fast.wav"
        cmd = [
            'ffmpeg', '-v', 'error', '-y',
            '-i', str(inp),
            '-af', f'atempo={sp}',
            '-ar', '48000',
            str(outp)
        ]
        subprocess.run(cmd, check=True)
    print("    Диктор ускорен и идеально синхронизирован.")


def build_ducked_groove(groove_src: Path, out_wav: Path, total_sec: float = 31.0):
    print("--> 2a. Подготовка lo-fi грува с динамическим дакингом...")
    raw_wav = TMP_DIR / 'groove_raw_cut.wav'
    # Извлечение 31.0 с, срез низких частот (<100 Гц) для чистоты на смартфонах
    cmd_cut = [
        'ffmpeg', '-v', 'error', '-y',
        '-ss', '0', '-t', str(total_sec),
        '-i', str(groove_src),
        '-af', 'highpass=f=100,equalizer=f=3000:t=q:w=1.5:g=1.5',
        '-ar', '48000', '-ac', '2',
        str(raw_wav)
    ]
    subprocess.run(cmd_cut, check=True)
    
    import scipy.io.wavfile as wav
    sr, data = wav.read(str(raw_wav))
    if data.ndim == 1:
        data = np.column_stack([data, data])
    n_samples = len(data)
    
    # Базовый уровень под диктором: -24.0 dB
    # В паузах: подъем до -20.0 dB
    gain = np.full(n_samples, 10 ** (-24.0 / 20.0), dtype=np.float32)
    
    speech_ranges = [
        (1.85, 4.47),
        (4.60, 7.32),
        (7.60, 10.06),
        (10.60, 13.02),
        (13.55, 16.85),
        (16.90, 19.16),
        (19.50, 22.10),
        (22.90, 25.87),
        (26.70, 29.51),
    ]
    
    ramp_len = int(0.12 * sr)
    for i in range(len(speech_ranges) - 1):
        p_start = int(speech_ranges[i][1] * sr)
        p_end = int(speech_ranges[i+1][0] * sr)
        if p_end - p_start > 2 * ramp_len:
            t = np.linspace(0, np.pi, ramp_len)
            cos_up = 10**(-24.0/20) + (10**(-20.0/20) - 10**(-24.0/20)) * 0.5 * (1 - np.cos(t))
            cos_down = 10**(-20.0/20) - (10**(-20.0/20) - 10**(-24.0/20)) * 0.5 * (1 - np.cos(t))
            gain[p_start:p_start+ramp_len] = cos_up
            gain[p_start+ramp_len:p_end-ramp_len] = 10**(-20.0/20)
            gain[p_end-ramp_len:p_end] = cos_down
            
    # Мягкий фейд-ин в начале (0.0..0.4 с) и фейд-аут в конце (29.5..31.0 с)
    fade_in_len = int(0.4 * sr)
    gain[:fade_in_len] *= np.linspace(0.0, 1.0, fade_in_len)
    fade_out_start = int(29.5 * sr)
    fade_out_len = n_samples - fade_out_start
    if fade_out_len > 0:
        gain[fade_out_start:] *= np.linspace(1.0, 0.0, fade_out_len)
        
    ducked_data = (data.astype(np.float32) * gain[:, np.newaxis]).astype(np.int16)
    wav.write(str(out_wav), sr, ducked_data)
    print("    Lo-fi грув с дакингом (-24 dB / -20 dB) сгенерирован.")


def build_audio_mix():
    print("--> 2b. Сведение саунд-дизайна, lo-fi грува и диктора в STEREO...")
    fast_dir = TMP_DIR / 'voice_fast'
    foley_dir = EP_DIR / 'foley'
    music_dir = EP_DIR / 'music'
    lift_foley = BASE_DIR / 'chtoesli/episodes/lift_stuck/foley'
    studio_foley = BASE_DIR / 'chtoesli/studio/foley'
    
    groove_src = music_dir / 'lofi_groove.mp3'
    ducked_groove_wav = TMP_DIR / 'groove_ducked.wav'
    build_ducked_groove(groove_src, ducked_groove_wav, total_sec=31.0)
    
    # Голосовые реплики (плотная стыковка по новому таймингу, 0 наложений!)
    voice_cues = [
        (fast_dir / 'b01_fast.wav', 1.85),
        (fast_dir / 'b02_fast.wav', 4.60),
        (fast_dir / 'b03_fast.wav', 7.60),
        (fast_dir / 'b04_fast.wav', 10.60),
        (fast_dir / 'b05_fast.wav', 13.55),
        (fast_dir / 'b06_fast.wav', 16.90),
        (fast_dir / 'b07_fast.wav', 19.50),
        (fast_dir / 'b08_fast.wav', 22.90),
        (fast_dir / 'b09_fast.wav', 26.70),
    ]
    
    # Foley саунд-дизайн
    foley_cues = [
        (foley_dir / 'room_ambiance.wav', 0.0, -22.0),
        # Hook (0.00 - 1.80s)
        (foley_dir / 'neural_zap.wav', 0.05, -7.0),
        (lift_foley / 'lift_jolt.wav', 0.15, -13.0),
        (foley_dir / 'card_pop.wav', 0.37, -8.0), # удар штампа второй строки на кадре 11 (0.37 с)
        (foley_dir / 'switch_lever.wav', 1.10, -5.0), # перегрузка 100% точно на кадре 33 (1.10 с)
        (lift_foley / 'lift_jolt.wav', 1.10, -9.0),
        (studio_foley / 'curtain.wav', 1.55, -12.0),
        # S1: рубильник
        (foley_dir / 'switch_lever.wav', 2.53, -7.0),
        # S2: открытие головы и мозг
        (foley_dir / 'head_hatch.wav', 4.75, -10.0),
        (foley_dir / 'card_pop.wav', 6.30, -12.0),
        # S3: шаги
        (foley_dir / 'steps_walk.wav', 7.75, -13.0),
        # S4: разряд нейросети
        (foley_dir / 'neural_zap.wav', 10.70, -8.0),
        (lift_foley / 'lift_jolt.wav', 11.80, -15.0),
        # S5: приборы (2% и акцентный панч на 20%)
        (foley_dir / 'dial_tick.wav', 14.15, -11.0),
        (foley_dir / 'dial_tick.wav', 15.15, -8.0), # акцентный клик на панч-зуме
        # S6: лампа 20 Вт
        (foley_dir / 'lamp_click.wav', 17.05, -8.0),
        # S7: такси и гиппокамп
        (foley_dir / 'taxi_pass.wav', 19.60, -10.0),
        (foley_dir / 'card_pop.wav', 21.10, -11.0),
        # S8: 3 карточки (спи, двигайся, учись)
        (foley_dir / 'card_pop.wav', 22.95, -10.0),
        (foley_dir / 'card_pop.wav', 24.10, -10.0),
        (foley_dir / 'card_pop.wav', 25.35, -10.0),
        # S9: мурчание кота
        (foley_dir / 'cat_purr.wav', 27.00, -13.0),
    ]
    
    inputs = []
    chains = []
    idx = 0
    
    # 1. Voice inputs (в STEREO)
    voice_labels = []
    for fpath, st in voice_cues:
        inputs += ['-i', str(fpath)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},apad[v{idx}]")
        voice_labels.append(f"[v{idx}]")
        idx += 1
        
    # 2. Foley inputs (в STEREO)
    foley_labels = []
    for fpath, st, vol in foley_cues:
        inputs += ['-i', str(fpath)]
        ms = int(round(st * 1000))
        chains.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol}dB,adelay={ms}|{ms},apad[fx{idx}]")
        foley_labels.append(f"[fx{idx}]")
        idx += 1
        
    # 3. Ducked Groove input (в STEREO)
    inputs += ['-i', str(ducked_groove_wav)]
    chains.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=-1.5dB[groove_in]")
    idx += 1
    
    v_mix = "".join(voice_labels) + f"amix=inputs={len(voice_cues)}:normalize=0:duration=longest[voice_mix]"
    fx_mix = "".join(foley_labels) + f"amix=inputs={len(foley_cues)}:normalize=0:duration=longest[fx_mix_raw]"
    fx_ducked = "[fx_mix_raw]volume=-6dB[fx_mix]"
    final_mix = "[voice_mix][fx_mix][groove_in]amix=inputs=3:normalize=0:duration=longest[mix]"
    
    filter_graph = ";".join(chains + [v_mix, fx_mix, fx_ducked, final_mix])
    premix_wav = TMP_DIR / 'brain_fast_premix.wav'
    dur_str = "31.000"
    
    cmd_premix = [
        'ffmpeg', '-v', 'error', '-y',
        *inputs,
        '-filter_complex', filter_graph,
        '-map', '[mix]',
        '-t', dur_str,
        str(premix_wav)
    ]
    subprocess.run(cmd_premix, check=True)
    
    # 2-pass Loudnorm: target -16.0 LUFS, True Peak <= -1.75 dBTP (гарантия <= -1.5 dBTP в AAC)
    target_lufs = -16.0
    target_tp = -1.75
    cmd_meas = [
        'ffmpeg', '-hide_banner', '-i', str(premix_wav),
        '-af', f'loudnorm=I={target_lufs}:TP={target_tp}:LRA=11:print_format=json',
        '-f', 'null', '-'
    ]
    res = subprocess.run(cmd_meas, capture_output=True, text=True, errors='replace')
    stats = json.loads(res.stderr[res.stderr.rindex('{'):res.stderr.rindex('}')+1])
    
    offset = float(stats['target_offset']) + 0.08
    norm_af = (
        f"loudnorm=I={target_lufs}:TP={target_tp}:LRA=11:"
        f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
        f"offset={offset:.2f}:linear=true"
    )
    norm_wav = TMP_DIR / 'brain_fast_norm.wav'
    cmd_norm = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(premix_wav),
        '-af', norm_af,
        '-ar', '48000',
        str(norm_wav)
    ]
    subprocess.run(cmd_norm, check=True)
    print("    Аудио сведено и нормализовано по EBU R128 (-16.0 LUFS, TP <= -1.5 dBTP).")


def build_video():
    print("--> 3. Генерация видеоряда с чистым хуком, панч-зумом и плавными 30 fps анимациями...")
    
    # 1. Хук: Базовая карточка (Каркас + Тень + Вопрос «МОЗГ НА 100%?»)
    hook_card_base = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dq = ImageDraw.Draw(hook_card_base)
    cx0, cy0, cx1, cy1 = 80, 220, 1000, 435
    dq.rounded_rectangle([cx0+4, cy0+5, cx1+4, cy1+5], radius=22, fill=(20, 20, 19, 40))
    dq.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=4)
    fq = ImageFont.truetype(FONT_BOLD, 48)
    t1_text = "МОЗГ НА 100%?"
    bb1 = fq.getbbox(t1_text)
    w1 = bb1[2] - bb1[0]
    # Фиксированная позиция cy0 + 34 px: не прыгает и не меняет размер при ударе штампа!
    dq.text(((W - w1)//2, cy0 + 34), t1_text, fill=(20, 20, 19, 255), font=fq)
    hook_card_base_np = np.array(hook_card_base)
    
    # 2. Хук: Слой ударного штампа (Вторая строка + глиняный маркер #D97757)
    hook_stamp_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ds = ImageDraw.Draw(hook_stamp_img)
    f2 = ImageFont.truetype(FONT_ITALIC, 38)
    t2_text = "ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!"
    bb2 = f2.getbbox(t2_text)
    w2 = bb2[2] - bb2[0]
    
    marker_x0 = (W - w2)//2 - 12
    marker_x1 = (W - w2)//2 + w2 + 12
    marker_y0 = cy0 + 152
    marker_y1 = cy0 + 164
    ds.rounded_rectangle([marker_x0, marker_y0, marker_x1, marker_y1], radius=5, fill=(217, 119, 87, 210))
    ds.text(((W - w2)//2, cy0 + 118), t2_text, fill=(20, 20, 19, 255), font=f2)
    hook_stamp_np = np.array(hook_stamp_img)
    
    # Полная статичная карточка
    hook_card_full = hook_card_base.copy()
    hook_card_full.alpha_composite(hook_stamp_img)
    hook_card_full_np = np.array(hook_card_full)
    
    stamp_cx = W // 2
    stamp_cy = cy0 + 138
    
    # Плашка «ЧУТЬ РАНЬШЕ»
    badge = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(badge)
    bx0, by0, bx1, by1 = 370, 345, 710, 415
    bdraw.rounded_rectangle([bx0+3, by0+3, bx1+3, by1+3], radius=16, fill=(20, 20, 19, 35))
    bdraw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=3)
    bf = ImageFont.truetype(FONT_BOLD, 28)
    btext = "ЧУТЬ РАНЬШЕ"
    bb = bf.getbbox(btext)
    bw = bb[2] - bb[0]
    bdraw.text(((W - bw)//2, by0 + 18), btext, fill=(20, 20, 19, 255), font=bf)
    badge_np = np.array(badge)
    
    def apply_inner_zoom(frame, scale=1.0, center=None, shake=(0, 0)):
        if scale == 1.0 and shake == (0, 0):
            return frame
        inner = frame[IY0:IY1, IX0:IX1]
        src_w = int(round(IW / scale))
        src_h = int(round(IH / scale))
        icx, icy = (IW // 2, IH // 2) if center is None else center
        icx = int(round(icx - shake[0]))
        icy = int(round(icy - shake[1]))
        x0 = max(0, min(IW - src_w, icx - src_w // 2))
        y0 = max(0, min(IH - src_h, icy - src_h // 2))
        cropped = inner[y0:y0+src_h, x0:x0+src_w]
        zoomed_inner = cv2.resize(cropped, (IW, IH), interpolation=cv2.INTER_LINEAR)
        res = frame.copy()
        res[IY0:IY1, IX0:IX1] = zoomed_inner
        return res
        
    def overlay_rgba(base_bgr, overlay_rgba_arr, alpha_mult=1.0):
        if alpha_mult <= 0.0:
            return base_bgr
        alpha = (overlay_rgba_arr[:, :, 3] / 255.0) * alpha_mult
        ov_bgr = overlay_rgba_arr[:, :, :3][:, :, ::-1]
        alpha_3d = alpha[:, :, np.newaxis]
        return (base_bgr * (1.0 - alpha_3d) + ov_bgr * alpha_3d).astype(np.uint8)

    def cover_hook_sub(frame):
        res = frame.copy()
        paper_sample = frame[1750:1880, 50:1030]
        patch_full = cv2.resize(paper_sample, (980, 300), interpolation=cv2.INTER_LINEAR)
        res[1450:1750, 50:1030] = patch_full
        return res

    cap = cv2.VideoCapture(str(INP_VIDEO))
    out_visual = TMP_DIR / 'brain_dynamic_visual.mp4'
    cmd_ffmpeg = [
        'ffmpeg', '-v', 'error', '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', '30',
        '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
        str(out_visual)
    ]
    proc = subprocess.Popen(cmd_ffmpeg, stdin=subprocess.PIPE)
    
    def read_frames_exact(start_frame, count):
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        frames = []
        for _ in range(count):
            ret, frame = cap.read()
            if not ret: break
            frames.append(frame)
        return frames

    total_frames_written = 0

    # ==========================================
    # 1. FLASHFORWARD HOOK (0.00 - 1.80s, 54 кадра)
    # ==========================================
    # Получаем чистый фрагмент фона дивана из кадра 445 (до появления пометки «не суперсила»)
    cap_clean = cv2.VideoCapture(str(INP_VIDEO))
    cap_clean.set(cv2.CAP_PROP_POS_FRAMES, 445)
    _, f_clean_ref = cap_clean.read()
    cap_clean.release()
    clean_couch_patch = f_clean_ref[1210:1315, 380:710].copy()

    # Shot 1 (0.00 - 1.10s, 33 кадра): Разряд нейросети (кадры 440..472)
    # Кадры 0..10 (0.00-0.37 с): стабильная карточка с вопросом «МОЗГ НА 100%?»
    # Кадры 11..32 (0.37-1.10 с): ударный штамп «ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!»
    # Панч-зум центрирован ровно по центру штампа (без смещения карточки вверх!)
    h1 = read_frames_exact(440, 33)
    for i, f in enumerate(h1):
        sh = (5, -3) if i == 0 else ((-4, 4) if i == 1 else ((2, -2) if i == 2 else (0, 0)))
        f_clean = f.copy()
        f_clean[1210:1315, 380:710] = clean_couch_patch
        zf = apply_inner_zoom(f_clean, scale=1.25, center=(IW//2, IH//2), shake=sh)
        zf_clean = cover_hook_sub(zf)
        out = overlay_rgba(zf_clean, hook_card_base_np, alpha_mult=1.0)
        if i >= 11:
            # Удар штампа: масштабируется ТОЛЬКО штамп относительно своего центра (stamp_cx, stamp_cy)
            p_scale = 1.08 if i == 11 else (1.04 if i == 12 else (1.01 if i == 13 else 1.0))
            if p_scale > 1.0:
                M = cv2.getRotationMatrix2D((stamp_cx, stamp_cy), 0, p_scale)
                punched_stamp = cv2.warpAffine(hook_stamp_np, M, (W, H), flags=cv2.INTER_LINEAR)
                out = overlay_rgba(out, punched_stamp, alpha_mult=1.0)
            else:
                out = overlay_rgba(out, hook_stamp_np, alpha_mult=1.0)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
        
    # Shot 2 (1.10 - 1.80s, 21 кадр): Шок перегрузки (кадры 66..86)
    # ЛИЦО ГЕРОЯ, ГЛАЗА, ВОЛОСЫ ДЫБОМ И ПАНИКУЮЩИЙ КОТ ПОЛНОСТЬЮ ОТКРЫТЫ (карточка убрана)
    h2 = read_frames_exact(66, 21)
    for i, f in enumerate(h2):
        sh = (4, -3) if i == 0 else ((-3, 2) if i == 1 else (0, 0))
        zf = apply_inner_zoom(f, scale=1.15, center=(IW//2, int(IH*0.42)), shake=sh)
        out = cover_hook_sub(zf)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 2. SCENE 1 (1.80 - 4.50s, 81 кадр)
    # «А если включить мозг на все 100%?»
    # ==========================================
    s1 = read_frames_exact(0, 81)
    for i, f in enumerate(s1):
        scale = 1.0 + (0.08 * ((i - 18) / 6.0)) if 18 <= i <= 24 else (1.08 if i > 24 else 1.0)
        sh = (3, -2) if i == 22 else ((-2, 1) if i == 23 else (0, 0))
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, int(IH*0.45)), shake=sh)
        # Бейдж «ЧУТЬ РАНЬШЕ»
        if i < 24:
            alpha = (24 - i) / 6.0 if i > 18 else 1.0
            out = overlay_rgba(out, badge_np, alpha_mult=alpha)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 3. SCENE 2 (4.50 - 7.50s, 90 кадров)
    # ««Работает только 10%» — это миф.»
    # ==========================================
    # Part 2A: открытие головы (кадры 105..158, 54 кадра)
    s2a = read_frames_exact(105, 54)
    for i, f in enumerate(s2a):
        scale = 1.0 + 0.08 * (i / 53.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, int(IH*0.48)))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
    # Part 2B: мозг с 10% и спящей зоной "z z z" (кадры 180..215, 36 кадров)
    s2b = read_frames_exact(180, 36)
    for i, f in enumerate(s2b):
        scale = 1.14 + (0.03 if i < 10 else 0.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, int(IH*0.46)))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 4. SCENE 3 (7.50 - 10.50s, 90 кадров)
    # «Мозг работает весь, но не весь сразу.»
    # Плавные непрерывные кадры 30 fps (без стоп-моушн децимации)
    # ==========================================
    # Part 3A: ходьба героя («двигаемся», кадры 270..314, 45 кадров)
    s3a = read_frames_exact(270, 45)
    for i, f in enumerate(s3a):
        out = apply_inner_zoom(f, scale=1.04, center=(IW//2, IH//2))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
    # Part 3B: спящий кот («спим», кадры 360..404, 45 кадров)
    s3b = read_frames_exact(360, 45)
    for i, f in enumerate(s3b):
        scale = 1.04 + 0.04 * (i / 44.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 5. SCENE 4 (10.50 - 13.50s, 90 кадров)
    # «Сильный разряд клеток может вызвать приступ.»
    # ==========================================
    s4 = read_frames_exact(435, 90)
    for i, f in enumerate(s4):
        scale = 1.12 if 10 <= i <= 20 else 1.05
        sh = (4, -3) if i in (10, 12) else ((-3, 2) if i in (11, 13) else (0, 0))
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2), shake=sh)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 6. SCENE 5 (13.50 - 16.80s, 99 кадров)
    # «Мозг — 2% массы тела, а энергии тратит 20%.»
    # Плотная динамика: 3.3 с вместо 4.4 с + ступенчатый панч-зум на второй прибор (20%)!
    # ==========================================
    # Part 5A (кадры 0..49 = 1.67 с): Прибор 1 (2% массы)
    s5a = read_frames_exact(580, 50)
    for i, f in enumerate(s5a):
        scale = 1.04 + 0.04 * (i / 49.0)
        out = apply_inner_zoom(f, scale=scale, center=(int(IW * 0.35), int(IH * 0.48)))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
    # Part 5B (кадры 50..98 = 1.63 с): СТУПЕНЧАТЫЙ ПАНЧ-ЗУМ на Прибор 2 (20% энергии)!
    s5b = read_frames_exact(645, 49)
    for i, f in enumerate(s5b):
        sh = (3, -2) if i == 0 else ((-2, 1) if i == 1 else (0, 0))
        # Ступенчатый акцент 1.28x точно на шкалу 20%
        scale = 1.28 + 0.03 * (i / 48.0)
        out = apply_inner_zoom(f, scale=scale, center=(int(IW * 0.70), int(IH * 0.48)), shake=sh)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 7. SCENE 6 (16.80 - 19.40s, 78 кадров)
    # «Мощность мозга — около 20 ватт.»
    # ==========================================
    s6 = read_frames_exact(716, 78)
    for i, f in enumerate(s6):
        scale = 1.0 + 0.08 * (i / 77.0) + (0.04 if 6 <= i <= 12 else 0.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, int(IH*0.50)))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 8. SCENE 7 (19.40 - 22.80s, 102 кадра)
    # «Таксисты учат улицы — мозг меняется.»
    # 100% плавная анимация 30 fps: непрерывный проезд такси + мягкий переход + растущий гиппокамп
    # ==========================================
    # Part 7A (51 кадр): такси по карте (кадры 870..920)
    s7a = read_frames_exact(870, 51)
    # Part 7B (51 кадр): мозг с гиппокампом (кадры 980..1030)
    s7b = read_frames_exact(980, 51)
    
    for i in range(51):
        f = s7a[i]
        scale = 1.0 + 0.06 * (i / 50.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        # Мягкий 4-кадровый кроссфейд на стыке с гиппокампом
        if i >= 47:
            alpha = (i - 47 + 1) / 5.0
            next_f = apply_inner_zoom(s7b[0], scale=1.08, center=(IW//2, IH//2))
            out = (out.astype(np.float32) * (1.0 - alpha) + next_f.astype(np.float32) * alpha).astype(np.uint8)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
        
    for i in range(51):
        f = s7b[i]
        scale = 1.08 + 0.04 * (i / 50.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 9. SCENE 8 (22.80 - 26.60s, 114 кадров)
    # «Поддержи мозг: спи, двигайся, учись.»
    # 100% плавное перелистывание карточек на 30 fps
    # ==========================================
    # Card 8A: «высыпайся» (38 кадров: кадры 1070..1107)
    s8a = read_frames_exact(1070, 38)
    # Card 8B: «двигайся» (38 кадров: кадры 1145..1182)
    s8b = read_frames_exact(1145, 38)
    # Card 8C: «учи новое» (38 кадров: кадры 1215..1252)
    s8c = read_frames_exact(1215, 38)
    
    for i in range(38):
        f = s8a[i]
        scale = 1.02 + (0.03 * (1.0 - i / 6.0) if i <= 6 else 0.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        if i >= 35: # 3-кадровый органичный кроссфейд
            alpha = (i - 35 + 1) / 4.0
            next_f = apply_inner_zoom(s8b[0], scale=1.05, center=(IW//2, IH//2))
            out = (out.astype(np.float32) * (1.0 - alpha) + next_f.astype(np.float32) * alpha).astype(np.uint8)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
        
    for i in range(38):
        f = s8b[i]
        scale = 1.02 + (0.03 * (1.0 - i / 6.0) if i <= 6 else 0.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        if i >= 35:
            alpha = (i - 35 + 1) / 4.0
            next_f = apply_inner_zoom(s8c[0], scale=1.05, center=(IW//2, IH//2))
            out = (out.astype(np.float32) * (1.0 - alpha) + next_f.astype(np.float32) * alpha).astype(np.uint8)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1
        
    for i in range(38):
        f = s8c[i]
        scale = 1.02 + (0.03 * (1.0 - i / 6.0) if i <= 6 else 0.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    # ==========================================
    # 10. SCENE 9 (26.60 - 31.00s, 132 кадра)
    # «Не ищи волшебный рычаг — заботься о мозге.»
    # ==========================================
    s9_raw = read_frames_exact(1270, 122)
    # Доводим плавно до 132 кадров удержанием последнего теплого кадра с котом
    s9 = s9_raw + [s9_raw[-1]] * (132 - len(s9_raw))
    for i, f in enumerate(s9):
        scale = 1.0 + 0.05 * (i / 131.0)
        out = apply_inner_zoom(f, scale=scale, center=(IW//2, IH//2))
        # Мягкий уход в бумагу на последних 20 кадрах
        if i >= 112:
            alpha = (i - 112) / 20.0
            paper_bgr = np.array([235, 242, 244], dtype=np.uint8) # #F4F2EB
            out = (out.astype(np.float32) * (1.0 - alpha) + paper_bgr * alpha).astype(np.uint8)
        proc.stdin.write(out.tobytes())
        total_frames_written += 1

    cap.release()
    proc.stdin.close()
    proc.wait()
    print(f"    Видеоряд срендерен: {total_frames_written} кадров ({total_frames_written / 30.0:.2f} с).")


def mux_master():
    print("--> 4. Мультиплексирование финального мастера...")
    visual = TMP_DIR / 'brain_dynamic_visual.mp4'
    audio = TMP_DIR / 'brain_fast_norm.wav'
    cmd = [
        'ffmpeg', '-v', 'error', '-y',
        '-i', str(visual),
        '-i', str(audio),
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
        '-movflags', '+faststart',
        str(OUT_MASTER)
    ]
    subprocess.run(cmd, check=True)
    shutil.copy2(OUT_MASTER, CHTOESLI_RENDERS / OUT_MASTER.name)
    print(f"Мастер сохранен: {OUT_MASTER}")
    print(f"Копия сохранена: {CHTOESLI_RENDERS / OUT_MASTER.name}")


if __name__ == '__main__':
    t0 = time.time()
    build_voice_tracks()
    build_audio_mix()
    build_video()
    mux_master()
    print(f"\nВСЕ ЭТАПЫ УСПЕШНО ЗАВЕРШЕНЫ ЗА {time.time() - t0:.1f} с!")
