import subprocess
import json
from pathlib import Path

# Let's inspect scene transitions and subtitle text appearance in brain100_short_v10.mp4
# We can detect scene changes using ffmpeg select='gt(scene,0.3)'
cmd = [
    'ffmpeg', '-i', 'Незаконченные видео/brain100_short_v10.mp4',
    '-vf', 'select=gt(scene\\,0.25),metadata=print:file=-',
    '-f', 'null', '-'
]
res = subprocess.run(cmd, capture_output=True, text=True, errors='replace')
for line in res.stdout.splitlines():
    if 'pts_time' in line or 'scene_score' in line:
        print(line)
