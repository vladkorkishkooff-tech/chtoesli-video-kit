import os
import cv2
import numpy as np
from playwright.sync_api import sync_playwright

orig_path = r'D:\Chanels\Chto_Esli\chtoesli\review\orig_frame_44s.jpg'
orig = cv2.imread(orig_path)
clean_bg = orig.copy()

# Seamless blend for curtain:
# The curtain in orig is at x in [262, 325], y in [231, 1431].
# In orig, the curtain above y=780 is clean.
# We copy a clean strip of curtain (y=600..740, x=262..325) and blend vertically:
clean_curt_strip = orig[600:740, 262:325]
target_h = 920 - 780 # 140 px
resized_curt = cv2.resize(clean_curt_strip, (325 - 262, target_h))

# Soft blend into clean_bg
clean_bg[780:920, 262:325] = resized_curt

# Wall at x=325..450, y=770..820:
# Sample clean wall above (y=720..770, x=325..450)
clean_wall_strip = orig[720:770, 325:450]
clean_bg[770:820, 325:450] = cv2.resize(clean_wall_strip, (450 - 325, 50))

# Soft Gaussian blur along the vertical seam at x=325 (boundary between curtain and wall)
seam_roi = clean_bg[770:820, 320:330]
clean_bg[770:820, 320:330] = cv2.GaussianBlur(seam_roi, (5, 5), 0)

# Center seam cleanup
clean_bg[800:830, 520:555] = orig[800:830, 580:615]

clean_bg_path = r'D:\Chanels\Chto_Esli\chtoesli\review\orig_bg_pristine_v4.jpg'
cv2.imwrite(clean_bg_path, clean_bg)

