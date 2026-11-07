import cv2
import numpy as np

# Load clean_sofa_symmetrical
base = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/clean_sofa_symmetrical.jpg')

# In base, the cushion top is y: 960..1044, x: 325..745
# Let's inspect the cushion front face y: 1044..1104
# The cushion front face in base has the cat tail at y: 1044..1070.
# Below y: 1070 (y: 1070..1104), the cushion front face is 100% clean!
# Let's inspect that clean area: y: 1072..1102, x: 350..720
front_sample = base[1072:1102, 350:720]
front_mean = np.mean(front_sample, axis=(0,1))
print("Front mean BGR:", front_mean)

# Cushion top color: #6A6E90 in BGR is (144, 110, 106)
# Cushion front color: #5E6283 in BGR is (131, 98, 94)
# Let's fill cushion top (y: 960..1044, x: 325..745)
# with #6A6E90 + subtle paper grain:
top_bgr = np.array([144, 110, 106], dtype=np.float32)
noise_top = np.random.RandomState(100).normal(0, 3.0, (1044 - 960, 745 - 325, 3))
base[960:1044, 325:745] = np.clip(top_bgr + noise_top, 0, 255).astype(np.uint8)

# Fill cushion front face (y: 1044..1104, x: 325..745)
# with #5E6283 + subtle paper grain:
front_bgr = np.array([131, 98, 94], dtype=np.float32)
noise_front = np.random.RandomState(101).normal(0, 3.0, (1104 - 1044, 745 - 325, 3))
base[1044:1104, 325:745] = np.clip(front_bgr + noise_front, 0, 255).astype(np.uint8)

# Now draw the clean ink lines with brush/ink style:
ink = (43, 39, 51) # #2B2733 in BGR
# Back-to-cushion seam: y: 960
cv2.line(base, (325, 960), (745, 960), ink, 3, cv2.LINE_AA)
# Center vertical divider on backrest: x: 535, y: 885..960
cv2.line(base, (535, 885), (535, 960), ink, 2, cv2.LINE_AA)
# Cushion front horizontal line: y: 1044
cv2.line(base, (325, 1044), (745, 1044), ink, 3, cv2.LINE_AA)
# Bottom cushion seam: y: 1104
cv2.line(base, (325, 1104), (745, 1104), ink, 3, cv2.LINE_AA)
# Inner edge of left armrest: x: 325, y: 960..1104
cv2.line(base, (325, 960), (325, 1104), ink, 3, cv2.LINE_AA)
# Inner edge of right armrest: x: 745, y: 960..1104
cv2.line(base, (745, 960), (745, 1104), ink, 3, cv2.LINE_AA)

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/clean_room_empty_sofa.jpg', base)
print("Empty pristine sofa saved.")
