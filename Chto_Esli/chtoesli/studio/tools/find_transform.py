import cv2
import numpy as np

orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
sitting = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/test_sitting_playwright.jpg')

# In orig:
# Right armrest top: (805, 885)
# Right armrest bottom: (805, 1170)
# Right sofa leg: (827, 1176)
# Left sofa leg: (250, 1176)
# Left armrest top: (265, 885)

# In sitting:
# Right armrest top: M910 1020 H980 Q1020 1020 -> center x ~ 965, y ~ 1020
# Left armrest top: M60 1060 ... -> center x ~ 115, y ~ 1020
# Right leg: x = 991, y = 1290
# Left leg: x = 91, y = 1290

# Let's check leg distance:
# In sitting: dx = 991 - 91 = 900 px, dy = 0
# In orig: dx = 827 - 250 = 577 px
scale_x = 577.0 / 900.0
print(f"Scale X: {scale_x:.4f}")

# Armrest top to leg:
# In sitting: dy = 1290 - 1020 = 270 px
# In orig: dy = 1176 - 885 = 291 px
scale_y = 291.0 / 270.0
print(f"Scale Y: {scale_y:.4f}")

# Center of sofa:
# In sitting: XC = 540, YC = 1112
# In orig: XC = 535, YC = 960 (seat seam)
