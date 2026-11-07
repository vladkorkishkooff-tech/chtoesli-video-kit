# Два вида одной страницы: светлый (по умолчанию) и ?look=chan — стиль канала; герой без капюшона; двор у дома
p='/data/chtoesli/studio/ep_blackout_calm_paper.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt, (n, a[:90]); s=s.replace(a,b)

# ── вид и текстуры
rep("""const {cam, sfx, el, on, EASE, prog, clamp} = E;
// текстуры — до первого кадра (рендер ждёт window.__ready)
window.__ready = Promise.all(['paper_mul', 'paper_scr', 'sky', 'wall_bath', 'wall_room', 'wall_kit', 'glass_room', 'glass_kit', 'hoodie', 'hoodie_dark', 'jeans', 'knit']
  .map((n) => { const im = new Image(); im.src = 'tex/' + n + '.png'; return im.decode().catch(() => console.warn('нет текстуры', n)); })).then(() => document.fonts.ready);""",
"""const {cam, sfx, el, on, EASE, prog, clamp} = E;
// Вид: ?look=chan — стиль канала (аватарка, шапка): бумага, тушь, терракота и их разбавления, тени — штриховкой; иначе — светлый
const CH = new URLSearchParams(location.search).get('look') === 'chan';
const TXC = new Set(['sky', 'wall_bath', 'wall_room', 'wall_kit', 'glass_room', 'glass_kit', 'jeans']);
const TX = (n) => `tex/${n}${CH && TXC.has(n) ? '_chan' : ''}.png`;
if (CH) { document.querySelector('#phJeans image').setAttribute('href', TX('jeans'));
  document.querySelectorAll('#lampGlow stop').forEach((n) => n.setAttribute('stop-color', '#EDB48A')); }
// текстуры — до первого кадра (рендер ждёт window.__ready)
window.__ready = Promise.all(['paper_mul', 'paper_scr', 'sky', 'wall_bath', 'wall_room', 'wall_kit', 'glass_room', 'glass_kit', 'hoodie', 'hoodie_dark', 'jeans', 'knit']
  .map((n) => { const im = new Image(); im.src = TX(n); return im.decode().catch(() => console.warn('нет текстуры', n)); })).then(() => document.fonts.ready);""")
