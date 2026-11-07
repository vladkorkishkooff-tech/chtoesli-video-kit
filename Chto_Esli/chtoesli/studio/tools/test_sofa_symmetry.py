import cv2
import numpy as np

orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')

# Symmetry axis: x_center = 535
XC = 535

# Let's clean the right armrest inner edge where cat touched:
# Cat head was at x: 740..770, y: 960..1040
clean_right = orig.copy()
# In clean_right, inner edge of armrest at y: 960..1040 can be cloned from y: 1040..1120:
for dy in range(960, 1040):
    clean_right[dy, 740:770] = clean_right[dy + 80, 740:770]

# Now let's mirror right half (x: 535..875) to left half (x: 195..535):
# Width = 875 - 535 = 340 pixels
right_half = clean_right[880:1190, XC:XC+340]
left_mirrored = cv2.flip(right_half, 1)

# Place into clean_orig
clean_sofa_sym = clean_right.copy()
clean_sofa_sym[880:1190, XC-340:XC] = left_mirrored

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/clean_sofa_symmetrical.jpg', clean_sofa_sym)
print("Symmetrical clean sofa generated.")
