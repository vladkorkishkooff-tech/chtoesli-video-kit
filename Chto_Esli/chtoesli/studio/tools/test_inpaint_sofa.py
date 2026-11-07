import cv2
import numpy as np

orig = cv2.imread(r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg')
h, w, _ = orig.shape

# Mask for inpainting: 255 where we want to erase elements
mask = np.zeros((h, w), dtype=np.uint8)

# 1. The old character:
# Head, body, arms, legs
# x in [240, 520], y in [770, 1240]
# But we only want to inpaint what needs erasing:
# Character on left:
mask[780:1240, 240:530] = 255

# 2. Old mug and steam in the middle:
mask[820:980, 460:540] = 255

# 3. Old cat on the right:
mask[970:1140, 545:785] = 255
# Cat head near right armrest:
mask[980:1080, 750:810] = 255

# Let's run cv2.inpaint with Telea and Navier-Stokes
inp_telea = cv2.inpaint(orig, mask, 7, cv2.INPAINT_TELEA)
inp_ns = cv2.inpaint(orig, mask, 7, cv2.INPAINT_NS)

cv2.imwrite(r'D:\Chanels\Chto_Esli\chtoesli\review\inpaint_telea.jpg', inp_telea)
cv2.imwrite(r'D:\Chanels\Chto_Esli\chtoesli\review\inpaint_ns.jpg', inp_ns)
print("Inpaint test complete!")
