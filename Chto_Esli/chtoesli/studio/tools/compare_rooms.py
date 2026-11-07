import cv2

play = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/review/test_room_playwright.jpg')
orig = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')

# In test_room_playwright.jpg:
# The svg viewBox was 0 0 1080 1920.
# Let's crop the same region: [231:1431, 55:1024]
crop_play = play[231:1431, 55:1024]
crop_orig = orig[231:1431, 55:1024]

cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/compare_play.jpg', crop_play)
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/review/compare_orig.jpg', crop_orig)
print('Comparison crops saved.')
