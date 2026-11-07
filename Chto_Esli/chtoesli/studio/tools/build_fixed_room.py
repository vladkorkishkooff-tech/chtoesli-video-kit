import cv2
import numpy as np
from PIL import Image

# 1. Load original frame
orig = Image.open('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg').convert('RGBA')

# 2. Let's inspect the sofa coordinates on the full 1080x1920 image
# Left armrest: x: 205..325, y: 880..1170
# Center divider: x ~ 535
# Right armrest: x: 745..865, y: 880..1170
# Right cushion: x: 535..745, y: 880..1150
# Left cushion: x: 325..535, y: 880..1150

print("Orig size:", orig.size)
