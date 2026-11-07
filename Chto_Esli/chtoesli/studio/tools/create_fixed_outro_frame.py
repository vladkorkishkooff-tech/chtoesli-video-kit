import cv2
import numpy as np
from PIL import Image

# 1. Load orig_frame_44s.jpg
orig_path = r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg'
orig = Image.open(orig_path).convert('RGBA')
w, h = orig.size

# 2. Inspect the sofa coordinates in orig_frame_44s.jpg
# Inside frame: x in [55, 1024], y in [231, 1431]
# Sofa backrest: x in [305, 775], y in [815, 1010]
# Sofa center line: x = 540
# Left cushion: x in [305, 540], y in [1010, 1180]
# Right cushion: x in [540, 775], y in [1010, 1180]
# Left armrest: x in [188, 305], y in [915, 1220]
# Right armrest: x in [775, 892], y in [915, 1220]

# Notice that the right armrest is completely intact and clean!
# If we mirror the right armrest to the left armrest:
# Width of armrest = 892 - 775 = 117 px
# Left armrest target: [188, 305] (width = 117 px)
# This perfectly restores the left armrest!

# Let's see: the right back cushion (x in [540, 775], y in [815, 1010]) is completely intact!
# When mirrored across x=540, it perfectly restores the left back cushion (x in [305, 540], y in [815, 1010])!
# And the wall above the left armrest/sofa back:
# In orig_frame_44s, the character's head is at x=340, y=820.
# The wall behind him has the orange curtain on the left (x in [262, 325]) and beige wall in [325, 497].
# By inpainting or cleanly blending the curtain and beige wall, the background is 100% clean!

# Let's create clean_sofa_room:
orig_np = np.array(orig)

# Let's make a copy to clean
clean_bg = orig_np.copy()

# 1. Mirror clean right armrest (x=775..892, y=915..1220) to left armrest (x=188..305, y=915..1220)
right_arm = orig_np[915:1220, 775:892]
left_arm_mirrored = np.fliplr(right_arm)
clean_bg[915:1220, 188:305] = left_arm_mirrored

# 2. Mirror clean right backrest (x=540..775, y=815..1010) to left backrest (x=305..540, y=815..1010)
right_back = orig_np[815:1010, 540:775]
left_back_mirrored = np.fliplr(right_back)
clean_bg[815:1010, 305:540] = left_back_mirrored

# 3. Clean seat cushion base (y=1010..1180, x=305..775)
# In orig_frame_44s, right cushion has the old cat at y=990..1120.
# But look at the seat apron at y=1130..1180: it's clean dark teal.
# Let's inspect the cushion texture:
cushion_color = np.median(orig_np[900:960, 600:700], axis=(0,1)) # clean sofa teal
print(f"Cushion color: {cushion_color}")

# Let's save clean_bg to see how it looks
cv2.imwrite(r'D:\Chanels\Chto_Esli\chtoesli\review\test_clean_bg.jpg', cv2.cvtColor(clean_bg, cv2.COLOR_RGBA2BGR))
print("Saved test_clean_bg.jpg")
