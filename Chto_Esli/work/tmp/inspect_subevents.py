import cv2
import numpy as np

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')

# Scene 2: where does head open, where does brain appear?
# Let's check frames 100 to 240
print("--- SCENE 2 ---")
for f in [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    # Check if hero head or floating brain:
    # floating brain is centered at x=540, y=700
    crop_center = frame[600:800, 400:680]
    print(f"f={f}: mean={crop_center.mean():.1f}")

# Scene 3: where is walking hero vs sleeping cat?
print("\n--- SCENE 3 ---")
for f in range(250, 420, 15):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    # cat is at y=900..1200, x=100..500
    crop_cat = frame[900:1200, 100:500]
    print(f"f={f}: cat_area_mean={crop_cat.mean():.1f}")

# Scene 4: where is dark grid and sparks?
print("\n--- SCENE 4 ---")
for f in range(430, 560, 15):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    inner = frame[155:1435, 55:1025]
    print(f"f={f}: inner_mean={inner.mean():.1f}")

# Scene 7: taxi map vs hippocampus
print("\n--- SCENE 7 ---")
for f in range(840, 1050, 20):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    # taxi map has blue river across middle (y=900..1100, x=200..800)
    # hippocampus brain is pink/red
    crop = frame[900:1100, 200:800]
    # check blue channel vs red channel
    b, g, r = crop[:,:,0].mean(), crop[:,:,1].mean(), crop[:,:,2].mean()
    print(f"f={f}: B={b:.1f}, G={g:.1f}, R={r:.1f} (R-B={r-b:.1f})")

# Scene 8: sleep vs walk vs book
print("\n--- SCENE 8 ---")
for f in range(1060, 1260, 20):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ret, frame = cap.read()
    crop_book = frame[800:1050, 550:750] # where book opens
    print(f"f={f}: book_area_mean={crop_book.mean():.1f}")
