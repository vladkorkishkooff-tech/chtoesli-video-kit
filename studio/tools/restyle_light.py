# Светлая версия «Ink & Clay» для ep_blackout_calm_paper.html (применяется к v1-файлу один раз)
p='/data/chtoesli/studio/ep_blackout_calm_paper.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt, (n, a[:90]); s=s.replace(a,b)

# ═════ A. CSS, defs, UI ═════
rep("""  :root { --ink: #141413; --clay: #D97757; --olive: #788C5D; --sky: #6A9BCC; --paper: #F4F2EB; --serif: Georgia, serif; }""",
"""  :root { --ink: #1A1A1A; --clay: #C8714B; --olive: #7F8A69; --sky: #7C93B4; --paper: #FCF5EB; --serif: Georgia, serif; }
  .tex { position: absolute; inset: 0; pointer-events: none; background-size: 1024px 1024px; }""")
rep("""    <pattern id="paperPat" width="512" height="512" patternUnits="userSpaceOnUse"><rect width="512" height="512" fill="#F4F2EB"/><rect width="512" height="512" filter="url(#fibre)"/></pattern>""",
"""    <pattern id="paperPat" width="512" height="512" patternUnits="userSpaceOnUse"><rect width="512" height="512" fill="#FCF5EB"/></pattern>
    <!-- акварельная заливка предмета: рваный край ≤ 2 px, плотность пигмента пятнами (soft-light: тёмное и светлое меняются соразмерно), тёмная кайма по краю -->
    <filter id="wash" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="5" result="N"/>
      <feDisplacementMap in="SourceGraphic" in2="N" scale="4" xChannelSelector="R" yChannelSelector="G" result="S"/>
      <feColorMatrix in="N" type="matrix" values="0 0 .9 0 .05  0 0 .9 0 .05  0 0 .9 0 .05  0 0 0 0 1" result="G"/>
      <feBlend in="G" in2="S" mode="soft-light" result="M"/>
      <feComposite in="M" in2="S" operator="in" result="Mi"/>
      <feGaussianBlur in="S" stdDeviation="2.2" result="Bl"/>
      <feComposite in="S" in2="Bl" operator="out" result="rim"/>
      <feColorMatrix in="rim" type="matrix" values=".72 0 0 0 0  0 .72 0 0 0  0 0 .76 0 0  0 0 0 .55 0" result="rimD"/>
      <feMerge><feMergeNode in="Mi"/><feMergeNode in="rimD"/></feMerge>
    </filter>
    <!-- то же без сдвига края и без каймы, пятна слабее — для фигур со своим контуром (шторы, дверь): прямые линии остаются прямыми -->
    <filter id="washS" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="5" result="N"/>
      <feColorMatrix in="N" type="matrix" values="0 0 .5 0 .25  0 0 .5 0 .25  0 0 .5 0 .25  0 0 0 0 1" result="G"/>
      <feBlend in="G" in2="SourceGraphic" mode="soft-light" result="M"/>
      <feComposite in="M" in2="SourceGraphic" operator="in"/>
    </filter>
    <!-- ткани героя (карандаш по гуаши); паттерны едут вместе с героем -->
    <pattern id="phHood" width="256" height="256" patternUnits="userSpaceOnUse"><image href="tex/hoodie.png" width="256" height="256"/></pattern>
    <pattern id="phHoodD" width="256" height="256" patternUnits="userSpaceOnUse"><image href="tex/hoodie_dark.png" width="256" height="256"/></pattern>
    <pattern id="phJeans" width="256" height="256" patternUnits="userSpaceOnUse"><image href="tex/jeans.png" width="256" height="256"/></pattern>
    <pattern id="phKnit" width="48" height="48" patternUnits="userSpaceOnUse"><image href="tex/knit.png" width="48" height="48"/></pattern>
    <!-- свет дали: бледная холодная заливка стен уходит кругом от лампы, под ней — тёплая бумага -->
    <radialGradient id="litGrad"><stop offset="0" stop-color="#000"/><stop offset=".72" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
    <mask id="litMask" maskUnits="userSpaceOnUse" x="-600" y="-200" width="4600" height="2200"><rect x="-600" y="-200" width="4600" height="2200" fill="#fff"/><circle id="litC" cx="1855" cy="870" r="0" fill="url(#litGrad)"/></mask>""")
