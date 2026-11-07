import cv2
import numpy as np
from PIL import Image

# Load original frame
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = orig.shape

# Let's inspect the exact regions in orig
# 1. Right armrest: x: 740..855, y: 885..1170
# Sofa center divider is around x = 535
# Left cushion is from x: 320 to x: 535
# Right cushion is from x: 535 to x: 750
# Left armrest is from x: 205 to x: 320
# Right armrest is from x: 750 to x: 865

# Let's save a copy to edit
fixed = orig.copy()

# Step A: Clean up the old cat on the right cushion
# In orig, the old cat is at x: 560..845, y: 950..1065
# We can sample the clean sofa texture from the left cushion (above feet/between hero and divider)
# or synthesize the clean sofa colors:
# Sofa back color: BGR ~ (131, 98, 94)  (#5E6283)
# Sofa seat cushion top color: BGR ~ (144, 110, 106) (#6A6E90)
# Seam line color: BGR ~ (51, 39, 43) (#2B2733)

print("Starting clean room synthesis...")
