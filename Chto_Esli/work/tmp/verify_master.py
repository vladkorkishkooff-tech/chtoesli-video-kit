import cv2
import json
import subprocess
from pathlib import Path

video_path = 'renders/brain100_master.mp4'

# 1. ffprobe
probe_cmd = [
    'ffprobe', '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels',
    '-of', 'json', video_path
]
res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
meta = json.loads(res.stdout)
print("=== FFPROBE METADATA ===")
print("Format:", meta['format'])
print("Streams:", meta['streams'])

# 2. Loudnorm verification
loud_cmd = [
    'ffmpeg', '-hide_banner', '-i', video_path,
    '-af', 'loudnorm=I=-16.0:TP=-1.5:LRA=11:print_format=json',
    '-f', 'null', '-'
]
res_l = subprocess.run(loud_cmd, capture_output=True, text=True)
stats = json.loads(res_l.stderr[res_l.stderr.rindex('{'):res_l.stderr.rindex('}')+1])
print("\n=== LOUDNORM METRICS ===")
print(f"Integrated Loudness: {stats['input_i']} LUFS (Target: -16.0)")
print(f"True Peak:           {stats['input_tp']} dBTP (Target: <= -1.5)")
print(f"LRA:                 {stats['input_lra']} LU")
print(f"Threshold:           {stats['input_thresh']} LUFS")

# 3. Extract key verification frames
key_times = [
    (0.4, "hook_shot1_zap"),
    (1.3, "hook_shot2_shock_face_visible"),
    (2.0, "s1_badge_clean"),
    (3.0, "s1_lever_pull"),
    (5.5, "s2_head_open"),
    (7.0, "s2_floating_brain_10pct"),
    (8.5, "s3_walking_hero"),
    (10.0, "s3_sleeping_cat"),
    (12.0, "s4_dark_neural_grid"),
    (15.0, "s5_meters_2pct_20pct"),
    (19.0, "s6_lamp_20w"),
    (21.5, "s7_london_taxi"),
    (23.0, "s7_hippocampus_brain"),
    (24.0, "s8_card_sleep"),
    (25.0, "s8_card_move"),
    (26.0, "s8_card_learn_book"),
    (28.5, "s9_cat_petting"),
    (30.8, "s9_paper_outro"),
]

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"\nTotal video frames: {total_frames} (expected 930), fps={fps}")

out_dir = Path('work/tmp/verified_frames')
out_dir.mkdir(parents=True, exist_ok=True)

for t, name in key_times:
    f_idx = min(int(round(t * fps)), total_frames - 1)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(str(out_dir / f"{name}_t{t:04.1f}s.jpg"), frame)
        print(f"Saved {name} at frame {f_idx} (t={t:.1f}s)")
cap.release()
print("\nVerification frame extraction complete!")
