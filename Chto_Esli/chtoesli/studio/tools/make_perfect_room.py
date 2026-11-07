import cv2
import numpy as np
from PIL import Image

# 1. Load orig_44.0.jpg
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, _ = orig.shape

# 2. Let's analyze coordinates in orig_44.0:
# Inner frame: x: 55..1024, y: 231..1431
# Floor line: y = 1166
# Sofa base: y = 1104 to 1166
# Sofa seat cushion: y = 960 to 1104
# Sofa back cushions: y = 790 to 960
# Right armrest: x: 745 to 865, y: 885 to 1166
# Left armrest (original position): x: 205 to 325, y: 885 to 1166
# Center divider of back: x = 535
# Old cat position: x: 550 to 850, y: 950 to 1065
# Old hero position: x: 210 to 480, y: 650 to 1166

# Let's inspect the right armrest slice to construct the left armrest:
right_arm = orig[885:1170, 745:865].copy()
left_arm_mirror = cv2.flip(right_arm, 1) # horizontally flipped

# Notice the cat head touched the inner side of right armrest around y: 960..1040, x: 745..770
# Let's clean that small touch on right_arm using the clean armrest texture from below/above:
# The armrest body is x: 770..855, inner seam is at x: 745
print("Analyzing clean textures...")
