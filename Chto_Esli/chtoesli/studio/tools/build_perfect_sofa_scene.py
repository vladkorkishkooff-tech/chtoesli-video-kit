import cv2
import numpy as np
from PIL import Image

# 1. Load orig_44.0.jpg
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = orig.shape

# 2. In orig_44.0.jpg:
# The sofa is from x: 200 to 865, y: 885 to 1170.
# Let's inspect the clean parts of the sofa in orig_44.0.jpg:
# - Right cushion backrest (x: 540..740, y: 885..960) is 100% clean!
# - Right armrest (x: 745..865, y: 885..1170) is 100% clean except where cat head touched inner edge.
# - Clean seat cushion texture can be sampled from right cushion below cat (y: 1045..1104, x: 550..740).

# Let's build a pristine clean sofa:
sofa_clean = orig.copy()

# Mirror right armrest to create pristine left armrest:
right_arm = orig[885:1170, 745:865].copy()
# Clean inner edge of right_arm where cat head touched:
for dy in range(960 - 885, 1045 - 885):
    right_arm[dy, :22] = right_arm[dy + 80, :22]
left_arm = cv2.flip(right_arm, 1)

# Put clean left armrest at x: 205..325, y: 885..1170
sofa_clean[885:1170, 205:325] = left_arm

# Now clean the sofa back (y: 885..960, x: 325..540):
# Copy clean right backrest (x: 540..740) to left backrest (x: 330..530)
right_back = orig[885:960, 540:740].copy()
sofa_clean[885:960, 330:530] = cv2.flip(right_back, 1)

# Now clean the seat cushion (y: 960..1045, x: 540..740) where old cat was:
# In orig, the seat cushion front y: 1045..1104 is clean.
# Top of cushion y: 960..1045 can be restored using the seat color + paper grain:
seat_sample = orig[1048:1100, 560:730]
seat_mean = np.mean(seat_sample, axis=(0,1))
# Fill y: 960..1045 on right cushion with cushion color + matching noise
noise = np.random.RandomState(42).normal(0, 3.5, (1045 - 960, 740 - 540, 3))
cushion_fill = np.clip(seat_mean + noise, 0, 255).astype(np.uint8)
sofa_clean[960:1045, 540:740] = cushion_fill

# Clean the seat cushion on the left (y: 960..1045, x: 325..540)
noise_left = np.random.RandomState(43).normal(0, 3.5, (1045 - 960, 540 - 325, 3))
sofa_clean[960:1045, 325:540] = np.clip(seat_mean + noise_left, 0, 255).astype(np.uint8)

# Restore the dark ink line between sofa back and seat: y: 958..961
ink_color = (51, 39, 43)
cv2.line(sofa_clean, (325, 960), (745, 960), ink_color, 3)
# Restore center vertical seam: x: 535, y: 885..960
cv2.line(sofa_clean, (535, 885), (535, 960), ink_color, 2)
# Restore cushion front horizontal seam: y: 1044
cv2.line(sofa_clean, (325, 1044), (745, 1044), ink_color, 3)
# Restore bottom cushion seam: y: 1104
cv2.line(sofa_clean, (325, 1104), (745, 1104), ink_color, 3)

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/sofa_clean_base.jpg', sofa_clean)
print("Pristine clean sofa saved.")
