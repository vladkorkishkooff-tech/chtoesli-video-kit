import cv2
import numpy as np

# Load orig_44.0.jpg
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
# Load test_sitting_playwright.jpg
sitting = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/test_sitting_playwright.jpg')

# In test_sitting_playwright.jpg, let's inspect the sofa region:
# Sofa top: y ~ 960 (sofa back top) to y ~ 1290 (sofa legs)
# Sofa width: x ~ 50 to 950
# In orig_44.0.jpg, the sofa is at:
# Left armrest: x: 205..325, y: 885..1170
# Right armrest: x: 745..865, y: 885..1170
# Seat: y: 960..1166

# Notice that in test_sitting_playwright.jpg, the room was drawn directly in 1080x1920 SVG!
# In orig_44.0.jpg, the room is inside the frame box: x: 55..1024 (width 969), y: 231..1431 (height 1200)
# Let's inspect the scale between test_sitting and orig_44:
# In test_sitting:
# Sofa width = 946 - 54 = 892 px
# In orig_44:
# Sofa width = 865 - 205 = 660 px
# Scale = 660 / 892 = 0.740!
print("Scale factor:", 660.0 / 892.0)
