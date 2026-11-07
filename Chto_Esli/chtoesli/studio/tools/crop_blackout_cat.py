from PIL import Image

img = Image.open('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/sofa_canonical.jpg')
# In sofa_canonical.jpg, sofa is around y: 900..1400. Let's find the cat on the sofa:
# Cat is on the left cushion: x: 150..350, y: 1000..1150
cat_crop = img.crop((150, 1000, 320, 1150))
cat_crop.save('D:/Chanels/Chto_Esli/chtoesli/review/blackout_cat_crop.jpg')
print('Blackout cat crop saved.')