# Build HTML template
html_content = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{ margin: 0; padding: 0; width: 1080px; height: 1920px; overflow: hidden; background: #F4F2EB; }}
  svg {{ position: absolute; inset: 0; width: 1080px; height: 1920px; }}
</style>
<script src="D:/Chanels/Chto_Esli/chtoesli/studio/lib/geom2.js"></script>
<script src="D:/Chanels/Chto_Esli/chtoesli/studio/lib/sosed2.js"></script>
</head>
<body>
<svg id="svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs id="defs"></defs>

  <!-- 1. Background: Pristine original room with mountains, wall, lamp, torn paper border -->
  <image href="file:///{clean_bg_path.replace(os.sep, '/')}" x="0" y="0" width="1080" height="1920"/>

  <!-- 2. Clean Sofa Vector -->
  <g id="sofa" stroke="#211C1A" stroke-linecap="round" stroke-linejoin="round">
    <!-- Backrest base -->
    <path d="M 305 812 Q 305 808 322 808 H 756 Q 774 808 774 812 V 1010 H 305 Z" fill="#5A7584" stroke-width="3.2"/>
    
    <!-- Left Backrest Cushion -->
    <path d="M 314 818 Q 314 816 326 816 H 526 Q 532 816 532 824 V 998 Q 532 1004 526 1004 H 326 Q 314 1004 314 996 Z" fill="#6B8897" stroke-width="2.6"/>
    <path d="M 330 828 H 518 V 992 H 330 Z" fill="none" stroke="#526E7C" stroke-width="1.4" opacity="0.4"/>

    <!-- Right Backrest Cushion -->
    <path d="M 546 818 Q 546 816 552 816 H 752 Q 764 816 764 818 V 996 Q 764 1004 752 1004 H 552 Q 546 1004 546 998 Z" fill="#6B8897" stroke-width="2.6"/>
    <path d="M 560 828 H 748 V 992 H 560 Z" fill="none" stroke="#526E7C" stroke-width="1.4" opacity="0.4"/>

    <!-- Left Armrest: x=186..305, y=915..1205 -->
    <path d="M 230 918 Q 186 918 186 960 V 1195 Q 186 1205 200 1205 H 295 Q 305 1205 305 1195 V 960 Q 305 918 260 918 Z" fill="#5F7D8C" stroke-width="3.2"/>
    <path d="M 205 930 Q 246 925 286 930 V 1190 H 205 Z" fill="none" stroke="#506976" stroke-width="1.6" opacity="0.5"/>

    <!-- Right Armrest: x=773..892, y=915..1205 -->
    <path d="M 818 918 Q 773 918 773 960 V 1195 Q 773 1205 783 1205 H 878 Q 892 1205 892 1195 V 960 Q 892 918 848 918 Z" fill="#5F7D8C" stroke-width="3.2"/>
    <path d="M 793 930 Q 833 925 873 930 V 1190 H 793 Z" fill="none" stroke="#506976" stroke-width="1.6" opacity="0.5"/>

    <!-- Front apron -->
    <rect x="220" y="1170" width="638" height="35" rx="4" fill="#536E7B" stroke-width="3.0"/>
    
    <!-- Wooden legs -->
    <rect x="255" y="1205" width="22" height="20" rx="3" fill="#3B2A1E" stroke-width="2.6"/>
    <rect x="801" y="1205" width="22" height="20" rx="3" fill="#3B2A1E" stroke-width="2.6"/>

    <!-- Left Seat Cushion: x=305..536, y=1006..1172 -->
    <path d="M 307 1010 Q 307 1006 315 1006 H 528 Q 536 1006 536 1012 V 1166 Q 536 1172 528 1172 H 315 Q 307 1172 307 1166 Z" fill="#718E9E" stroke-width="3.0"/>
    
    <!-- Right Seat Cushion: x=542..773, y=1006..1172 -->
    <path d="M 542 1012 Q 542 1006 550 1006 H 763 Q 771 1006 771 1010 V 1166 Q 771 1172 763 1172 H 550 Q 542 1172 542 1166 Z" fill="#718E9E" stroke-width="3.0"/>
    
    <!-- Highlights & shadows -->
    <line x1="315" y1="1012" x2="528" y2="1012" stroke="#8CAAB9" stroke-width="2.5" opacity="0.7"/>
    <line x1="550" y1="1012" x2="763" y2="1012" stroke="#8CAAB9" stroke-width="2.5" opacity="0.7"/>
    <line x1="315" y1="1166" x2="528" y2="1166" stroke="#48616E" stroke-width="2.5" opacity="0.6"/>
    <line x1="550" y1="1166" x2="763" y2="1166" stroke="#48616E" stroke-width="2.5" opacity="0.6"/>
  </g>

  <!-- 3. Canonical Cat peacefully curled on Right Cushion -->
  <image href="file:///D:/Chanels/Chto_Esli/Klubok_project/09_game/art/cat/alert.png" x="575" y="990" width="195" height="135"/>

  <!-- 4. Hero Seated Squarely on Left Cushion -->
  <g id="heroG"></g>
</svg>

<script>
  const {{mk}} = GEOM2, S2 = SOSED2();
  const heroG = document.getElementById('heroG');
  const defs = document.getElementById('defs');
  
  // Hero seated squarely on left cushion:
  const hero = S2.side(heroG, {{s: 0.58, lw: 3.2, off: 2.5, defs: defs}});
  hero.set({{
    x: 410,
    y: 1215,
    lean: -2,
    legF: {{hp: -86, kn: 86, toe: 0}},
    legN: {{hp: -83, kn: 83, toe: 0}},
    armN: {{sh: -34, el: -96}},
    armF: {{sh: -18, el: -62}},
    handN: 'grip',
    handF: 'flat',
    face: {{mouth: 'smile', eye: 'calm', look: [0.6, 0.2]}}
  }});

  // Steaming mug
  const mw = hero.wrist('N');
  const mugG = mk('g', {{transform: `translate(${{mw[0] + 16}} ${{mw[1] + 20}}) scale(0.50)`}}, heroG);
  mk('path', {{d: 'M40 -70q42 0 42 34t-42 34', fill: 'none', stroke: '#211C1A', 'stroke-width': 13}}, mugG);
  mk('path', {{d: 'M-46 -96H46V-8Q46 4 34 4H-34Q-46 4 -46 -8Z', fill: '#D06A33', stroke: '#211C1A', 'stroke-width': 6}}, mugG);
  mk('ellipse', {{cx: 0, cy: -96, rx: 46, ry: 10, fill: '#6E3B22', stroke: '#211C1A', 'stroke-width': 5}}, mugG);
  
  // Steam lines
  mk('path', {{
    d: 'M-10 -115 Q -18 -140 -8 -165 T -10 -215  M 12 -115 Q 22 -140 12 -165 T 14 -215',
    fill: 'none', stroke: '#F4EFE6', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.75
  }}, mugG);
</script>
</body>
</html>
"""

html_path = r'D:\Chanels\Chto_Esli\chtoesli\review\test_perfect_composite_v4.html'
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

out_img = r'D:\Chanels\Chto_Esli\chtoesli\review\test_perfect_composite_v4.jpg'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(1000)
    page.screenshot(path=out_img, type='jpeg', quality=95)
    browser.close()

print(f"Rendered v4: {out_img}")