rep("""<radialGradient id="lampGlow"><stop offset="0" stop-color="#E9C46A" stop-opacity=".55"/><stop offset=".45" stop-color="#E9C46A" stop-opacity=".22"/><stop offset="1" stop-color="#E9C46A" stop-opacity="0"/></radialGradient>""",
"""<radialGradient id="lampGlow"><stop offset="0" stop-color="#F2C27B" stop-opacity=".6"/><stop offset=".45" stop-color="#F2C27B" stop-opacity=".24"/><stop offset="1" stop-color="#F2C27B" stop-opacity="0"/></radialGradient>""")
rep("""  <defs><linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F2EB" stop-opacity="0"/><stop offset=".2" stop-color="#F4F2EB"/></linearGradient>
  <linearGradient id="bandT" x1="0" y1="0" x2="0" y2="1"><stop offset=".75" stop-color="#F4F2EB"/><stop offset="1" stop-color="#F4F2EB" stop-opacity="0"/></linearGradient></defs>
  <rect x="0" y="1340" width="1080" height="580" fill="url(#band)"/>
  <rect x="0" y="0" width="1080" height="300" fill="url(#bandT)"/>""",
"""  <defs>
    <!-- сухая кисть для глиняного маркера: продольные просветы и рваный край, как плашка «5 шагов» на превью -->
    <filter id="dry" x="-3%" y="-40%" width="106%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency=".035 .5" numOctaves="2" seed="8" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in" result="m"/>
      <feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="4" result="w"/>
      <feDisplacementMap in="m" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <path id="pp" fill="#FCF5EB" fill-rule="evenodd"/>
  <g id="frm"></g>""")
rep("""  <g id="mk"></g>""","""  <g id="mk" filter="url(#dry)"></g>""")
rep("""<circle cx="540" cy="384" r="66" fill="#F4F2EB" stroke="#141413" stroke-width="7"/>""","""<circle cx="540" cy="384" r="66" fill="#FCF5EB" stroke="#1A1A1A" stroke-width="3.4"/>""")
rep("""<g stroke="#141413" stroke-width="5" stroke-linecap="round"><path d="M540 326 V336\"""","""<g stroke="#1A1A1A" stroke-width="2.6" stroke-linecap="round"><path d="M540 326 V336\"""")
rep("""<path id="ckH" d="M540 384 V350" stroke="#141413" stroke-width="9" stroke-linecap="round"/>""","""<path id="ckH" d="M540 384 V350" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/>""")
rep("""<path id="ckM" d="M540 384 V334" stroke="#D97757" stroke-width="6" stroke-linecap="round"/>""","""<path id="ckM" d="M540 384 V334" stroke="#C8714B" stroke-width="3.6" stroke-linecap="round"/>""")
rep("""<circle cx="540" cy="384" r="7" fill="#141413"/>""","""<circle cx="540" cy="384" r="5" fill="#1A1A1A"/>""")
rep("""<rect id="ckBg" x="610" y="356" width="10" height="66" rx="16" fill="#F4F2EB" fill-opacity=".94"/>""","""<rect id="ckBg" x="610" y="356" width="10" height="66" rx="12" fill="#FCF5EB" stroke="#1A1A1A" stroke-width="2"/>""")
i0=s.index('<g id="icons">'); i1=s.index('</g></g>', i0)+len('</g></g>')
ic=s[i0:i1]
ic=ic.replace('fill="#F4F2EB" stroke="#141413" stroke-width="6"','fill="#FCF5EB" stroke="#1A1A1A" stroke-width="3"')
ic=ic.replace('stroke="#141413" stroke-width="5"','stroke="#1A1A1A" stroke-width="3"')
ic=ic.replace('#6A9BCC','#7C93B4').replace('#3E4A5E','#2E3852').replace('#ECE3D1','#F1ECE2').replace('fill="#D97757"','fill="#C8714B"')
ic=ic.replace('stroke="#D97757" stroke-width="11"','stroke="#A65A3B" stroke-width="7"').replace('#788C5D','#A65A3B').replace('stroke="#F4F2EB" stroke-width="4"','stroke="#FCF5EB" stroke-width="3"')
s=s[:i0]+ic+s[i1:]
rep("""</svg>
<script>
const {cam, sfx, el, on, EASE, prog, clamp} = E;""","""</svg>
<div class="tex" style="background-image:url(tex/paper_mul.png);mix-blend-mode:multiply"></div>
<div class="tex" style="background-image:url(tex/paper_scr.png);mix-blend-mode:screen"></div>
<script>
const {cam, sfx, el, on, EASE, prog, clamp} = E;
// текстуры — до первого кадра (рендер ждёт window.__ready)
window.__ready = Promise.all(['paper_mul', 'paper_scr', 'sky', 'wall_bath', 'wall_room', 'wall_kit', 'glass_room', 'glass_kit', 'hoodie', 'hoodie_dark', 'jeans', 'knit']
  .map((n) => { const im = new Image(); im.src = 'tex/' + n + '.png'; return im.decode().catch(() => console.warn('нет текстуры', n)); })).then(() => document.fonts.ready);""")
