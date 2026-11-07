import cv2
import numpy as np
from PIL import Image

# Load orig_frame_44s.jpg
orig = cv2.imread(r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg')
h, w, _ = orig.shape

# Let's inspect coordinates of sofa elements:
# Frame inside: x in [55, 1024], y in [231, 1431]
# Sofa backrest top: y = 815
# Left corner of backrest: x = 300, y = 818
# Right corner of backrest: x = 775, y = 818
# Center seam: x = 538
# Sofa seat top: y = 1010
# Sofa seat bottom (apron line): y = 1175
# Left armrest: x = 188..305, y = 915..1220
# Right armrest: x = 775..892, y = 915..1220

# Let's verify what is clean in orig_frame_44s:
# 1. Right armrest: x in [775, 892], y in [915, 1220] is 100% clean!
# 2. Right backrest upper half: x in [545, 770], y in [818, 970] is 100% clean!
# 3. Wall behind lamp: x in [500, 1024], y in [231, 815] is 100% clean!
# 4. Carpet on right: x in [550, 950], y in [1220, 1431] is 100% clean!

# Let's build a clean sofa:
clean = orig.copy()

# A. Restore left armrest by mirroring right armrest:
clean[915:1220, 188:305] = cv2.flip(orig[915:1220, 775:892], 1)

# B. Restore left backrest by mirroring right backrest:
# Width of half backrest = 538 - 305 = 233 px.
# Right backrest clean slice: x in [542, 775], y in [818, 1010]
right_back_clean = orig[818:1010, 542:775]
clean[818:1010, 305:538] = cv2.flip(right_back_clean, 1)

# C. Erase old character head above backrest (y in [775, 818], x in [300, 375]):
# Wall slice from x=375..450, y=775..818
wall_sample = orig[775:818, 380:455]
clean[775:818, 305:380] = wall_sample

# Curtain on left (x=265..305, y=775..915):
curtain_clean = orig[640:780, 265:305]
clean[775:915, 265:305] = cv2.resize(curtain_clean, (40, 140))

# D. Clean the entire sofa seat cushion area (y in [1010, 1175], x in [305, 775]):
# The sofa seat cushion has a consistent color with paper grain.
# In orig, the clean cushion patch at y=1010..1060, x=330..430 or right backrest y=920..970 has:
# Mean color: [122, 137, 145] in BGR
base_color = orig[850:970, 600:720].mean(axis=(0,1))

# Let's create a smooth texture for seat cushions:
# Gradient from top (y=1010) to bottom (y=1175):
for y in range(1010, 1175):
    # slight vertical depth gradient: top is slightly lighter, bottom slightly shadowed
    t = (y - 1010) / 165.0
    factor = 1.02 - 0.08 * t
    c = np.clip(base_color * factor, 0, 255).astype(np.uint8)
    clean[y, 305:775] = c

# E. Clean the floor and carpet under the old legs:
# Mirror clean carpet (x in [550, 750], y in [1220, 1340]) to [338, 538]
carpet_clean_slice = orig[1220:1340, 538:738]
clean[1220:1340, 338:538] = cv2.flip(carpet_clean_slice, 1)

# Floor strip at y in [1200, 1220], x in [305, 538]:
floor_clean_slice = orig[1200:1220, 538:771]
clean[1200:1220, 305:538] = cv2.flip(floor_clean_slice, 1)

# F. Redraw the clean authentic ink contour lines of the sofa:
ink = (33, 28, 26) # #211c1a
lw = 3

# Top rim of backrest:
cv2.line(clean, (305, 818), (775, 818), ink, lw, cv2.LINE_AA)
# Left backrest corner curve:
cv2.ellipse(clean, (320, 833), (15, 15), 180, 0, 90, ink, lw, cv2.LINE_AA)
# Right backrest corner curve:
cv2.ellipse(clean, (760, 833), (15, 15), 270, 0, 90, ink, lw, cv2.LINE_AA)

# Center dividing line between left and right cushions:
cv2.line(clean, (538, 818), (538, 1175), ink, lw, cv2.LINE_AA)

# Horizontal dividing seam between backrest and seat cushions:
cv2.line(clean, (305, 1010), (775, 1010), ink, lw, cv2.LINE_AA)

# Left and right vertical borders between cushions and armrests:
cv2.line(clean, (305, 818), (305, 1175), ink, lw, cv2.LINE_AA)
cv2.line(clean, (775, 818), (775, 1175), ink, lw, cv2.LINE_AA)

# Bottom apron horizontal seam:
cv2.line(clean, (220, 1175), (860, 1175), ink, lw, cv2.LINE_AA)

# Front apron bottom edge:
cv2.line(clean, (220, 1205), (860, 1205), ink, lw, cv2.LINE_AA)

# Wooden legs at bottom of sofa:
# Left leg:
cv2.rectangle(clean, (255, 1205), (275, 1225), (43, 39, 51), -1)
cv2.rectangle(clean, (255, 1205), (275, 1225), ink, lw)
# Right leg:
cv2.rectangle(clean, (805, 1205), (825, 1225), (43, 39, 51), -1)
cv2.rectangle(clean, (805, 1205), (825, 1225), ink, lw)

# Baseboard floor line:
cv2.line(clean, (55, 1220), (1024, 1220), ink, lw, cv2.LINE_AA)

out_file = r'D:\Chanels\Chto_Esli\chtoesli\review\pristine_empty_sofa_room.jpg'
cv2.imwrite(out_file, clean)
print(f"Pristine room created: {out_file}")
