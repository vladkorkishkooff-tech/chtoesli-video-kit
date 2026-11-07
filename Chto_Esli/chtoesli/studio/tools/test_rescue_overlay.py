import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Load f_019.jpg (rescue frame at 38s)
frame_path = r'D:\Chanels\Chto_Esli\chtoesli\review\draft_timeline\f_019.jpg'
frame = cv2.imread(frame_path)
h, w, _ = frame.shape

# Let's inspect coordinates in frame:
# Buried skier chest: x ≈ 420, y ≈ 860
# Rescuer sensor on ground: x ≈ 640, y ≈ 770
# Rescuer probe hand: x ≈ 450, y ≈ 500

# Let's create an overlay function for radio waves:
# We draw 3-4 concentric dashed/arc terracotta radio waves radiating from buried skier chest (420, 860) up towards the surface (420, 560)
overlay = frame.copy()

# Arc center: (420, 860)
center = (420, 860)
terracotta = (58, 85, 180) # BGR for #B4553A / terracotta #D97757: B=87, G=119, R=217 -> BGR (87, 119, 217)

# Draw expanding wave rings towards the surface
for r in [80, 150, 220, 290]:
    # Arc from angle 220 to 320 degrees (pointing up)
    cv2.ellipse(overlay, center, (r, int(r * 0.7)), 0, 210, 330, (87, 119, 217), 3, cv2.LINE_AA)
    # Highlight
    cv2.ellipse(overlay, center, (r + 1, int((r + 1) * 0.7)), 0, 212, 328, (244, 242, 235), 1, cv2.LINE_AA)

# Alpha blend overlay with original frame
alpha = 0.65
blended = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)

# Convert to PIL to draw Georgia badge
pil_img = Image.fromarray(cv2.cvtColor(blended, cv2.COLOR_BGR2RGBA))
draw = ImageDraw.Draw(pil_img)

# Load font
try:
    font = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 26)
    font_small = ImageFont.truetype(r'C:\Windows\Fonts\georgiaz.ttf', 20)
except:
    font = ImageFont.load_default()
    font_small = font

# Draw channel style badge near rescuer beacon:
# White box with ink border and rounded corners
badge_x, badge_y, badge_w, badge_h = 580, 700, 320, 56
draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=10, fill='#F4F2EB', outline='#211C1A', width=2)
# Terracotta pulse dot
draw.ellipse([badge_x + 16, badge_y + 20, badge_x + 32, badge_y + 36], fill='#D97757', outline='#211C1A', width=2)
# Text inside badge
draw.text((badge_x + 42, badge_y + 13), "457 кГц  ·  СИГНАЛ", font=font, fill='#211C1A')

out_path = r'D:\Chanels\Chto_Esli\chtoesli\review\test_rescue_beeper_badge.jpg'
pil_img.convert('RGB').save(out_path, quality=95)
print(f"Saved: {out_path}")
