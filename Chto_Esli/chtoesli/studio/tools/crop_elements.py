import cv2

img = cv2.imread('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/inspect_orig/orig_44.0.jpg')
# Crop character: y: 650..1200, x: 150..550
char_crop = img[650:1200, 150:550]
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/char_crop.jpg', char_crop)

# Crop cat: y: 900..1100, x: 500..900
cat_crop = img[900:1100, 500:900]
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/cat_crop.jpg', cat_crop)

# Crop right armrest: y: 850..1200, x: 750..950
arm_crop = img[850:1200, 750:950]
cv2.imwrite('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/arm_crop.jpg', arm_crop)

print('Crops saved.')
