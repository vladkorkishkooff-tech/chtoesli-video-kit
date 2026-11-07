import cv2
import numpy as np

play = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/compare_play.jpg')
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/compare_orig.jpg')

# Let's find the right armrest in play and in orig:
# Right armrest top corner in play:
# Let's template match the right armrest top corner
template = play[730:830, 850:950]
res = cv2.matchTemplate(orig, template, cv2.TM_CCOEFF_NORMED)
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
print(f'Template match score: {max_val:.3f} at loc {max_loc}')

# Also let's check lamp and framed '?' positions in both
# '?' frame in play:
# y: 120..310, x: 440..610
# '?' frame in orig:
# y: 230..410, x: 440..600
print("Orig shape:", orig.shape)
print("Play shape:", play.shape)
