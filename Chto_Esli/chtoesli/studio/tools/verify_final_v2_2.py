import os
import subprocess
import json

video_path = r'D:\Chanels\Chto_Esli\chtoesli\renders\chtoesli_lavina_v2_2.mp4'
review_dir = r'D:\Chanels\Chto_Esli\chtoesli\review\v2_2_verification'
os.makedirs(review_dir, exist_ok=True)

print("1. Verifying Video & Audio Streams with ffprobe...")
cmd_probe = [
    'ffprobe', '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate:stream=index,codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels',
    '-of', 'json', video_path
]
res_probe = subprocess.run(cmd_probe, capture_output=True, text=True, check=True)
probe_data = json.loads(res_probe.stdout)

streams = probe_data['streams']
v_stream = next(s for s in streams if s['codec_type'] == 'video')
a_stream = next(s for s in streams if s['codec_type'] == 'audio')

print(f"  Duration: {float(probe_data['format']['duration']):.3f}s")
print(f"  Video: {v_stream['codec_name']}, {v_stream['width']}x{v_stream['height']} @ {v_stream['r_frame_rate']} fps")
print(f"  Audio: {a_stream['codec_name']}, {a_stream['sample_rate']} Hz, {a_stream['channels']} ch")

print("\n2. Measuring Audio Loudness (EBU R128)...")
cmd_loud = [
    'ffmpeg', '-hide_banner', '-i', video_path,
    '-af', 'loudnorm=I=-16.0:TP=-1.5:print_format=json',
    '-f', 'null', '-'
]
res_loud = subprocess.run(cmd_loud, capture_output=True, text=True, encoding='utf-8', errors='replace')
log_loud = res_loud.stderr
js_loud = json.loads(log_loud[log_loud.rindex('{'):log_loud.rindex('}') + 1])

print(f"  Integrated Loudness: {js_loud['input_i']} LUFS (Target: -16.0 ±0.5)")
print(f"  True Peak: {js_loud['input_tp']} dBTP (Target: <= -1.5)")
print(f"  LRA: {js_loud['input_lra']} LU")

print("\n3. Extracting Keyframes for Visual Audit...")
test_timestamps = [2.0, 15.0, 26.0, 37.5, 41.5, 44.5, 46.5, 47.8]
for ts in test_timestamps:
    out_frame = os.path.join(review_dir, f'kadr_{ts:.1f}s.jpg')
    cmd_frame = [
        'ffmpeg', '-y', '-ss', str(ts), '-i', video_path,
        '-vframes', '1', '-q:v', '2', out_frame
    ]
    subprocess.run(cmd_frame, check=True)
    print(f"  Extracted keyframe at {ts:.1f}s -> {out_frame}")

print("\nVerification Complete!")
