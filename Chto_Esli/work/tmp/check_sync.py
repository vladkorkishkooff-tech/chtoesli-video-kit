import json
from pathlib import Path

with open('chtoesli/episodes/brain100/voice/words.json', encoding='utf-8') as f:
    words = json.load(f)

speeds = {
    'b01': 1.20,
    'b02': 1.18,
    'b03': 1.18,
    'b04': 1.18,
    'b05': 1.22,
    'b06': 1.18,
    'b07': 1.18,
    'b08': 1.18,
    'b09': 1.18,
}

voice_cues = [
    ('b01', 1.85),
    ('b02', 4.65),
    ('b03', 7.55),
    ('b04', 10.35),
    ('b05', 13.15),
    ('b06', 17.55),
    ('b07', 20.15),
    ('b08', 23.15),
    ('b09', 26.55),
]

for lid, st in voice_cues:
    sp = speeds[lid]
    orig_dur = words[lid]['dur']
    fast_dur = orig_dur / sp
    end = st + fast_dur
    txt = words[lid]['text']
    print(f'{lid}: start={st:5.2f}s, end={end:5.2f}s, dur={fast_dur:.2f}s, text="{txt}"')
