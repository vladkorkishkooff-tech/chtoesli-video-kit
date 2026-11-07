import whisper
import json

model = whisper.load_model('small')
res = model.transcribe('D:/Chanels/Chto_Esli/chtoesli/renders/chtoesli_lavina_v2_1.mp4', language='ru')

print("=== TRANSCRIBED SEGMENTS ===")
for s in res['segments']:
    print(f"[{s['start']:.2f} - {s['end']:.2f}] {s['text']}")

with open('D:/Chanels/Chto_Esli/chtoesli/review/final_verification_whisper.json', 'w', encoding='utf-8') as f:
    json.dump(res['segments'], f, ensure_ascii=False, indent=2)
