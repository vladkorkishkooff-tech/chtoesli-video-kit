from playwright.sync_api import sync_playwright
import os

html_path = os.path.abspath('D:/Chanels/Chto_Esli/tongue_wip_10/studio/test_room_render.html')
out_jpg = 'D:/Chanels/Chto_Esli/chtoesli/review/test_room_playwright.jpg'

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        args=['--mute-audio', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
    )
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(1000)
    page.screenshot(path=out_jpg, type='jpeg', quality=95)
    browser.close()

print('Rendered successfully:', out_jpg)
