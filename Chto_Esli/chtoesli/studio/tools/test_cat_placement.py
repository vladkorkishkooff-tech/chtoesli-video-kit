import cv2
import numpy as np
from PIL import Image

# 1. Load orig_frame_44s.jpg
orig = cv2.imread(r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg')
h, w, _ = orig.shape

# 2. Let's create the base room:
# Left armrest needs to be clean.
# Right armrest is at x=775..892, y=915..1220.
# We copy right armrest and flip horizontally to x=188..305.
right_arm = orig[915:1220, 775:892].copy()
left_arm = cv2.flip(right_arm, 1)

# Wall and curtain on the left where the old head was:
# In orig, old head is at x=310..370, y=780..815.
# Behind it is wall (x>325) and curtain (x<325).
# Let's clone clean wall and curtain:
clean_room = orig.copy()
clean_room[915:1220, 188:305] = left_arm

# Erase old character back from the left:
# Copy clean right sofa backrest (x=545..770, y=815..1010) and flip to left (x=310..535)
right_back = orig[815:1010, 545:770].copy()
clean_room[815:1010, 310:535] = cv2.flip(right_back, 1)

# Wall above sofa (y=770..815, x=290..370)
wall_slice = orig[740:770, 350:430]
clean_room[780:815, 330:370] = cv2.resize(wall_slice, (40, 35))

# Curtain (x=260..330, y=770..915)
curtain_slice = orig[640:740, 265:315]
clean_room[770:915, 265:315] = cv2.resize(curtain_slice, (50, 145))

# Seat cushions:
# Clean sofa seat baseline (y=1010..1180, x=305..775)
# In orig, the old cat was at x=555..765, y=990..1120.
# Let's clean the right cushion where old cat was:
# Sample sofa fill color from clean backrest
sofa_teal = orig[840:980, 600:740].mean(axis=(0,1))
clean_room[1010:1180, 540:775] = sofa_teal
# Center seam:
cv2.line(clean_room, (538, 815), (538, 1180), (33, 28, 26), 3, cv2.LINE_AA)
# Horizontal cushion seam:
cv2.line(clean_room, (305, 1010), (775, 1010), (33, 28, 26), 3, cv2.LINE_AA)
# Apron seam:
cv2.line(clean_room, (220, 1180), (860, 1180), (33, 28, 26), 3, cv2.LINE_AA)

# Floor carpet where old shoes were (y=1220..1300, x=350..480):
carpet_clean = orig[1220:1300, 560:690]
clean_room[1220:1300, 350:480] = cv2.flip(carpet_clean, 1)

# 3. Add canonical Cat on right cushion!
cat_path = r'D:\Chanels\Chto_Esli\Klubok_project\09_game\art\cat\alert.png'
cat_img = Image.open(cat_path).convert('RGBA')

# Let's scale cat to fit the sofa cushion perfectly:
# Right cushion width = 775 - 540 = 235 px.
# Cat width ~260 px, height ~170 px
cat_w, cat_h = 280, int(280 * cat_img.height / cat_img.width)
cat_resized = cat_img.resize((cat_w, cat_h), Image.Resampling.LANCZOS)

# Convert clean_room to PIL
base_pil = Image.fromarray(cv2.cvtColor(clean_room, cv2.COLOR_BGR2RGBA))

# Paste cat on right cushion (x=530..810, resting on seat cushion at y=1130):
cat_x = 535
cat_y = 1140 - cat_h
base_pil.paste(cat_resized, (cat_x, cat_y), cat_resized)

# Save intermediate room with clean sofa and cat
base_pil.convert('RGB').save(r'D:\Chanels\Chto_Esli\chtoesli\review\sofa_with_cat.jpg', quality=95)
print("Saved sofa_with_cat.jpg")