rep("""const INK = '#1A1A1A', CLAY = '#C8714B', CLAY2 = '#A65A3B', SKIN = '#F5DDD3', SKY = '#7C93B4', SKY2 = '#5D7396', OLIVE = '#7F8A69', SAND = '#E8C27A', NIGHT = '#17284A', PAPER = '#FCF5EB';
const WOOD = '#A48E70', SLAB = '#E6E0D2', WHITE = '#F3EEE4', DARK = '#252A38', STEEL = '#BFC1C2', CURT = '#B7A487', GLASS = '#D5DCE2', SOFA = '#6F7C9A', SOFA2 = '#8794B0';""",
"""const INK = '#1A1A1A', CLAY = CH ? '#CF7F55' : '#C8714B', CLAY2 = CH ? '#B0603C' : '#A65A3B', SKIN = '#F5DDD3', SKY = CH ? '#B9B2A7' : '#7C93B4', SKY2 = CH ? '#8C857B' : '#5D7396',
  OLIVE = CH ? '#A39C91' : '#7F8A69', SAND = CH ? '#F0C49A' : '#E8C27A', NIGHT = '#17284A', PAPER = '#FCF5EB';
const WOOD = CH ? '#DDB08F' : '#A48E70', SLAB = '#E6E0D2', WHITE = CH ? '#F8F1E6' : '#F3EEE4', DARK = CH ? '#3B3734' : '#252A38', STEEL = CH ? '#CFC8BD' : '#BFC1C2',
  CURT = CH ? '#E6C4A6' : '#B7A487', GLASS = CH ? '#E6E0D6' : '#D5DCE2', SOFA = CH ? '#A09990' : '#6F7C9A', SOFA2 = CH ? '#B8B1A7' : '#8794B0';
const FACADE = CH ? '#D48B63' : '#D9AD8F', WIN0 = CH ? '#A39C92' : '#8E9BAA', SHADE0 = CH ? '#EFE6D8' : '#E2DACB', SHADE1 = CH ? '#F6CFA6' : '#F4D49A';
if (CH) ui0('icons').querySelectorAll('[fill]').forEach((n) => { const v = n.getAttribute('fill'); if (v === '#7C93B4') n.setAttribute('fill', SKY); if (v === '#2E3852') n.setAttribute('fill', DARK); if (v === '#C8714B') n.setAttribute('fill', CLAY); });""")
rep("""const R = (x, y, w, h, r = 0) =>""","""function ui0(id) { return document.getElementById(id); }
const R = (x, y, w, h, r = 0) =>""")
# ── герой без капюшона
rep("""// герой превью: оранжевое худи с капюшоном на голове, тёмные джинсы; ткань — карандашная текстура, едет вместе с ним
const you = PH.person(heroL, {h: 560, style: 'hood',""","""// герой: оранжевое худи без капюшона, открытая голова с тёмной стрижкой, тёмные джинсы; ткань — карандашная текстура, едет вместе с ним
const you = PH.person(heroL, {h: 560, style: 'hair',""")
# ── дом: цвета вида + двор
rep("""  el('image', {href: 'tex/sky.png',""","""  el('image', {href: TX('sky'),""")
rep("""  clay(sc, R(300, 440, 480, 810), -0.4, '#D9AD8F', 0, 0);   // фасад — светлая глина""","""  clay(sc, R(300, 440, 480, 810), -0.4, FACADE, 0, 0);   // фасад — светлая глина""")
rep("""    clay(sc, dw, 0.1, '#8E9BAA', 0, 0); }""","""    clay(sc, dw, 0.1, WIN0, 0, 0); }""")
rep("""  ink(sc, 'M110 1250 C170 1222 240 1226 300 1250 M780 1250 C840 1220 920 1226 980 1250', 0.6, 0.3, 4);""",
"""  ink(sc, 'M110 1250 C170 1222 240 1226 300 1250 M780 1250 C840 1220 920 1226 980 1250', 0.6, 0.3, 4);
  // двор: два фонаря по краям (гаснут вместе с окнами), качели и горка в снегу
  [[112, 1, wSv1 + 0.3], [968, -1, wSv1 + 0.55]].forEach(([x, s, off], i) => {
    const hx = x + s * 50, ti = 0.22 + i * 0.08, dome = `M${hx - 24} 966 Q${hx} 936 ${hx + 24} 966 Z`;
    clay(sc, `M${hx - 15} 970 L${hx + 15} 970 L${hx + 84} 1250 L${hx - 84} 1250 Z`, ti + 0.35, SAND, 0, 0, {op: 0.34, out: off});   // конус света на снег
    clay(sc, O(hx, 1252, 92, 12), ti + 0.4, SAND, 0, 0, {op: 0.55, out: off});
    clay(sc, dome, ti + 0.2, WIN0, 0, 0); clay(sc, dome, ti + 0.25, SAND, 0, 0, {out: off});
    clay(sc, O(hx, 968, 19, 5), ti + 0.3, SAND, 0, 0, {out: off});
    ink(sc, `M${x} 1250 V968 Q${x} 940 ${x + s * 28} 940 H${hx}`, ti, 0.45, 6);           // столб с кронштейном
    ink(sc, `M${x - 11} 1250 L${x - 7} 1206 H${x + 7} L${x + 11} 1250`, ti + 0.1, 0.2, 4);  // основание
    ink(sc, dome, ti + 0.3, 0.2, 4);
  });
  // качели: две А-стойки, перекладина со снегом, сиденье на цепях
  clay(sc, R(203, 1216, 54, 9, 3), 0.62, CLAY, 0, 0);
  ink(sc, 'M168 1250 L184 1150 L200 1250 M262 1250 L278 1150 L294 1250 M184 1150 H278', 0.45, 0.35, 5);
  ink(sc, 'M212 1152 V1216 M248 1152 V1216', 0.62, 0.2, 3);
  ink(sc, R(203, 1216, 54, 9, 3), 0.66, 0.15, 3.5);
  clay(sc, 'M180 1150 Q196 1136 226 1141 Q258 1135 282 1150 Z', 0.8, PAPER, 0, 0); ink(sc, 'M180 1150 Q196 1136 226 1141 Q258 1135 282 1150', 0.8, 0.15, 3);
  // горка: лесенка, площадка, скат
  clay(sc, 'M846 1158 H862 Q884 1158 896 1186 Q910 1226 940 1236 V1248 Q900 1246 884 1204 Q872 1172 856 1172 H846 Z', 0.6, CLAY, 0, 0);
  ink(sc, 'M806 1250 L826 1158 M824 1250 L842 1166 M846 1158 H862 Q884 1158 896 1186 Q910 1226 940 1236 V1248 Q900 1246 884 1204 Q872 1172 856 1172 H846 Z', 0.5, 0.35, 5);
  ink(sc, 'M811 1228 H829 M815 1206 H833 M820 1184 H838', 0.66, 0.15, 3);
  clay(sc, 'M842 1158 Q852 1148 864 1158 Z', 0.82, PAPER, 0, 0); ink(sc, 'M842 1158 Q852 1148 864 1158', 0.82, 0.12, 3);
  if (CH) hatch(sc, R(752, 446, 26, 800), 0.6, 0.95, {angle: -40, gap: 9, w: 1.8});   // тень фасада штриховкой""")
# ── лампа, стёкла, стены — цвета вида
rep("""['M1813 902 L1897 902 L1880 830 L1830 830 Z', '#E2DACB', 5],""","""['M1813 902 L1897 902 L1880 830 L1830 830 Z', SHADE0, 5],""")
rep("""fill: '#F4D49A', stroke: INK, 'stroke-width': 5}, dynL);""","""fill: SHADE1, stroke: INK, 'stroke-width': 5}, dynL);""")
rep("""el('image', {href: 'tex/glass_room.png',""","""el('image', {href: TX('glass_room'),""")
rep("""el('image', {href: 'tex/glass_kit.png',""","""el('image', {href: TX('glass_kit'),""")
rep("""    const im = el('image', {href: `tex/${n}.png`,""","""    const im = el('image', {href: TX(n),""")
rep("""  P(O(2400, 1040, 19, 18), '#B5533C', 4);""","""  P(O(2400, 1040, 19, 18), CH ? CLAY2 : '#B5533C', 4);""")
# ── стиль канала: тени крупных вещей — штриховкой туши, как на аватарке
rep("""E.cams.sort((a, b) => a.t - b.t);
// тонкая тушь""","""// стиль канала: тени крупных вещей штриховкой (тумба, диван, холодильник, плита, шкаф)
if (CH) [[R(1236, 1104, 60, 142), roomT + 0.35], [R(1392, SEAT + 40, 376, 58), roomT + 0.95], [R(2402, 650, 34, 552), kitT + 0.4], [R(2986, 970, 28, 276), kitT + 1.2], [R(2452, 968, 262, 262), kitT + 0.7, 0.45]]
  .forEach(([d, t, op = 1]) => hatch(flat, d, t, t + 0.35, {angle: -40, gap: 9, w: 1.8}).setAttribute('opacity', op));
E.cams.sort((a, b) => a.t - b.t);
// тонкая тушь""")
open(p,'w').write(s); print('look ok', len(s))
