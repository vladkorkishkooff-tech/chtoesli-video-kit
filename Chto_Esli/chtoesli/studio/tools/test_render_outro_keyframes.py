from playwright.sync_api import sync_playwright
import os

html_path = os.path.abspath('D:/Chanels/Chto_Esli/chtoesli/studio/ep_lavina_outro.html')
out_dir = 'D:/Chanels/Chto_Esli/chtoesli/review/outro_test'
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.on('pageerror', lambda e: print('PAGE ERROR:', e))
    page.on('console', lambda msg: print('CONSOLE:', msg.text))
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(1000)
    
    for t in [0.5, 1.5, 2.5, 3.5, 4.2]:
        page.evaluate(f'window.__seek({t})')
        page.wait_for_timeout(100)
        page.screenshot(path=f'{out_dir}/outro_t{t:.1f}.jpg', type='jpeg', quality=95)
    
    browser.close()

print('Keyframes rendered successfully.')
