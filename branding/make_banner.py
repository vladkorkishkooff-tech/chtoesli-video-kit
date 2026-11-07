# Rebuild the channel banner: keep original logo pixels, replace the tagline.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
SRC='/data/chtoesli/refs/channel/banner.png'
FONT='/usr/share/fonts/msttcore/georgia.ttf'
def make(text, out, cap=31, maxw=873, cx=1265, top=849):
    im=Image.open(SRC).convert('RGB'); a=np.asarray(im).copy()
    # 1) erase old tagline: fill rows 840..892 / cols 940..1590 with texture copied from the clean strip above (rows 810..839)
    strip=a[810:840,940:1590]
    for i,y in enumerate(range(840,893)):
        a[y,940:1590]=strip[(i%30) if (i//30)%2==0 else 29-(i%30)]
    im=Image.fromarray(a)
    # 2) set new tagline, supersampled x4
    S=4
    for sz in range(80,20,-1):
        ft=ImageFont.truetype(FONT,sz*S); bb=ft.getbbox('Н')
        if bb[3]-bb[1]<=cap*S: break
    track=0.30*cap*S; space=0.85*cap*S
    def layout(track):
        xs=[];x=0
        for ch in text:
            if ch==' ': x+=space; xs.append(None); continue
            l,t,r,b=ft.getbbox(ch); xs.append(x-l); x+=(r-l)+track
        return xs, x-track
    xs,w=layout(track)
    while w>maxw*S and track>0.12*cap*S:
        track-=S*0.5; xs,w=layout(track)
    H=cap*S*3; W=int(w)+40*S
    L=Image.new('L',(W,H),0); d=ImageDraw.Draw(L)
    capTop=ft.getbbox('Н')[1]
    for ch,x in zip(text,xs):
        if x is None: continue
        d.text((20*S+x, cap*S-capTop), ch, font=ft, fill=255)
    L=L.resize((W//S,H//S),Image.LANCZOS)
    ink=Image.new('RGB',L.size,(42,40,35))
    x0=int(round(cx-(w/S)/2))-20; y0=top-cap
    im.paste(ink,(x0,y0),L)
    im.save(out)
    print(out,'cap',cap,'font',sz,'track',round(track/S,1),'width',round(w/S),'x',x0+20,'..',x0+20+round(w/S))
if __name__=='__main__':
    make('ТЫ ПОПАЛ В ТАКУЮ СИТУАЦИЮ','/data/chtoesli/branding/banner_new.png')
    make('РАЗБИРАЕМ ЖИЗНЕННЫЕ СИТУАЦИИ','/data/chtoesli/branding/banner_alt.png')
    make('КАК ВЫЖИТЬ В ЧС','/tmp/banner_check_old.png',cap=35)
