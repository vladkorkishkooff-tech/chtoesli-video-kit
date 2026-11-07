import cv2
import numpy as np

orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')

# In orig:
# Framed '?' is at x: 495..645, y: 460..635
# Clock is at x: 730..870, y: 350..490
# Lamp shade is at x: 790..920, y: 570..660

# In yard2.js:
# Framed '?': R(g, 480, 380, 170, 210) -> x: 480..650, y: 380..590 (w=170, h=210)
# Clock: E(g, 800, 250, 62, 62) -> center at (800, 250), radius 62
# Lamp shade: fx = 935, y: 520..640

# Now compare '?':
# In yard2.js: w = 170, h = 210
# In orig:
# Framed '?' width = 645 - 495 = 150
# Framed '?' height = 635 - 460 = 175
# Ratio: 150 / 170 = 0.882, 175 / 210 = 0.833

# Let's check the inner frame box: [231:1431, 55:1024]
# width = 969, height = 1200
# In yard2.js, room wall was: R(g, -80, -80, 1240, 1400)
# width = 1240 - (-80) = 1320
# height = 1400 - (-80) = 1480
# 969 / 1320 = 0.734
# 1200 / 1480 = 0.811
print("Done inspecting.")
