import cv2
import numpy as np
from pathlib import Path

frames_dir = Path('work/tmp/master_frames')
crop_dir = Path('work/tmp/master_sub_crops')
crop_dir.mkdir(parents=True, exist_ok=True)

for sec in range(32):
    img_path = frames_dir / f"f_{sec:02d}s.jpg"
    if not img_path.exists(): continue
    img = cv2.imread(str(img_path))
    # Subtitle region: y=1450..1750, x=80..1000
    sub = img[1450:1750, 80:1000]
    cv2.imwrite(str(crop_dir / f"sub_{sec:02d}s.jpg"), sub)
    
print("Saved 32 subtitle crops. Let's analyze brightness and variance in each.")
for sec in range(32):
    sub = cv2.imread(str(crop_dir / f"sub_{sec:02d}s.jpg"), cv2.IMREAD_GRAYSCALE)
    # Background paper is ~235-245. Dark ink text is ~20-50.
    has_ink = np.sum(sub < 100)
    print(f"t={sec:02d}s: ink pixels (<100) = {has_ink:5d}, min_pixel={sub.min()}")
