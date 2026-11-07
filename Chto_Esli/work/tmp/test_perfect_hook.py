import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

base = cv2.imread('work/tmp/brain_scene4_ref.png')
h, w = base.shape[:2]

iy0, iy1 = 155, 1435
ix0, ix1 = 55, 1025
inner = base[iy0:iy1, ix0:ix1]
ih, iw = inner.shape[:2]

zoom_scale = 1.25
src_w = int(round(iw / zoom_scale))
src_h = int(round(ih / zoom_scale))
icx, icy = iw // 2, ih // 2
x0 = max(0, min(iw - src_w, icx - src_w // 2))
y0 = max(0, min(ih - src_h, icy - src_h // 2))

cropped = inner[y0:y0+src_h, x0:x0+src_w]
zoomed_inner = cv2.resize(cropped, (iw, ih), interpolation=cv2.INTER_LINEAR)

frame_comp = base.copy()
frame_comp[iy0:iy1, ix0:ix1] = zoomed_inner

# Cover bottom subtitle completely: y = 1450 to 1750
# Take paper texture from y=1750..1900
paper_sample = base[1750:1880, 50:1030]
# Tile or resize patch to cover y=1450..1750 (height 300)
patch_full = cv2.resize(paper_sample, (980, 300), interpolation=cv2.INTER_LINEAR)
frame_comp[1450:1750, 50:1030] = patch_full

# Card placed at y=240..480
hook_card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(hook_card)
cx0, cy0, cx1, cy1 = 70, 240, 1010, 480
draw.rounded_rectangle([cx0+4, cy0+5, cx1+4, cy1+5], radius=22, fill=(20, 20, 19, 45))
draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=(247, 245, 238, 255), outline=(20, 20, 19, 255), width=5)

font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'
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

draw.line([x2 - 12, y2 + 44, x2 + w2 + 12, y2 + 44], fill=(217, 119, 87, 190), width=15)
draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)

card_np = np.array(hook_card)
alpha = card_np[:, :, 3] / 255.0
ov_bgr = card_np[:, :, :3][:, :, ::-1]
alpha_3d = alpha[:, :, np.newaxis]
res = (frame_comp * (1.0 - alpha_3d) + ov_bgr * alpha_3d).astype(np.uint8)

cv2.imwrite('work/tmp/test_perfect_hook.png', res)
print("Saved test_perfect_hook.png")
