from PIL import Image

im = Image.open('D:/Chanels/Chto_Esli/chtoesli/episodes/lavina/sofa_canonical.jpg')
c = im.crop((50, 370, 120, 420))
c.save('D:/Chanels/Chto_Esli/chtoesli/review/blackout_cat_360.jpg')
print('Saved.')
