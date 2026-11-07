import cv2
import numpy as np
from PIL import Image

# 1. Load original frame
orig = Image.open('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg').convert('RGBA')
orig_cv = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')

# 2. Extract right armrest from orig_cv (x: 745..865, y: 885..1170)
# Let's clean the inner edge of right armrest where the cat head touched (y: 960..1040)
right_arm = orig_cv[885:1170, 745:865].copy()
# The inner edge (first 25 cols) at y: 960..1040 has cat whiskers/head
# Clone inner edge from y: 1045..1125
for dy in range(960 - 885, 1040 - 885):
    right_arm[dy, :22] = right_arm[dy + 80, :22]

left_arm = cv2.flip(right_arm, 1)

# 3. Create clean room base
# We start from orig_cv
clean_room = orig_cv.copy()

# A. Restore left armrest:
# Original left armrest was at x: 205..325, y: 885..1170
clean_room[885:1170, 205:325] = left_arm

# B. Restore clean sofa background for x: 325..745, y: 885..1150
# Sofa back top line: y: 885, bottom seam: y: 960
# Sofa seat cushion: y: 960..1104, front base: y: 1104..1166
# Clean sample of sofa back: x: 500..550, y: 888..958
sofa_back_mean = [140, 132, 119] # BGR
sofa_seat_mean = [147, 138, 121] # BGR
sofa_base_mean = [131, 98, 94]   # BGR
ink_color = [51, 39, 43]

# Fill sofa back: y: 888..960, x: 325..745
# We use inpainting or tiling from a clean region with noise to match grain
clean_back_tile = orig_cv[890:955, 500:540]
for x in range(325, 745, 40):
    w_tile = min(40, 745 - x)
    clean_room[890:955, x:x+w_tile] = clean_back_tile[:, :w_tile]

# Fill sofa cushion: y: 960..1045, x: 325..745
clean_seat_tile = orig_cv[965:1040, 480:520]
for x in range(325, 745, 40):
    w_tile = min(40, 745 - x)
    clean_room[965:1040, x:x+w_tile] = clean_seat_tile[:, :w_tile]

# Horizontal ink lines of the sofa:
# Top curve: y=885
# Back-to-seat seam: y=960
cv2.line(clean_room, (325, 960), (745, 960), ink_color, 3)
# Center vertical divider between cushions: x=535, y: 885..960
cv2.line(clean_room, (535, 885), (535, 960), ink_color, 2)
# Cushion front line: y=1043
cv2.line(clean_room, (325, 1043), (745, 1043), ink_color, 3)
# Bottom cushion seam: y=1104
cv2.line(clean_room, (325, 1104), (745, 1104), ink_color, 3)

# 4. Now isolate the character from orig_cv:
# In orig_cv, character is in x: 260..540, y: 650..1170
# Notice: we exclude the outer back cape (x < 265) to fix the posture!
char_roi = orig_cv[650:1175, 265:545].copy()

# Create alpha mask for character:
# Background of room behind character:
# - wall at top (y < 885, x: 265..350) has slate color BGR ~ (135, 110, 110)
# - window curtain on left: terracotta
# - sofa behind character
# Let's inspect char_roi and create an exact mask
print("Clean base and char_roi ready.")
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/clean_base.jpg', clean_room)
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/char_roi.jpg', char_roi)
