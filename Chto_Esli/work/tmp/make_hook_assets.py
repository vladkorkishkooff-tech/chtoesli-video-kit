import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Let's inspect creating the craft paper card for the Hook
# Dimensions: 1080 x 1920
# Banner at top:
# Card width: 880, height: 220
# X: 100, Y: 180
# Background: #FDFCFA or #F4F2EB (paper)
# Border: #141413, 4px width, rounded radius 18px
# Text:
# Line 1: МОЗГ НА 100%?
# Line 2: ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!
# Font: Georgia Bold

font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'
font_size_1 = 48
font_size_2 = 40
f1 = ImageFont.truetype(font_path_bold, font_size_1)
f2 = ImageFont.truetype(font_path_bold, font_size_2)

img = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Card coordinates
cx0, cy0, cx1, cy1 = 80, 200, 1000, 440
# Outer shadow/border
draw.rounded_rectangle([cx0+3, cy0+4, cx1+3, cy1+4], radius=20, fill=(20, 20, 19, 40)) # soft drop shadow
draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=20, fill=(244, 242, 235, 255), outline=(20, 20, 19, 255), width=4)

# Terracotta highlight under second line:
t2_text = "ЭТО ПРИСТУП, А НЕ СУПЕРСИЛА!"
t1_text = "МОЗГ НА 100%?"

# Center text
bbox1 = f1.getbbox(t1_text)
w1 = bbox1[2] - bbox1[0]
x1 = (1080 - w1) // 2
y1 = cy0 + 35

bbox2 = f2.getbbox(t2_text)
w2 = bbox2[2] - bbox2[0]
x2 = (1080 - w2) // 2
y2 = cy0 + 125

# Terracotta clay stroke under line 2
draw.line([x2 - 10, y2 + 42, x2 + w2 + 10, y2 + 42], fill=(217, 119, 87, 180), width=14)

draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)

img.save('work/tmp/hook_card_test.png')
print("Saved hook_card_test.png")

# Now create "ЧУТЬ РАНЬШЕ" badge
# Badge: pill shape, width: 340, height: 70
# Placed around y=520, centered at x=540
badge = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(badge)
bx0, by0, bx1, by1 = 370, 500, 710, 570
bdraw.rounded_rectangle([bx0+2, by0+3, bx1+2, by1+3], radius=16, fill=(20, 20, 19, 30))
bdraw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(244, 242, 235, 255), outline=(20, 20, 19, 255), width=3)

bf = ImageFont.truetype(font_path_bold, 32)
btext = "ЧУТЬ РАНЬШЕ"
bb = bf.getbbox(btext)
bw = bb[2] - bb[0]
bx = (1080 - bw) // 2
by = by0 + (70 - (bb[3] - bb[1])) // 2 - 2
bdraw.text((bx, by), btext, fill=(20, 20, 19, 255), font=bf)

badge.save('work/tmp/badge_chut_ranshe.png')
print("Saved badge_chut_ranshe.png")
