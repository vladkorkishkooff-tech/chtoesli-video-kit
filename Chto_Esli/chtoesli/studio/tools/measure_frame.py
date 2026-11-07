import cv2
import numpy as np

img = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
h, w, c = img.shape
print(f'orig_44.0.jpg dimensions: {w}x{h}')

# The frame border in the channel videos:
# Top header is outside the inner frame
# Inner frame has a thin ink border
# Let's inspect where the inner frame is
# We can find the border by looking at row/col profiles
print('Image loaded successfully.')