rep("""const B = BRUSH(E), K = INKCLAY(E, B), PH = PAPERHERO(E);
const INK = '#141413', CLAY = '#D97757', CLAY2 = '#B4553A', SKIN = '#EFC9A8', SKY = '#6A9BCC', SKY2 = '#4E7DB0', OLIVE = '#788C5D', SAND = '#E9C46A', NIGHT = '#33476E', PAPER = '#F4F2EB';
const WOOD = '#C9A27E', SLAB = '#E6E0D2', WHITE = '#FBFAF6', DARK = '#2B2F3A', STEEL = '#B9C0C6', CURT = '#C7A27C', GLASS = '#DDE8F0';""",
"""// Палитра превью канала: тушь, глина, серо-синий, кремовая бумага; остальное — их разбавления. Сцена светлая: всё читается
const B = BRUSH(E), K = INKCLAY(E, B, {inkK: 0.55, sketch: 0.4, sketchMin: 2.2, wash: 'url(#wash)', bleed: true, card: {fill: '#FCF5EB', stroke: '#1A1A1A', w: 2.6, rx: 10},
  safe: {l: 112, r: 968, t: 318, b: 1380}}), PH = PAPERHERO(E);   // пометки с карточкой целиком внутри панели
const INK = '#1A1A1A', CLAY = '#C8714B', CLAY2 = '#A65A3B', SKIN = '#F5DDD3', SKY = '#7C93B4', SKY2 = '#5D7396', OLIVE = '#7F8A69', SAND = '#E8C27A', NIGHT = '#17284A', PAPER = '#FCF5EB';
const WOOD = '#A48E70', SLAB = '#E6E0D2', WHITE = '#F3EEE4', DARK = '#252A38', STEEL = '#BFC1C2', CURT = '#B7A487', GLASS = '#D5DCE2', SOFA = '#6F7C9A', SOFA2 = '#8794B0';""")
rep("""  el('text', {x: 90, y: 200, fill: OLIVE, 'letter-spacing': 7}, g).textContent = a;""","""  el('text', {x: 90, y: 200, fill: INK, opacity: 0.85, 'letter-spacing': 7}, g).textContent = a;""")
rep("""  const c1 = el('text', {x: 540, y: 1448,""","""  const c1 = el('text', {x: 540, y: 1508,""")
rep("""  const c2 = el('text', {x: 540, y: 1548,""","""  const c2 = el('text', {x: 540, y: 1608,""")
rep("""  UB.stroke(`M${540 - w / 2} 1530 C${540 - w / 4} 1526 ${540 + w / 4} 1529 ${540 + w / 2} 1522`, t0 + 0.25, t0 + 0.55, {w: 34, color: 'rgba(217,119,87,0.62)',""",
    """  UB.stroke(`M${540 - w / 2} 1590 C${540 - w / 4} 1586 ${540 + w / 4} 1589 ${540 + w / 2} 1582`, t0 + 0.25, t0 + 0.55, {w: 34, color: 'rgba(200,113,75,0.7)',""")
rep("""    c.c2.setAttribute('transform', `translate(540 1534) scale(${(1.3 - 0.3 * k2).toFixed(3)}) translate(-540 -1565)`);""",
    """    c.c2.setAttribute('transform', `translate(540 1594) scale(${(1.3 - 0.3 * k2).toFixed(3)}) translate(-540 -1625)`);""")

