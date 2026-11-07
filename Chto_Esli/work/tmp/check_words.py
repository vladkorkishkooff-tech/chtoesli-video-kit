import subprocess
import json

# Let's extract audio from original video or check where speech is
# In chtoesli/episodes/brain100/voice/, we saw take1.mp3, words.json, lines.json.
# Let's check how take1 was timed in original video!
with open('chtoesli/episodes/brain100/voice/words.json', encoding='utf-8') as f:
    words = json.load(f)

for lid, data in words.items():
    print(f"{lid}: dur={data['dur']:.2f}s, first_word={data['words'][0]}, last_word={data['words'][-1]}")
