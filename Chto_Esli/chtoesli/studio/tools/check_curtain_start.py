import cv2, os
import numpy as np

curt_dir = 'D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/curtain_analysis'
files = sorted([f for f in os.listdir(curt_dir) if f.startswith('frame_')])

for f in files:
    img = cv2.imread(os.path.join(curt_dir, f))
    # Check top area y: 250..350, x: 200..800 for curtain color
    # The curtains are terracotta/orange (high R, lower B)
    # In BGR: B < 120, R > 150
    crop = img[250:350, 400:600]
    b, g, r = cv2.split(crop)
    is_curt = (r > 150) & (b < 120) & (g < 140)
    curt_ratio = np.mean(is_curt)
    if curt_ratio > 0.05:
        print(f'{f}: curtain detected! ratio={curt_ratio:.3f}')
        break
    else:
        print(f'{f}: no curtain (ratio={curt_ratio:.3f})')
