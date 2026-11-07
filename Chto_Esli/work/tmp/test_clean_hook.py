import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Test clean hook frame generator
w, h = 1080, 1920
font_path_bold = 'C:/Windows/Fonts/georgiab.ttf'

# Load Scene 4 frame (neural zap)
f_s4 = cv2.imread('work/tmp/brain_scene4_ref.png')
# Inner illustration frame in brain video is approximately:
# y: 240 to 1420, x: 50 to 1030
# Outer margin is clean paper: #F7F5EE or (230, 241, 248) BGR

paper_bgr = np.array([230, 241, 248], dtype=np.uint8)

def make_hook_frame(source_frame, zoom_scale=1.20, zoom_center=(540, 830), shake=(0,0)):
    # 1. Zoom the inner illustration box (y=240..1420, x=50..1030)
    # or zoom the whole frame and re-apply clean margins
    fh, fw = source_frame.shape[:2]
    src_w = int(round(fw / zoom_scale))
    src_h = int(round(fh / zoom_scale))
    cx = int(round(zoom_center[0] - shake[0]))
    cy = int(round(zoom_center[1] - shake[1]))
    x0 = max(0, min(fw - src_w, cx - src_w // 2))
    y0 = max(0, min(fh - src_h, cy - src_h // 2))
    cropped = source_frame[y0:y0+src_h, x0:x0+src_w]
    zoomed = cv2.resize(cropped, (fw, fh), interpolation=cv2.INTER_LINEAR)
    
    # 2. Clean the bottom area completely below the inner frame (y >= 1420)
    # We can clone clean paper from y=1750..1900 to cover y=1420..1920
    # or fill with the exact paper tone
    zoomed[1420:, :] = paper_bgr
    
    # 3. Clean top header margin (y <= 220) with paper tone
    zoomed[:220, :] = paper_bgr
    
    # Redraw clean top channel title "Что если? ЗНАЙ, ЧТО ДЕЛАТЬ" or let hook card cover it
    return zoomed

# Test on f_s4
test_f = make_hook_frame(f_s4, zoom_scale=1.25, zoom_center=(540, 850))

# Overlay Hook Card
hook_card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(hook_card)
cx0, cy0, cx1, cy1 = 70, 140, 1010, 380
draw.rounded_rectangle([cx0+4, cy0+5, cx1+4, cy1+5], radius=22, fill=(20, 20, 19, 45))
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

draw.line([x2 - 12, y2 + 44, x2 + w2 + 12, y2 + 44], fill=(217, 119, 87, 190), width=15)
draw.text((x1, y1), t1_text, fill=(20, 20, 19, 255), font=f1)
draw.text((x2, y2), t2_text, fill=(20, 20, 19, 255), font=f2)

# Also draw top channel logo "Что если?" nicely above the card if visible, or card covers cleanly
card_np = np.array(hook_card)

# Overlay
alpha = card_np[:, :, 3] / 255.0
ov_bgr = card_np[:, :, :3][:, :, ::-1]
alpha_3d = alpha[:, :, np.newaxis]
res = (test_f * (1.0 - alpha_3d) + ov_bgr * alpha_3d).astype(np.uint8)

cv2.imwrite('work/tmp/test_clean_hook.png', res)
print("Saved test_clean_hook.png")
