import cv2
import numpy as np
from PIL import Image

# 1. Load orig_44.0.jpg
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = orig.shape

result = orig.copy()

# 2. Draw clean sofa
# Sofa geometry in orig_44.0.jpg:
# Left armrest: x: 205..325, y: 885..1170
# Right armrest: x: 745..865, y: 885..1170
# Backrest: x: 250..820, y: 885..960
# Seat top: x: 260..810, y: 960..1044
# Seat front: x: 250..820, y: 1044..1104
# Base: x: 240..830, y: 1104..1166
# Left leg: x: 242..258, y: 1166..1186
# Right leg: x: 818..834, y: 1166..1186

# Colors in BGR:
C_BACK = (140, 132, 119)   # #5E6283
C_SEAT = (148, 137, 120)   # #6A6E90
C_FRONT = (140, 132, 119)  # #5E6283
C_ARM = (142, 136, 126)    # #565A7B
C_INK = (43, 39, 51)       # #2B2733
C_LEG = (43, 39, 51)

# A. Base & legs
cv2.rectangle(result, (242, 1166), (258, 1186), C_LEG, -1)
cv2.rectangle(result, (818, 1166), (834, 1186), C_LEG, -1)
cv2.rectangle(result, (230, 1104), (840, 1166), C_BACK, -1)

# B. Backrest (two cushions)
# Left back: x: 325..535, y: 885..960
# Right back: x: 535..745, y: 885..960
cv2.rectangle(result, (250, 885), (820, 960), C_BACK, -1)

# C. Seat top (y: 960..1044, x: 250..820)
cv2.rectangle(result, (250, 960), (820, 1044), C_SEAT, -1)

# D. Seat front (y: 1044..1104, x: 240..830)
cv2.rectangle(result, (240, 1044), (830, 1104), C_FRONT, -1)

# E. Left armrest: rounded rectangle
# x: 205..325, y: 885..1170
pts_left_arm = np.array([
    [205, 1170], [205, 915], [215, 895], [235, 885],
    [295, 885], [315, 895], [325, 915], [325, 1170]
], np.int32)
cv2.fillPoly(result, [pts_left_arm], C_ARM)

# F. Right armrest: rounded rectangle
pts_right_arm = np.array([
    [745, 1170], [745, 915], [755, 895], [775, 885],
    [835, 885], [855, 895], [865, 915], [865, 1170]
], np.int32)
cv2.fillPoly(result, [pts_right_arm], C_ARM)

# G. Ink outlines (hand-drawn style, line width 3)
cv2.polylines(result, [pts_left_arm], True, C_INK, 3, cv2.LINE_AA)
cv2.polylines(result, [pts_right_arm], True, C_INK, 3, cv2.LINE_AA)
# Sofa back top line:
cv2.line(result, (325, 885), (745, 885), C_INK, 3, cv2.LINE_AA)
# Sofa back-to-seat seam:
cv2.line(result, (325, 960), (745, 960), C_INK, 3, cv2.LINE_AA)
# Center divider:
cv2.line(result, (535, 885), (535, 960), C_INK, 2, cv2.LINE_AA)
# Cushion front line:
cv2.line(result, (325, 1044), (745, 1044), C_INK, 3, cv2.LINE_AA)
# Bottom cushion seam:
cv2.line(result, (240, 1104), (830, 1104), C_INK, 3, cv2.LINE_AA)
# Bottom sofa line:
cv2.line(result, (230, 1166), (840, 1166), C_INK, 3, cv2.LINE_AA)

# Add paper grain noise across sofa region:
noise = np.random.RandomState(42).normal(0, 3.5, (1190 - 880, 875 - 200, 3))
sofa_crop = result[880:1190, 200:875].astype(np.float32) + noise
result[880:1190, 200:875] = np.clip(sofa_crop, 0, 255).astype(np.uint8)

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/clean_geometry_sofa.jpg', result)
print("Clean geometry sofa saved.")
