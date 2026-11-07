import cv2
import numpy as np
from PIL import Image

# 1. Process the sleeping cat from cat_spit_raw.png
cat_img = Image.open('D:/Chanels/Chto_Esli/chtoesli/review/cat_spit_raw.png').convert('RGBA')
cat_arr = np.array(cat_img)

# Remove the light cream background:
# Background is RGB ~ (236, 232, 222), high R, G, B
r, g, b, a = cat_arr[:, :, 0], cat_arr[:, :, 1], cat_arr[:, :, 2], cat_arr[:, :, 3]
# The cat itself has orange tabby (R ~ 200, G ~ 110, B ~ 50),
# white belly/face (R ~ 245, G ~ 245, B ~ 240, but enclosed by dark ink outline),
# ink outlines (dark, R < 80).
# The outer background is outside the cat contour.
# Let's flood fill the outer background to make it transparent:
gray = cv2.cvtColor(cat_arr[:, :, :3], cv2.COLOR_RGB2GRAY)
# Outer border is background:
mask = np.zeros((cat_arr.shape[0] + 2, cat_arr.shape[1] + 2), np.uint8)
# Floodfill from top-left, top-right, bottom-left, bottom-right corners
# Any pixel close to background color (230..245) connected to corners is background
bg_mask = np.zeros(gray.shape, dtype=bool)
h_cat, w_cat = cat_arr.shape[:2]
corners = [(0, 0), (w_cat - 1, 0), (0, h_cat - 1), (w_cat - 1, h_cat - 1)]
for pt in corners:
    cv2.floodFill(gray, mask, pt, 0, 15, 15)

# mask now has 1 where flooded
bg_mask = (mask[1:-1, 1:-1] != 0)
cat_arr[bg_mask, 3] = 0

cat_transparent = Image.fromarray(cat_arr)
cat_transparent.save('D:/Chanels/Chto_Esli/chtoesli/review/cat_spit_trans.png')
print("Transparent cat saved.")
