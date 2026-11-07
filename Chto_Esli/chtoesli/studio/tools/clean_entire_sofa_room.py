import cv2
import numpy as np
from PIL import Image

# 1. Load clean_geometry_sofa.jpg
base = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/clean_geometry_sofa.jpg')
h, w, c = base.shape

# 2. Clean up old character's head and mug:
# Head is at x: 280..380, y: 670..790 (on wall/sofa top)
# Old mug is at x: 460..535, y: 800..900
# The wall above the sofa (y: 650..885) has a subtle gradient from window to right:
# In orig, x: 540..740, y: 650..885 is clean wall and right cushion!
# Let's inspect that clean wall area:
clean_wall = base[650:885, 540:740].copy()
# Mirror it to the left side (x: 340..540, y: 650..885):
base[650:885, 340:540] = cv2.flip(clean_wall, 1)

# For x: 260..340, y: 650..885, there is the left curtain edge and wall:
# In orig, the curtain hanging by window is at x: 260..325, y: 390..700.
# Let's clone clean wall/curtain from y: 550..650:
for dy in range(670, 790):
    base[dy, 260:340] = base[dy - 120, 260:340]

# Now the sofa back: y: 885..960
# Right back cushion (x: 535..745) is 100% clean:
clean_back = base[885:960, 535:745].copy()
base[885:960, 325:535] = cv2.flip(clean_back, 1)

# Center divider:
ink = (43, 39, 51)
cv2.line(base, (535, 885), (535, 960), ink, 2, cv2.LINE_AA)
# Top line of sofa back:
cv2.line(base, (325, 885), (745, 885), ink, 3, cv2.LINE_AA)
# Seam between back and seat:
cv2.line(base, (325, 960), (745, 960), ink, 3, cv2.LINE_AA)

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/totally_empty_sofa_room.jpg', base)
print("Totally empty sofa room saved.")
