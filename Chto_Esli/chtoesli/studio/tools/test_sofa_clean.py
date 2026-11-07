import cv2
import numpy as np
from PIL import Image

# Load base frame
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = orig.shape

# 1. Clean the sofa completely in the region x: 200..870, y: 880..1170
# Let's inspect what a clean sofa looks like:
# Right armrest is at x: 745..865, y: 885..1170
# Sofa back top line: y ~ 885
# Sofa back bottom / cushion seam: y ~ 960
# Sofa cushion front: y ~ 1104
# Sofa bottom: y ~ 1166

# Let's create a clean sofa background image:
# Left armrest is a horizontal mirror of right armrest!
right_arm = orig[885:1170, 745:865].copy()
left_arm = cv2.flip(right_arm, 1)

# In right_arm, the cat head touched x: 745..775, y: 960..1040
# Let's clean that inner edge by cloning from y: 1040..1120 or y: 885..950:
for dy in range(960 - 885, 1045 - 885):
    # inner edge of armrest
    right_arm[dy, :20] = right_arm[dy + 80, :20]
left_arm = cv2.flip(right_arm, 1)

# Let's check sofa back color and texture:
# Sofa back (y: 885..960, x: 280..745)
# In orig, the center area (x: 480..550, y: 885..960) has clean sofa back texture:
back_tile = orig[888:958, 510:560].copy()

# Sofa cushion top (y: 960..1040)
# Clean cushion top texture can be sampled from x: 480..530, y: 965..1040
cushion_tile = orig[965:1040, 480:530].copy()

print("Tiles extracted successfully.")
