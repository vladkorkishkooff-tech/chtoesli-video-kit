import json
from pathlib import Path

with open('chtoesli/episodes/brain100/voice/lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)
with open('chtoesli/episodes/brain100/voice/words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

for line in lines:
    lid = line['id']
    wdata = words.get(lid, {})
    dur = wdata.get('dur', 'N/A')
    txt = line['text']
    wlist = wdata.get('words', [])
    first_w = wlist[0] if wlist else None
    last_w = wlist[-1] if wlist else None
    print(f"{lid} (dur={dur}s): {txt}")
    if first_w and last_w:
        print(f"   speech start: {first_w[1]:.2f}s, end: {last_w[2]:.2f}s (net: {last_w[2]-first_w[1]:.2f}s)")
