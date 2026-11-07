import cv2
import numpy as np
import subprocess
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# 1. Create Graphics
w, h = 1080, 1920
font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'

# Hook Card Banner (Top)
hook_card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(hook_card)
cx0, cy0, cx1, cy1 = 70, 180, 1010, 420
# Soft shadow
draw.rounded_rectangle([cx0+4, cy0+5, cx1+4, cy1+5], radius=22, fill=(20, 20, 19, 45))
# Card body
draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=5)

f1 = ImageFont.truetype(font_path_bold, 50)
f2 = ImageFont.truetype(font_path_bold, 42)
t1_text = "МОЗГ НА 100%?"
t2_text = "ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!"

bb1 = f1.getbbox(t1_text)
w1 = bb1[2] - bb1[0]
x1 = (w - w1) // 2
y1 = cy0 + 34

bb2 = f2.getbbox(t2_text)
w2 = bb2[2] - bb2[0]
x2 = (w - w2) // 2
y2 = cy0 + 124

# Clay accent underline
draw.line([x2 - 12, y2 + 44, x2 + w2 + 12, y2 + 44], fill=(217, 119, 87, 190), width=15)
draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)
hook_card_np = np.array(hook_card)

# Badge "ЧУТЬ РАНЬШЕ"
badge = Image.new('RGBA', (w, h), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(badge)
bx0, by0, bx1, by1 = 370, 480, 710, 550
bdraw.rounded_rectangle([bx0+3, by0+3, bx1+3, by1+3], radius=16, fill=(20, 20, 19, 35))
bdraw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=3)
bf = ImageFont.truetype(font_path_bold, 30)
btext = "ЧУТЬ РАНЬШЕ"
bb = bf.getbbox(btext)
bw = bb[2] - bb[0]
bx = (w - bw) // 2
by = by0 + (70 - (bb[3] - bb[1])) // 2 - 2
bdraw.text((bx, by), btext, fill=(20, 20, 19, 255), font=bf)
badge_np = np.array(badge)

print("Generated graphic overlays successfully!")
