import cv2
import numpy as np
from PIL import Image, ImageDraw

# Load orig_frame_44s.jpg
orig_path = r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg'
orig = Image.open(orig_path).convert('RGB')
w, h = orig.size
orig_np = np.array(orig)

clean = orig_np.copy()

# 1. Clean the wall above left sofa (x=270..370, y=780..815)
# Sample wall color just above and to the right
wall_color = orig_np[750:780, 350:450].mean(axis=(0,1)).astype(np.uint8)
clean[780:815, 290:360] = wall_color

# Also curtain on the left (x=260..305, y=780..915)
curtain_sample = orig_np[650:750, 265:305]
h_curt = 915 - 780
clean[780:915, 265:305] = cv2.resize(curtain_sample, (40, h_curt))

# 2. Left armrest: mirror from right armrest (x=775..892, y=915..1220)
right_arm = orig_np[915:1220, 775:892]
clean[915:1220, 188:305] = np.fliplr(right_arm)

# 3. Clean the sofa backrest:
# Right backrest has no character, but has a bit of old mug? No, center seam is x=538.
# Right backrest interior: x in [545, 770], y in [825, 1005] is 100% clean sofa!
# We can fill the backrest with clean sofa color and draw the clean backrest creases!
back_sample = orig_np[840:980, 580:740] # 100% clean sofa surface
# Sample average color & texture
sofa_fill = np.median(back_sample, axis=(0,1)).astype(np.uint8) # ~[120, 135, 143]
sofa_line = [33, 28, 26] # ink

# Fill left backrest interior (x=310..535, y=825..1005) with flipped right backrest!
right_back_clean = orig_np[825:1005, 542:767]
clean[825:1005, 312:537] = np.fliplr(right_back_clean)

# Also fix the center area (x=525..550, y=825..1005) where the old mug was
clean[825:1005, 530:546] = sofa_fill

# 4. Clean seat cushions (y=1010..1180, x=305..775):
# Left seat cushion: x=305..538
# Right seat cushion: x=538..775
# Both cushions have base color sofa_fill, slightly darker in lower crease
clean[1010:1180, 305:775] = sofa_fill

# Add subtle gradient / shadow to cushion
for y in range(1010, 1180):
    factor = 1.0 - 0.08 * ((y - 1010) / 170.0)
    clean[y, 305:775] = (clean[y, 305:775] * factor).astype(np.uint8)

# 5. Clean carpet under feet (y=1180..1350, x=340..500):
# Sample clean carpet at x=550..700, y=1220..1350
carpet_sample = orig_np[1220:1350, 550:680]
clean[1220:1350, 360:490] = np.fliplr(carpet_sample)
# Floor line at y=1200..1220
floor_sample = orig_np[1200:1220, 550:680]
clean[1200:1220, 360:490] = np.fliplr(floor_sample)

# Draw clean sofa dividing ink lines:
# Top backrest contour: y=815..825
# Center backrest seam: x=538, y=815..1010
cv2.line(clean, (538, 815), (538, 1010), (26, 28, 33), 3, cv2.LINE_AA)
# Seam between backrest and seat: y=1010, x=305..775
cv2.line(clean, (305, 1010), (775, 1010), (26, 28, 33), 3, cv2.LINE_AA)
# Center seam between left and right seat cushions: x=538, y=1010..1180
cv2.line(clean, (538, 1010), (538, 1180), (26, 28, 33), 3, cv2.LINE_AA)
# Bottom apron seam: y=1180, x=220..860
cv2.line(clean, (220, 1180), (860, 1180), (26, 28, 33), 3, cv2.LINE_AA)
# Left backrest outline:
cv2.line(clean, (305, 818), (538, 818), (26, 28, 33), 3, cv2.LINE_AA)

# Floor line: y=1220
cv2.line(clean, (55, 1220), (1024, 1220), (26, 28, 33), 3, cv2.LINE_AA)

# Save clean room
out_path = r'D:\Chanels\Chto_Esli\chtoesli\review\perfect_empty_room.jpg'
cv2.imwrite(out_path, cv2.cvtColor(clean, cv2.COLOR_RGB2BGR))
print(f"Saved {out_path}")
