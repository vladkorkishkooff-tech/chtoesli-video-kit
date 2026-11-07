import cv2
import numpy as np
from PIL import Image

# Load orig_44.0.jpg
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = orig.shape

# The character in orig_44.0.jpg is in bounding box:
# y: 660..1175, x: 260..535
# Let's crop the character with margin
char_crop = orig[660:1175, 260:535].copy()

# In char_crop:
# x=0 corresponds to x=260 in orig
# y=0 corresponds to y=660 in orig

# Let's create an accurate alpha mask for the character:
# In orig, the character's parts are:
# 1. Hair: dark #2B2733
# 2. Face: skin #EFC9A8
# 3. Hoodie: orange #D06A33
# 4. Mug: orange #D06A33
# 5. Steam: white #F4EFE6
# 6. Pants: cream #D9D4CC / #EDEAE4
# 7. Shoes: dark #3B3850
# 8. Ink outlines: dark #211c1a

# Let's build a clean mask using GrabCut or color thresholding:
mask = np.zeros(char_crop.shape[:2], np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)

# Bounding box of character inside char_crop:
# Top-left margin is background (wall/window)
rect = (5, 5, char_crop.shape[1] - 10, char_crop.shape[0] - 10)
cv2.grabCut(char_crop, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
char_isolated = char_crop * mask2[:, :, np.newaxis]

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/char_isolated.png', char_isolated)
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/char_mask.png', mask2 * 255)
print("Character segmented.")
