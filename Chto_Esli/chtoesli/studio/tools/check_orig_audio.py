import whisper

model = whisper.load_model('small')
res = model.transcribe('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/orig_audio.wav', language='ru')
for s in res['segments']:
    print(f"[{s['start']:.2f} - {s['end']:.2f}] {s['text']}")
