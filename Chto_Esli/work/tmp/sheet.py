# склейка картинок в ряд/сетку с подписями: python3 sheet.py out.jpg cols h img1 img2 ...
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, hh, *fs = sys.argv[1:]; cols = int(cols); hh = int(hh)
ims = []
for f in fs:
    im = Image.open(f).convert('RGB'); w = int(im.width * hh / im.height); ims.append((f.split('/')[-1].rsplit('.', 1)[0], im.resize((w, hh))))
cw = max(w for _, i in ims for w in [i.width]); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cw * cols, (hh + 30) * rows), 'white'); d = ImageDraw.Draw(S)
try: font = ImageFont.truetype('/usr/share/fonts/liberation/LiberationSans-Regular.ttf', 20)
except Exception: font = ImageFont.load_default()
for k, (n, im) in enumerate(ims):
    x, y = (k % cols) * cw, (k // cols) * (hh + 30); S.paste(im, (x, y + 30)); d.text((x + 4, y + 4), n, fill='black', font=font)
S.save(out, quality=88)