# ═════ B. Рамка панели, дом, стены ═════
rep("""// ══ Опорные моменты — слова диктора ══""","""// ══ Лист: сцена — акварельная панель на бумаге в тонкой рамке тушью (как на превью канала) ══
const PAN = {x0: 56, y0: 272, x1: 1024, y1: 1430};   // рамка тушью
{
  // край заливки не доходит до рамки на 6–14 px (полоска бумаги между акварелью и линией) — рисунок не вылезает за рамку
  const H0 = {x0: 68, y0: 283, x1: 1013, y1: 1419};
  const hsh = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const wob = (q, k) => 4 * Math.sin(q * 0.011 + k) + 2.2 * Math.sin(q * 0.037 + k * 2.1) + 0.9 * Math.sin(q * 0.11 + k * 3.7) + (hsh(Math.floor(q / 9), k) - 0.5) * 1.1;
  const pts = [], side = (ax, ay, bx, by, nx, ny, k) => { const L = Math.hypot(bx - ax, by - ay); for (let q = 0; q < L; q += 6) { const u = q / L, o = wob(q, k); pts.push([ax + (bx - ax) * u + nx * o, ay + (by - ay) * u + ny * o]); } };
  side(H0.x0, H0.y0, H0.x1, H0.y0, 0, -1, 1); side(H0.x1, H0.y0, H0.x1, H0.y1, 1, 0, 2); side(H0.x1, H0.y1, H0.x0, H0.y1, 0, 1, 3); side(H0.x0, H0.y1, H0.x0, H0.y0, -1, 0, 4);
  ui('pp').setAttribute('d', 'M-20 -20H1100V1940H-20Z M' + pts.map((q) => F1(q[0]) + ' ' + F1(q[1])).join('L') + 'Z');
  const UF = BRUSH({...E, lineLayer: ui('frm'), defs: ui('ui').querySelector('defs'), on: (f) => E.on(f)});
  const {x0, y0, x1, y1} = PAN, fo = {w: 3.4, color: INK, taper: [0.03, 0.05]};
  UF.stroke(`M${x0 - 12} ${y0 + 1} L${x1 + 9} ${y0 - 1}`, 0.02, 0.32, fo);
  UF.stroke(`M${x1 + 1} ${y0 - 13} L${x1 - 1} ${y1 + 10}`, 0.2, 0.55, fo);
  UF.stroke(`M${x1 + 11} ${y1} L${x0 - 9} ${y1 + 2}`, 0.42, 0.72, fo);
  UF.stroke(`M${x0 + 1} ${y1 + 12} L${x0 - 1} ${y0 - 10}`, 0.6, 0.9, fo);
  UF.stroke(`M${x1 + 6} ${y0 + 46} L${x1 + 5} ${y0 + 560}`, 0.8, 1.0, {w: 2.2, color: INK, taper: [0.2, 0.3]}); // второй проход справа, как на превью
}

// ══ Опорные моменты — слова диктора ══""")
# дом: светлое зимнее небо, фасад — светлая глина; окна: серо-синее стекло, поверх — тёплый свет, который гаснет
rep("""  clay(sc, R(110, 320, 860, 930, 18), -0.4, NIGHT, 0, 0);
  clay(sc, O(830, 430, 44), -0.35, PAPER, 0, 0);""","""  el('image', {href: 'tex/sky.png', x: -130, y: 70, width: 1340, height: 1240, preserveAspectRatio: 'none'}, sc.clay); // зимнее небо — светлая акварель шире кадра
  clay(sc, R(300, 440, 480, 810), -0.4, '#D9AD8F', 0, 0);   // фасад — светлая глина
  { let dw = ''; for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) dw += R(330 + c * 92, 470 + r * 78, 56, 50, 4);
    clay(sc, dw, 0.1, '#8E9BAA', 0, 0); }                     // стекло без света — серо-синее (одной заливкой)
  clay(sc, O(830, 430, 44), -0.35, PAPER, 0, 0);""")
