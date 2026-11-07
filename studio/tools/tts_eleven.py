"""
Голос Сергея для эпизода: ElevenLabs «Sergey Lebedev» (XuEV9VY3VUASYgJVNBh0), модель eleven_v3.
Весь текст идёт одним запросом (ровная интонация между строками), потом режется по строкам по выравниванию символов.

    python tools/tts_eleven.py ../episodes/<id> [номер_дубля]     # по умолчанию 1; готовый дубль заново не запрашивается

Вход:  <ep>/voice/lines.json — [{"id": "s01", "text": "..."}, ...]; « | » внутри строки — место разреза
       (в запрос идёт пробелом, части сохраняются как <id>, <id>_2, …)
Ключ:  ELEVENLABS_API_KEY или файл /data/.secrets/elevenlabs_api_key (ключ не класть в проект и в архивы).
Выход: <ep>/voice/take<N>.mp3, take<N>.json (выравнивание и параметры запроса),
       <ep>/voice/<id>.wav (48 кГц моно, края по тишине), <ep>/voice/words.json:
       {id: {"text", "dur", "words": [[слово, начало, конец], ...]}} — время от начала файла строки, с.
"""
import base64, json, os, subprocess, sys, urllib.error, urllib.request, wave
from pathlib import Path
import numpy as np

VOICE, MODEL = 'XuEV9VY3VUASYgJVNBh0', 'eleven_v3'
SETTINGS = {'stability': 0.5, 'similarity_boost': 0.8, 'use_speaker_boost': True}
SR = 48000
FR = 0.01  # кадр огибающей, с


def api_key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    p = Path('/data/.secrets/elevenlabs_api_key')
    if not k and p.exists(): k = p.read_text().strip()
    if not k: sys.exit('нет ключа: ELEVENLABS_API_KEY или /data/.secrets/elevenlabs_api_key')
    return k


def tts(text, mp3, js, seed):
    body = json.dumps({'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS, 'seed': seed}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128', data=body,
                                 headers={'xi-api-key': api_key(), 'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs {e.code}: {e.read().decode(errors="replace")[:800]}')
    mp3.write_bytes(base64.b64decode(res.pop('audio_base64')))
    res['request'] = {'voice': VOICE, 'model': MODEL, 'settings': SETTINGS, 'seed': seed, 'text': text}
    js.write_text(json.dumps(res, ensure_ascii=False))
    return res


def dec(path):
    x = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(x, np.float32).copy()


def env_db(x):
    n = int(FR * SR); m = len(x) // n
    r = np.sqrt((x[: m * n].reshape(m, n).astype(np.float64) ** 2).mean(1) + 1e-12)
    return 20 * np.log10(r)


def write_wav(path, x):
    w = wave.open(str(path), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()


def main(ep, take=1):
    V = Path(ep) / 'voice'
    lines = json.loads((V / 'lines.json').read_text(encoding='utf-8'))
    text = '\n\n'.join(l['text'].replace(' | ', ' ') for l in lines)
    parts = []
    for l in lines:
        for j, tx in enumerate(l['text'].split(' | ')): parts.append({'id': l['id'] + (f'_{j + 1}' if j else ''), 'text': tx})
    lines = parts
    mp3, js = V / f'take{take}.mp3', V / f'take{take}.json'
    if mp3.exists() and js.exists():
        res = json.loads(js.read_text(encoding='utf-8'))
        if res['request']['text'] != text: sys.exit(f'{js.name}: текст изменился — возьми новый номер дубля')
    else:
        res = tts(text, mp3, js, 1000 + take)
    al = res.get('alignment') or res.get('normalized_alignment')
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    joined = ''.join(chars)
    if joined != text: print('ВНИМАНИЕ: символы выравнивания не совпали с текстом —', len(joined), 'против', len(text))
    x = dec(mp3); E = env_db(x); nE = len(E)
    # границы строк в тексте → время по выравниванию
    spans, pos = [], 0
    for l in lines:
        i0 = joined.find(l['text'], pos)
        if i0 < 0: sys.exit(f'строка {l["id"]} не найдена в выравнивании')
        i1 = i0 + len(l['text']) - 1; pos = i1 + 1
        spans.append((i0, i1, st[i0], en[i1]))
    # разрез между строками — в самом тихом кадре паузы
    cuts = [0]
    for (a, b), (c, d) in zip([(s[2], s[3]) for s in spans[:-1]], [(s[2], s[3]) for s in spans[1:]]):
        f0, f1 = int(b / FR), int(c / FR)
        if f1 <= f0 + 1: cuts.append(int((b + c) / 2 / FR))
        else: cuts.append(f0 + int(np.argmin(E[f0:f1])))
    cuts.append(nE)
    words, report = {}, []
    for k, (l, (i0, i1, s0, e0)) in enumerate(zip(lines, spans)):
        a, b = cuts[k], cuts[k + 1]
        seg = E[a:b]; thr = max(seg.max() - 42, -58)
        on = np.nonzero(seg > thr)[0]
        f_on, f_off = a + on[0], a + on[-1] + 1
        t0 = max(a * FR, f_on * FR - 0.03); t1 = min(b * FR, f_off * FR + 0.12)
        y = x[int(t0 * SR): int(t1 * SR)].copy()
        fi, fo = int(0.008 * SR), int(0.04 * SR)
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
        write_wav(V / f'{l["id"]}.wav', y)
        # слова: буквы подряд без пробелов; время — по первой и последней букве слова
        ws, j, T = [], i0, l['text']
        while j <= i1:
            if joined[j].isspace(): j += 1; continue
            k0 = j
            while j <= i1 and not joined[j].isspace(): j += 1
            tok = joined[k0:j]; lets = [q for q in range(k0, j) if joined[q].isalnum()]
            if not lets: continue
            ws.append([tok.strip('.,:;!?—«»…'), round(st[lets[0]] - t0, 3), round(en[lets[-1]] - t0, 3)])
        words[l['id']] = {'text': T, 'dur': round(len(y) / SR, 3), 'words': ws}
        report.append(f'{l["id"]:>5}  {len(y) / SR:5.2f} с  {len(T) / max(0.01, (f_off - f_on) * FR):4.1f} симв/с   речь по выравниванию {s0:6.2f}–{e0:6.2f}, по огибающей {f_on * FR:6.2f}–{f_off * FR:6.2f}')
    (V / 'words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{mp3.name}: {len(x) / SR:.2f} с, {len(text)} символов')
    print('\n'.join(report))


if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 1)
