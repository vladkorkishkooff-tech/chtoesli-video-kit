import cv2
import numpy as np

orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, _ = orig.shape

# 1. Clean the right cushion on orig:
# The old cat is in y: 950..1065, x: 560..830.
# Armrest inner line is at x = 745.
# Cushion top is y: 960..1044, x: 535..745.
# Cushion front is y: 1044..1104, x: 535..745.

# Let's fill cushion top (y: 960..1044, x: 535..745) with cushion top color + grain:
# Sample cushion top color from the clean spot x: 520..545, y: 970..1030
top_sample = orig[970:1030, 525:545]
top_color = np.median(top_sample, axis=(0,1))
print("Cushion top median BGR:", top_color)

# Fill y: 960..1044, x: 535..745:
noise_top = np.random.RandomState(42).normal(0, 3.0, (1044 - 960, 745 - 535, 3))
orig[960:1044, 535:745] = np.clip(top_color + noise_top, 0, 255).astype(np.uint8)

# Sample cushion front color from clean spot x: 550..700, y: 1075..1100
front_sample = orig[1075:1100, 550:700]
front_color = np.median(front_sample, axis=(0,1))
print("Cushion front median BGR:", front_color)

# Fill y: 1044..1075, x: 535..745 (where tail was):
noise_front = np.random.RandomState(43).normal(0, 3.0, (1075 - 1044, 745 - 535, 3))
orig[1044:1075, 535:745] = np.clip(front_color + noise_front, 0, 255).astype(np.uint8)

# Clean right armrest inner edge (x: 745..775, y: 960..1045 where cat head was):
# Copy from lower part of armrest y: 1045..1130
for dy in range(960, 1045):
    orig[dy, 745:775] = orig[dy + 85, 745:775]

# Ink lines:
ink = (43, 39, 51)
# Cushion front line:
cv2.line(orig, (535, 1044), (745, 1044), ink, 3, cv2.LINE_AA)
# Cushion top seam:
cv2.line(orig, (535, 960), (745, 960), ink, 3, cv2.LINE_AA)
# Armrest inner edge:
cv2.line(orig, (745, 960), (745, 1104), ink, 3, cv2.LINE_AA)

# NOW: The entire right half (x: 535..875, y: 880..1190) is 100% CLEAN!
# Let's mirror this pristine right half to the left half:
XC = 535
right_half = orig[880:1190, XC:XC+340]
left_mirrored = cv2.flip(right_half, 1)

clean_base = orig.copy()
clean_base[880:1190, XC-340:XC] = left_mirrored

# Redraw center seam on sofa back:
cv2.line(clean_base, (535, 885), (535, 960), ink, 2, cv2.LINE_AA)

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/perfect_clean_sofa.jpg', clean_base)
print("Perfect clean sofa generated!")
