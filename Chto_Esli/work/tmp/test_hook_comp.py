import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Load base frame
bg = Image.open('work/tmp/brain_scene1_switch.png').convert('RGBA')

# Zoom in slightly (1.18x) on the boy and the lightning
w, h = bg.size
crop_w = int(w / 1.18)
crop_h = int(h / 1.18)
# center around the boy's head: x=540, y=700
cx, cy = 540, 700
x0 = max(0, min(w - crop_w, cx - crop_w // 2))
y0 = max(0, min(h - crop_h, cy - crop_h // 2))

cropped = bg.crop((x0, y0, x0 + crop_w, y0 + crop_h))
zoomed = cropped.resize((w, h), Image.Resampling.LANCZOS)

# Create the craft hook banner
card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(card)

cx0, cy0, cx1, cy1 = 70, 240, 1010, 480
# Shadow
draw.rounded_rectangle([cx0+3, cy0+4, cx1+3, cy1+4], radius=22, fill=(20, 20, 19, 45))
# Card
draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=5)

font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'
f1 = ImageFont.truetype(font_path_bold, 52)
f2 = ImageFont.truetype(font_path_bold, 44)

t1_text = "МОЗГ НА 100%?"
t2_text = "ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!"

bb1 = f1.getbbox(t1_text)
w1 = bb1[2] - bb1[0]
x1 = (w - w1) // 2
y1 = cy0 + 36

bb2 = f2.getbbox(t2_text)
w2 = bb2[2] - bb2[0]
x2 = (w - w2) // 2
y2 = cy0 + 128

# Clay accent bar
draw.line([x2 - 12, y2 + 45, x2 + w2 + 12, y2 + 45], fill=(217, 119, 87, 190), width=16)

draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)

# Overlay
comp = Image.alpha_composite(zoomed, card)
comp.convert('RGB').save('work/tmp/test_hook_composite.jpg', quality=95)
print("Saved test_hook_composite.jpg")