rep("""const backL = el('g', {}, flat.clay);   // вода, свет лампы — под заливками вещей""",
"""const wallL = el('g', {}, flat.clay);   // без света: бледная холодная отмывка на стенах; на «свет» уходит кругом от лампы
const backL = el('g', {}, flat.clay);   // вода, свет лампы — под заливками вещей""")
rep("""  fillIn(flat, R(-80, FL, 3400, 56), t0, SLAB); fillIn(flat, R(-80, CE - 56, 3400, 56), t0 + 0.05, SLAB);""",
"""  secHatch(-80, FL, 3400, 56, t0, 0.8); secHatch(-80, CE - 56, 3400, 56, t0 + 0.05, 0.8);""")
rep("""  const wall = (x, t, door) => { const top = door ? 600 : FL; fillIn(flat, R(x - 15, CE, 30, top - CE), t, SLAB);""",
"""  const wall = (x, t, door) => { const top = door ? 600 : FL; secHatch(x - 15, CE, 30, top - CE, t, 0.4);""")
rep("""  wall(0, t0 + 0.3); wall(1080, t0 + 0.4, true); wall(2160, t0 + 0.5, true); wall(3240, t0 + 0.6);
}""","""  wall(0, t0 + 0.3); wall(1080, t0 + 0.4, true); wall(2160, t0 + 0.5, true); wall(3240, t0 + 0.6);
  // стены без света: три комнаты, у каждой своя бледная акварельная отмывка с рваным краем, проступает за 0,6 с
  [['wall_bath', 15], ['wall_room', 1095], ['wall_kit', 2175]].forEach(([n, x0], i) => {
    const im = el('image', {href: `tex/${n}.png`, x: x0 - 34, y: CE - 34, width: 1118, height: 978, preserveAspectRatio: 'none'}, wallL);
    appear(im, t0 + 0.2 + i * 0.1, 0.6);
  });
}""")
rep("""/** Предмет из деталей [d, цвет|null, толщина туши]; детали рисуются по очереди. */""",
"""/** Разрез перекрытия/стены: штриховка тушью под 45°, проявляется слева направо. */
let SHN = 0;
function secHatch(x, y, w, h, t0, dur = 0.6) {
  let d = '';
  for (let k = -h; k < w; k += 15) { let ax = x + k, ay = y + h, bx = x + k + h, by = y; if (ax < x) { ay -= x - ax; ax = x; } if (bx > x + w) { by += bx - (x + w); bx = x + w; } if (bx > ax) d += `M${F1(ax)} ${F1(ay)}L${F1(bx)} ${F1(by)}`; }
  const id = 'sh' + (++SHN), cp = el('clipPath', {id}, E.defs), r = el('rect', {x, y: y - 4, width: 0, height: h + 8}, cp);
  const p = el('path', {d, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.4, 'clip-path': `url(#${id})`}, flat.ink);
  on((t) => { const q = EASE.io2(prog(t, t0, t0 + dur)); r.setAttribute('width', F1(w * q)); show(p, q > 0); });
}
/** Предмет из деталей [d, цвет|null, толщина туши]; детали рисуются по очереди. */""")
rep("""/** Динамический элемент, проявляется к t0. */
const appear = (n, t0, d = 0.3) =>""","""/** Динамический элемент, проявляется к t0. */
var appear = (n, t0, d = 0.3) =>""")

# ═════ C. Герой, вещи, свет ═════
rep("""const you = PH.person(heroL, {h: 560, top: CLAY, top2: CLAY2, sweater: OLIVE, seed: 1});""",
"""// герой превью: оранжевое худи с капюшоном на голове, тёмные джинсы; ткань — карандашная текстура, едет вместе с ним
const you = PH.person(heroL, {h: 560, style: 'hood', top: 'url(#phHood)', top2: 'url(#phHoodD)', jeans: 'url(#phJeans)', sweater: 'url(#phKnit)', skin: SKIN, shoe: '#23252C', hair: '#1C1B1D', seed: 1,
  anchor: ['phHood', 'phHoodD', 'phJeans', 'phKnit'].map((id) => document.getElementById(id))});""")
rep("""thing(flat, roomT + 0.6, [[R(1400, 948, 360, SEAT - 942, 18), SKY2, 6], [R(1418, SEAT - 4, 324, 42, 12), SKY, 5], [R(1388, SEAT + 36, 384, 66, 8), SKY2, 6],
  [R(1380, 1030, 54, SEAT + 102 - 1030, 18), SKY, 6], [R(1726, 1030, 54, SEAT + 102 - 1030, 18), SKY, 6],""",
"""thing(flat, roomT + 0.6, [[R(1400, 948, 360, SEAT - 942, 18), SOFA, 6], [R(1418, SEAT - 4, 324, 42, 12), SOFA2, 5], [R(1388, SEAT + 36, 384, 66, 8), SOFA, 6],
  [R(1380, 1030, 54, SEAT + 102 - 1030, 18), SOFA2, 6], [R(1726, 1030, 54, SEAT + 102 - 1030, 18), SOFA2, 6],""")
