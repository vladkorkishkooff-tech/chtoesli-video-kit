import cv2
import numpy as np

img = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Look for dark lines of the border box
# Horizontals: around y=250..300 and y=1400..1500
# Verticals: around x=40..70 and x=1000..1040
for y in range(200, 350):
    if np.mean(gray[y, 100:980]) < 100:
        print(f'Top border candidate at y={y}')
        break

for y in range(1500, 1350, -1):
    if np.mean(gray[y, 100:980]) < 100:
        print(f'Bottom border candidate at y={y}')
        break

for x in range(30, 80):
    if np.mean(gray[400:1300, x]) < 100:
        print(f'Left border candidate at x={x}')
        break

for x in range(1050, 1000, -1):
    if np.mean(gray[400:1300, x]) < 100:
        print(f'Right border candidate at x={x}')
        break
