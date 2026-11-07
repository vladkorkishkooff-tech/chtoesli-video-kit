from PIL import Image
import numpy as np

img = Image.open('D:/Chanels/Chto_Esli/Котv2.png')
w, h = img.size
print(f'Kotv2 size: {w}x{h}')

# In Kotv2.png, "спит" is at the bottom center:
# Let's crop bottom center: x: 30%..65%, y: 65%..95%
crop_x1 = int(w * 0.32)
crop_x2 = int(w * 0.62)
crop_y1 = int(h * 0.68)
crop_y2 = int(h * 0.94)

crop = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
crop.save('D:/Chanels/Chto_Esli/chtoesli/review/cat_spit_raw.png')
print('Raw spit crop saved.')
