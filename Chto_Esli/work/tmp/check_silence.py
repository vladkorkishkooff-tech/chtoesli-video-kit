import subprocess
from pathlib import Path

vdir = Path('work/tmp/voice_fast')
for f in sorted(vdir.glob('b*_fast.wav')):
    # detect silence
    cmd = [
        'ffmpeg', '-i', str(f),
        '-af', 'silencedetect=noise=-35dB:d=0.1',
        '-f', 'null', '-'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, errors='replace')
    log = res.stderr
    print(f"=== {f.name} ===")
    for line in log.splitlines():
        if 'silence_start' in line or 'silence_end' in line:
            print("   ", line)
