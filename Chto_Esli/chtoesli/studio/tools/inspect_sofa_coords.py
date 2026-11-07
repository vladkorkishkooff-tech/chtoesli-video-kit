import cv2
import numpy as np

img = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')

# Let's inspect the sofa region: y: 800..1250, x: 100..950
sofa_crop = img[800:1250, 100:950]
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/sofa_full_crop.jpg', sofa_crop)

# Let's inspect the exact position of the right armrest:
# In sofa_crop, x=0 corresponds to x=100 on original, y=0 to y=800
print("Sofa crop saved.")
