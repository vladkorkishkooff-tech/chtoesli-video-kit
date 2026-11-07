import cv2
import numpy as np

img = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/sofa_full_crop.jpg')
h, w, _ = img.shape
print(f"Crop size: {w}x{h}")

# The right armrest:
# Let's find where the right armrest is:
# It's on the right side of the crop
# Let's inspect x from 600 to 800
# Right armrest inner vertical line is around x=670
# Right outer boundary is around x=740
# Bottom leg is around x=690
# Let's save slices to verify
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/slice_right_arm.jpg', img[:, 630:770])
print("Right arm slice saved.")