rep("""thing(flat, roomT + 1.0, [[R(1440, 470, 280, 370, 6), NIGHT, 6],""",
"""appear(el('image', {href: 'tex/glass_room.png', x: 1432, y: 462, width: 296, height: 386, preserveAspectRatio: 'none'}, flat.clay), roomT + 1.0, 0.4); // стекло: светлое серо-синее
thing(flat, roomT + 1.0, [[R(1440, 470, 280, 370, 6), null, 6],""")
rep("""thing(flat, roomT + 1.75, [[O(1855, 1056, 30, 8), CLAY2, 4], ['M1855 1050 V902', null, 6], ['M1813 902 L1897 902 L1880 830 L1830 830 Z', '#EFE6D2', 5],""",
"""thing(flat, roomT + 1.75, [[O(1855, 1056, 30, 8), '#3B3936', 4], ['M1855 1050 V902', null, 6], ['M1813 902 L1897 902 L1880 830 L1830 830 Z', '#E2DACB', 5],""")
rep("""const curt = [0, 1].map(() => el('path', {fill: CURT, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round'}, dynL));""",
"""const curt = [0, 1].map(() => el('path', {fill: CURT, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', filter: 'url(#washS)'}, dynL));""")
rep("""const leaf = el('path', {fill: WOOD, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round'}, dynL);""",
"""const leaf = el('path', {fill: WOOD, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round', filter: 'url(#washS)'}, dynL);""")
rep("""  ink(flat, lines, bathT, 0.7, 2.4, {color: 'rgba(20,20,19,0.28)'});""",
"""  ink(flat, lines, bathT, 0.7, 2.4, {color: 'rgba(26,26,26,0.18)', noSketch: true});   // плитка — тонкой сеткой туши""")
rep("""thing(flat, kitT + 1.5, [['M3062 900 L3092 884', null, 8], [R(3080, 480, 140, 380, 6), NIGHT, 6],""",
"""appear(el('image', {href: 'tex/glass_kit.png', x: 3072, y: 472, width: 156, height: 396, preserveAspectRatio: 'none'}, flat.clay), kitT + 1.5, 0.4);
thing(flat, kitT + 1.5, [['M3062 900 L3092 884', null, 8], [R(3080, 480, 140, 380, 6), null, 6],""")
rep("""fdoor = el('path', {fill: WHITE, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round'}, dynL)""",
"""fdoor = el('path', {fill: WHITE, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round', filter: 'url(#washS)'}, dynL)""")
rep("""  P(R(2210, 826, 220, 376, 6), '#E8EEF0', 4);""","""  P(R(2210, 826, 220, 376, 6), '#DCE0E2', 4);""")
rep("""  P(O(2400, 1040, 19, 18), '#C8443A', 4);""","""  P(O(2400, 1040, 19, 18), '#B5533C', 4);""")
rep("""const shadeLit = el('path', {d: 'M1813 902 L1897 902 L1880 830 L1830 830 Z', fill: SAND, stroke: INK, 'stroke-width': 5}, dynL);""",
"""const shadeLit = el('path', {d: 'M1813 902 L1897 902 L1880 830 L1830 830 Z', fill: '#F4D49A', stroke: INK, 'stroke-width': 5}, dynL);
// свет дали: холодная отмывка уходит со стен кругом от лампы (маска — только пока идёт свет, иначе лишняя работа на кадр)
{ const litC = document.getElementById('litC');
  on((t) => { const q = EASE.io2(prog(t, POWER2 + 0.05, POWER2 + 1.7)); litC.setAttribute('r', F1(3600 * q)); if (q > 0) wallL.setAttribute('mask', 'url(#litMask)'); else wallL.removeAttribute('mask'); }); }""")
rep("""E.cams.sort((a, b) => a.t - b.t);
const J3""","""E.cams.sort((a, b) => a.t - b.t);
// тонкая тушь и у движущихся вещей: их контуры заданы прямо в SVG
for (const r of [dynL, itemL]) r.querySelectorAll('[stroke-width]').forEach((n) => n.setAttribute('stroke-width', (+n.getAttribute('stroke-width') * 0.6).toFixed(2)));
const J3""")
open(p,'w').write(s); print('light restyle ok', len(s))
