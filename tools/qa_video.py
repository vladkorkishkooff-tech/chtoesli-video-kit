#!/usr/bin/env python3
"""Extract *selected* video frames and technical measurements; this does not interpret quality."""
import argparse, json, math, re, subprocess, sys, tempfile
from fractions import Fraction
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def run(args):
    return subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

def main():
    p=argparse.ArgumentParser(description='Снимки выбранных кадров и технические измерения; визуальную оценку делает человек/модель.')
    p.add_argument('video',type=Path); p.add_argument('out',type=Path)
    p.add_argument('--every-frames',type=int,default=15,help='Шаг в кадрах, по умолчанию 15')
    p.add_argument('--start',type=float,default=0,help='Начало, секунды (включительно)')
    p.add_argument('--end',type=float,help='Конец, секунды (не включая)')
    a=p.parse_args()
    if a.every_frames<1 or a.start<0 or (a.end is not None and a.end<=a.start): p.error('Неверный шаг/диапазон')
    a.out.mkdir(parents=True,exist_ok=True)
    info=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(a.video)]).stdout)
    v=next((s for s in info['streams'] if s['codec_type']=='video'),None)
    if not v: raise SystemExit('Нет видеодорожки')
    fps=Fraction(v['r_frame_rate'])
    if fps != 30: raise SystemExit(f'Этот инструмент рассчитан на постоянные 30 fps, обнаружено {fps}. Извлеки кадры вручную и проверь VFR.')
    dur=float(v.get('duration') or info['format']['duration']); start=int(math.ceil(a.start*30)); end=int(math.ceil(min(a.end if a.end is not None else dur,dur)*30))
    if str(v.get('nb_frames', '')).isdigit(): end=min(end,int(v['nb_frames']))
    if start>=end: raise SystemExit('Диапазон вне видео')
    lines=[f'Файл: {a.video}',f'Размер {v.get("width")}×{v.get("height")}; fps {fps}; длительность видео {dur:.3f} с; кадров {v.get("nb_frames", "?")}.',f'Выборка: кадры {start}–{end-1}, каждый {a.every_frames}-й. Время = номер кадра / 30; предполагается постоянная частота.', 'Это технический отчёт; картинки, смысл, звук на слух и качество автоматически не оценивались.']
    aud=next((s for s in info['streams'] if s['codec_type']=='audio'),None)
    if aud:
        lines.append(f'Аудио: {aud.get("codec_name")}; длительность {aud.get("duration","?")} с.')
        for filt, title in [('ebur128=peak=true','EBU R128 (финальная сводка)'),('silencedetect=n=-45dB:d=0.4','Тишина ≥0,4 с ниже −45 dB')]:
            r=subprocess.run(['ffmpeg','-hide_banner','-i',str(a.video),'-vn','-af',filt,'-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
            if r.returncode: lines.append(f'{title}: ошибка измерения'); continue
            if filt.startswith('ebur128'):
                pos=r.stderr.rfind('Summary:'); lines.append(title+':\n'+(r.stderr[pos:].strip() if pos>=0 else 'сводка не найдена'))
            else:
                vals=[l for l in r.stderr.splitlines() if re.search(r'silence_(start|end)',l)]; lines.append(title+':\n'+('\n'.join(vals) if vals else 'не обнаружена'))
    else: lines.append('Аудиодорожки нет.')
    flt=f"select=gte(n\\,{start})*lt(n\\,{end})*not(mod(n-{start}\\,{a.every_frames})),scale=270:480"
    with tempfile.TemporaryDirectory() as temp:
        result=subprocess.run(['ffmpeg','-v','error','-i',str(a.video),'-vf',flt,'-fps_mode','vfr',str(Path(temp)/'f%06d.png')],capture_output=True,text=True)
        if result.returncode: raise SystemExit('Ошибка извлечения: '+result.stderr)
        files=sorted(Path(temp).glob('f*.png'))
        if not files: raise SystemExit('Нет извлечённых кадров')
        font=ImageFont.truetype(str(Path(__file__).resolve().parents[1]/'studio/fonts/Montserrat.ttf'),17)
        for base in range(0,len(files),16):
            chunk=files[base:base+16]; sheet=Image.new('RGB',(4*282,4*511),'#f5f4f1'); d=ImageDraw.Draw(sheet)
            for j,f in enumerate(chunk):
                idx=base+j; n=start+idx*a.every_frames; x=(j%4)*282+6; y=(j//4)*511
                with Image.open(f) as im: sheet.paste(im.convert('RGB'),(x,y))
                d.text((x+3,y+484),f'кадр {n}  |  {n/30:.3f} с',fill='#222222',font=font)
            dest=a.out/f'лист_{base//16+1:03d}.jpg'; sheet.save(dest,quality=90)
        lines.append(f'Извлечено {len(files)} выбранных кадров; листов: {math.ceil(len(files)/16)}.')
    (a.out/'отчёт.txt').write_text('\n\n'.join(lines)+'\n',encoding='utf-8')
    print('\n'.join(lines[:4])); print(f'Листы и отчёт: {a.out}')
if __name__=='__main__': main()
