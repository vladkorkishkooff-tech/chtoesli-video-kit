/* paperhero.js — герой рисовки «Бумага»: трубки тушью с глиной внутри, худи, короткие тёмные волосы, кисти-варежки.
 * Кинематика и пределы суставов — как у folk.js (бедро 0.24h, голень 0.23h, плечо 0.17h, предплечье 0.16h, голова 0.11h).
 * Только translate: ни scale, ни растяжения. Нижняя точка (подошва или колено) всегда на y ключа — пол или опора.
 * x ключа — где стоит передняя стопа в позе (не скользит при приседании); ходьба — между stand-ключами, фаза от пути.
 *
 *   const PH = PAPERHERO(E);   // → {person, back, POSES}
 *   const you = PH.person(parent, {h: 560});
 *   you.keys([[t, {x, y, pose: 'stand', look: 1, vis: 1, mouth: 0, breath: 0, sweater: 0, nod: 0, plaid: 0}], ...]);
 *     vis 0→1 — герой рисуется кистью (контур штрихом, глина проявляется), fade — прозрачность
 *   you.hand(i)(t) → [x, y] кисти (0 — ближняя); you.headAt(t) → центр головы; you.at(dx, dy)(t) → точка у бёдер
 *   o.blink — моргает по своему расписанию (от seed); you.armB.g — группа дальней руки: предмет в руке кладём сюда (между рукой и телом)
 *
 * style: 'hood' — герой превью канала: капюшон на голове, бледное лицо, чёлка, брови, тонкий контур, манжеты и пояс,
 *   завязки, карман-кенгуру. Цвета могут быть паттернами (url(#…)); o.anchor — паттерны, которые едут вместе с бёдрами
 *   (текстура ткани не «плывёт» по герою). Пропорции и скелет те же.
 * style: 'hair' — то же худи и тонкий контур, но без капюшона: открытая голова, короткая тёмная стрижка с чёлкой, ухо, ворот.
 * style: 'sosed' — «Сосед» с листа ref/character_sheet_sosed.png: маленькая голова (~1/6 роста), тёмные волосы с хохолком,
 *   ухо со стороны затылка, глаза-точки, маленькая улыбка, румянец; капюшон опущен — толстый воротник вокруг шеи (виден и
 *   поверх свитера); худи темнеет к подолу (градиент), тёмная резинка подола, карман-кенгуру; светлые брюки (o.jeans, дальняя
 *   штанина — o.jeans2), тёмные округлые ботинки со светлой полоской подошвы. Скелет, длины и позы — те же, меняется только вид.
 *   Доп. опции: o.collar, o.blush, o.shade, o.jeans2, o.skin2 (шея), o.sole, o.hairHi.
 * Жесты и ключи (v7):
 *   pose 'pocket' — руки в кармане-кенгуру (только без свитера: свитер кармана не имеет); в позе pk = [ближняя, дальняя] — доля «в кармане».
 *     Из кармана к жесту — через 'stand' (рука выходит из кармана вниз), иначе в переходе мелькает прямая вытянутая рука.
 *   'scratch'/'scratch2' — чешет затылок (чередовать через ~0.16 с); 'scratchMid' — промежуточная: pocket → stand → scratchMid → scratch.
 *   'bend'/'bendPull' — наклон стоя (вилку из розетки); 'sitToast' — сидя приподнять кружку.
 *   nod — наклон головы, градусы (+ вверх, − вниз); plaid 0→1 — плед ложится на плечи сверху вниз (нужна опция o.plaid — цвет пледа).
 *   PH.back(parent, o) — «Сосед» со спины, маленький, для общих планов (как на баннере канала); см. описание у функции back.
 */
(function (G) {
  const rad = (d) => (d * Math.PI) / 180, lerp = (a, b, u) => a + (b - a) * u;
  // «Сосед»: формы головы в долях радиуса лица R; x — к лицу (по взгляду), y — вниз; C — острые углы (висок, бакенбард, кончик хохолка)
  const S_HAIR = [[0.96, -0.26], [0.8, -0.5], [0.55, -0.58], [0.36, -0.5], [0.12, -0.62], [-0.16, -0.54], [-0.44, -0.58], [-0.68, -0.4], [-0.8, -0.12], [-0.84, 0.1],
    [-0.98, -0.1], [-1.18, -0.22], [-1.34, -0.08], [-1.36, -0.52], [-1.24, -1.02], [-0.92, -1.44], [-0.5, -1.7], [-0.16, -1.8], [0.12, -1.92], [0.32, -2.06], [0.44, -2.18], [0.45, -1.98], [0.58, -1.74],
    [0.86, -1.52], [1.04, -1.16], [1.08, -0.72], [1.04, -0.42]];
  const S_HAIR_C = new Set([0, 9, 20]);
  const S_EAR = [[-0.9, -0.1], [-1.1, -0.22], [-1.3, -0.16], [-1.4, 0.1], [-1.32, 0.4], [-1.14, 0.56], [-0.96, 0.5], [-0.88, 0.2]];
  const S_EAR_IN = [[-1.04, 0.0], [-1.22, 0.08], [-1.2, 0.32], [-1.04, 0.4]];
  const S_HAIR_HI = [[[-0.98, -1.16], [-0.58, -1.46], [-0.14, -1.6]], [[0.22, -1.6], [0.58, -1.47]]];
  // углы в градусах, минус — вперёд (по взгляду); [0] — ближняя рука/нога, [1] — дальняя
  const POSES = {
    stand: {lean: 0, sh: [6, -10], el: [-8, -10], hp: [-3, 4], kn: [3, 0]},
    reach: {lean: 4, sh: [-82, -8], el: [-8, -10], hp: [-3, 4], kn: [3, 0]},
    reachLow: {lean: 10, sh: [-48, -6], el: [-12, -10], hp: [-3, 4], kn: [3, 0]},
    reachUp: {lean: 2, sh: [-132, -10], el: [-10, -10], hp: [-3, 4], kn: [3, 0]},
    stop: {lean: -3, sh: [-80, -8], el: [-92, -10], hp: [-3, 4], kn: [3, 0]},
    kneel: {lean: 14, sh: [-52, -40], el: [-14, -20], hp: [-88, 22], kn: [92, 70]},
    kneelFloor: {lean: 50, sh: [-38, -30], el: [-4, -10], hp: [-88, 22], kn: [92, 70]},
    place: {lean: 12, sh: [-36, -40], el: [-40, -36], hp: [-3, 4], kn: [3, 0]},
    kneelLow: {lean: 26, sh: [-34, -24], el: [-14, -18], hp: [-88, 22], kn: [92, 70]},
    kneelUp: {lean: 4, sh: [-70, -60], el: [-60, -55], hp: [-88, 22], kn: [92, 70]},
    pull: {lean: -10, sh: [-24, -16], el: [-40, -36], hp: [-88, 22], kn: [92, 70]},
    armsUp: {lean: 0, sh: [-150, -160], el: [-18, -12], hp: [-3, 4], kn: [3, 0]},
    hug: {lean: 6, sh: [-14, -22], el: [-140, -134], hp: [-3, 4], kn: [3, 0]},
    warm: {lean: 8, sh: [-58, -66], el: [-24, -18], hp: [-3, 4], kn: [3, 0]},
    carry: {lean: 2, sh: [-30, -34], el: [-62, -60], hp: [-3, 4], kn: [3, 0]},
    sit: {lean: 4, sh: [-18, -24], el: [-58, -60], hp: [-84, -84], kn: [84, 96]},
    sitHug: {lean: 6, sh: [-34, -46], el: [-92, -88], hp: [-84, -84], kn: [84, 96]},
    // «Сосед» (лист персонажа): руки в кармане-кенгуру — только без свитера. pk — доля «в кармане» для [ближней, дальней]:
    // ближнюю руку обрезает область кармана, кисть прячется; дальняя уходит за корпус. На ходу руки в кармане не качаются.
    pocket: {lean: 0, sh: [-30, 26], el: [90, -84], hp: [-3, 4], kn: [3, 0], pk: [1, 1]},   // в ракурсе 3/4 локоть смотрит вбок: предплечье — назад, в карман (el > 0 только здесь)
    scratch: {lean: -2, sh: [-160, 26], el: [-96, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},    // чешет затылок: «на сколько?» (предплечье над головой, глаза открыты)
    scratch2: {lean: -2, sh: [-155, 26], el: [-84, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},   // вторая фаза почёсывания (чередовать со scratch через ~0.16 с)
    scratchMid: {lean: -1, sh: [-55, 26], el: [-122, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},  // промежуточная: локоть внизу, кисть у плеча — рука поднимается/опускается без «вытянутой руки вперёд»
    bend: {lean: 62, sh: [-8, 4], el: [-8, -14], hp: [-10, 4], kn: [12, 2]},                  // наклон стоя — вилку из розетки
    bendPull: {lean: 46, sh: [16, 8], el: [-46, -30], hp: [-10, 4], kn: [12, 2]},
    sitToast: {lean: 2, sh: [-58, -70], el: [-84, -80], hp: [-84, -84], kn: [84, 96]},       // сидя приподнять кружку
  };
  const LIM = {sh: [-170, 60], el: [-150, 0], hp: [-100, 40], kn: [0, 150]};
  for (const [n, p] of Object.entries(POSES)) for (const k of ['sh', 'el', 'hp', 'kn']) for (const v of p[k]) { const L = p.pk && k === 'el' ? [-150, 100] : LIM[k]; if (v < L[0] || v > L[1]) console.error('поза вне пределов суставов', n, k, v); }

  let N_PH = 0;
  G.PAPERHERO = function (E) {
    const {el, EASE, clamp} = E;
    const getPose = (p) => (typeof p === 'string' ? POSES[p] : p) || POSES.stand;
    const Z2 = [0, 0];
    const mix = (a, b, u) => { const r = {lean: lerp(a.lean || 0, b.lean || 0, u), tilt: lerp(a.tilt || 0, b.tilt || 0, u)}; for (const k of ['sh', 'el', 'hp', 'kn']) r[k] = [0, 1].map((i) => lerp(a[k][i], b[k][i], u));
      r.pk = [0, 1].map((i) => lerp((a.pk || Z2)[i], (b.pk || Z2)[i], u)); return r; };

    function person(parent, o = {}) {
      const H = o.h || 560, INK = '#141413', SKIN = o.skin || '#EFC9A8', TOP = o.top || '#D97757', TOP2 = o.top2 || '#B4553A', SWC = o.sweater || '#788C5D', JEANS = o.jeans || '#3E4A5E', SHOE = o.shoe || '#2A2420', HAIR = o.hair || '#2A2420';
      const seed = o.seed || 1, legW = H * 0.08, armW = H * 0.062, OFF = 'translate(2 2)';
      const SOSED = o.style === 'sosed', HOOD = o.style === 'hood' || o.style === 'hair' || SOSED, HOODON = o.style === 'hood', LW = HOOD ? 6 : 10, BW = HOOD ? 3.4 : 6, SW = HOOD ? 3 : 4.5, ANCH = o.anchor || [];
      const JEANS2 = o.jeans2 || JEANS, COLLAR = o.collar || TOP, SKIN2 = o.skin2 || SKIN, RIB = o.swRib || '#B3A388';
      const root = el('g', {}, parent), g = el('g', {filter: 'url(#inkRough)'}, root);
      const cid = 'phSw' + (++N_PH), cp = el('clipPath', {id: cid, clipPathUnits: 'userSpaceOnUse'}, E.defs), cr = el('rect', {x: -2000, width: 4000, y: -3000, height: 0}, cp);
      const inks = [], fills = [], limbs = [];
      const mk = (tag, a, par, kind) => { const n = el(tag, a, par); if (kind === 'ink' || kind === 'limb') { n.setAttribute('pathLength', 1); n.setAttribute('stroke-dasharray', '1 1'); (kind === 'ink' ? inks : limbs).push(n); } else if (kind === 'fill') fills.push(n); return n; };
      const tube = (w, color, sw, hand) => { const G2 = el('g', {}, g);
        const T = {g: G2, w, hand: hand ? mitt(G2) : null, ink: mk('path', {fill: 'none', stroke: INK, 'stroke-width': w + LW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, G2, 'limb'),
          fill: mk('path', {fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: OFF}, G2, 'limb')};
        if (HOOD && hand) T.cuff = mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'}, G2, 'fill');
        if (sw) T.sw = mk('path', {fill: 'none', stroke: SWC, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: OFF, 'clip-path': `url(#${cid})`}, G2, 'limb');
        // «Сосед»: у свитера — тёмная резинка-манжета у запястья (свитер не сливается со светлыми брюками и кистью)
        if (sw && SOSED) T.swCuff = mk('path', {fill: 'none', stroke: RIB, 'stroke-width': w, 'stroke-linecap': 'butt', transform: OFF, 'clip-path': `url(#${cid})`}, G2, 'fill');
        return T; };
      const shoe = () => mk('path', {fill: SHOE, stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}, g, 'fill');
      const sole = () => (SOSED ? mk('path', {fill: 'none', stroke: o.sole || '#D8CEBF', 'stroke-width': 2.2, 'stroke-linecap': 'round'}, g, 'fill') : null);
      function mitt(par) { return mk('ellipse', {fill: SKIN, stroke: INK, 'stroke-width': SW}, par, 'fill'); }
      // порядок: дальняя нога, дальняя рука, ближняя нога, тело, голова, ближняя рука
      const legB = tube(legW, JEANS2), shoeB = shoe(), soleB = sole();
      const armB = tube(armW, TOP2, true, true), handB = armB.hand;
      const legF = tube(legW, JEANS), shoeF = shoe(), soleF = sole();
      const bodyG = el('g', {}, g);
      const tcid = cid + 't', tcp = el('clipPath', {id: tcid, clipPathUnits: 'userSpaceOnUse'}, E.defs), tclip = el('path', {}, tcp);
      const body = mk('path', {fill: TOP, transform: OFF}, bodyG, 'fill'), back = mk('path', {fill: TOP2, transform: OFF, 'clip-path': `url(#${tcid})`}, bodyG, 'fill');
      // «Сосед»: худи темнеет к подолу (градиент поверх ткани) и тёмная резинка по подолу
      let shade = null, hem = null;
      if (SOSED) { const gid = cid + 'g', gr = el('linearGradient', {id: gid, x1: 0, y1: 0, x2: 0, y2: 1}, E.defs);
        [[0, 0], [0.4, 0.06], [1, 0.5]].forEach(([of, op]) => el('stop', {offset: of, 'stop-color': o.shade || '#8C3A22', 'stop-opacity': op}, gr));
        shade = mk('path', {fill: `url(#${gid})`, transform: OFF}, bodyG, 'fill'); hem = mk('path', {fill: TOP2, 'fill-opacity': 0.75, transform: OFF}, bodyG, 'fill'); }
      const seam = mk('path', {fill: 'none', stroke: INK, 'stroke-width': HOOD ? 2.5 : 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, bodyG, 'fill');
      const strings = HOODON ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round'}, bodyG, 'fill') : null;
      const swG = el('g', {'clip-path': `url(#${cid})`}, bodyG);
      const swBody = mk('path', {fill: SWC, transform: OFF}, swG, 'fill'), swSeam = mk('path', {fill: 'none', stroke: INK, 'stroke-width': HOOD ? 2.4 : 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: HOOD ? 0.7 : 1}, swG, 'fill');
      // «Сосед»: резинка по подолу свитера — тёмная полоса с рубчиком (граница свитера и брюк видна и на светлом)
      const swRib = SOSED ? mk('path', {fill: RIB, transform: OFF}, swG, 'fill') : null, swRibL = SOSED ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-opacity': 0.4, 'stroke-linecap': 'round'}, swG, 'fill') : null;
      const bodyInk = mk('path', {fill: 'none', stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, bodyG, 'ink');
      // «Сосед»: опущенный капюшон — толстый воротник; задняя часть — за шеей, передний край — перед ней (поверх свитера тоже)
      const colB = SOSED ? mk('path', {fill: COLLAR}, bodyG, 'fill') : null, colHole = SOSED ? mk('path', {fill: TOP2, stroke: INK, 'stroke-width': BW * 0.7}, bodyG, 'fill') : null;
      const colInk = SOSED ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, bodyG, 'ink') : null;
      const neckI = SOSED ? mk('path', {fill: 'none', stroke: INK, 'stroke-linecap': 'round'}, bodyG, 'fill') : null, neckS = SOSED ? mk('path', {fill: 'none', stroke: SKIN2, 'stroke-linecap': 'round'}, bodyG, 'fill') : null;
      const colF = SOSED ? mk('path', {fill: COLLAR, stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, bodyG, 'fill') : null;
      // плед на плечах (o.plaid — цвет; ключ plaid 0→1 — плед натягивается со спины на плечи): поверх корпуса, под головой и ближней рукой
      const capeG = o.plaid ? el('g', {}, g) : null, kcid = cid + 'c', kcp = o.plaid ? el('clipPath', {id: kcid, clipPathUnits: 'userSpaceOnUse'}, E.defs) : null, kcr = kcp ? el('rect', {}, kcp) : null;
      if (capeG) capeG.setAttribute('clip-path', `url(#${kcid})`);
      const cape = capeG ? mk('path', {fill: o.plaid, stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, capeG, 'fill') : null;
      const capeL = capeG ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-opacity': 0.55, 'stroke-linecap': 'round'}, capeG, 'fill') : null;
      const headG = el('g', {}, g);
      // капюшон: ткань, тёмная изнанка у лица, само лицо-овал, чёлка; контуры капюшона и лица — тушью
      const hood = HOODON ? mk('path', {fill: TOP, transform: OFF}, headG, 'fill') : null;
      const hoodIn = HOODON ? mk('ellipse', {fill: TOP2}, headG, 'fill') : null;
      const face = HOOD ? mk('ellipse', {fill: SKIN}, headG, 'fill') : mk('circle', {r: H * 0.11, fill: SKIN, transform: OFF}, headG, 'fill');
      // «Сосед»: контур лица — под ухом и волосами; ухо — со стороны затылка
      const faceO = SOSED ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, headG, 'ink') : null;
      const ear = SOSED ? mk('path', {fill: SKIN, stroke: INK, 'stroke-width': BW * 0.85, 'stroke-linejoin': 'round'}, headG, 'fill') : null;
      const earIn = SOSED ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-opacity': 0.55}, headG, 'fill') : null;
      const hair = mk('path', {fill: HAIR}, headG, 'fill');
      const hairHi = SOSED ? mk('path', {fill: 'none', stroke: o.hairHi || '#6F665D', 'stroke-width': 2.2, 'stroke-linecap': 'round'}, headG, 'fill') : null;
      const eyes = [0, 1].map(() => mk('circle', {r: H * (SOSED ? 0.0062 : HOOD ? 0.0078 : 0.0085), fill: INK}, headG, 'fill'));
      const brows = HOOD ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'}, headG, 'fill') : null;
      const blush = SOSED ? mk('ellipse', {fill: o.blush || '#D98E78', 'fill-opacity': 0.4}, headG, 'fill') : null;
      const mouth = mk('path', {fill: 'none', stroke: INK, 'stroke-width': HOOD ? 2.6 : 4, 'stroke-linecap': 'round'}, headG, 'fill');
      const headInk = mk('path', {fill: 'none', stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, headG, 'ink');
      const faceInk = HOOD ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.6}, headG, 'ink') : null;
      const armF = tube(armW, TOP, true, true), handF = armF.hand;
      // карман поверх ближней руки: рука «уходит» под край кармана (см. pk в POSES)
      const pkcid = cid + 'k', pkcp = el('clipPath', {id: pkcid, clipPathUnits: 'userSpaceOnUse'}, E.defs), pkclip = el('path', {'clip-rule': 'evenodd'}, pkcp);
      const pkTop = HOOD ? mk('path', {fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, g, 'fill') : null;
      // край пледа поверх ближнего плеча — рука выходит из-под пледа
      const flapG = o.plaid ? el('g', {'clip-path': `url(#${kcid})`}, g) : null, flap = flapG ? mk('path', {fill: o.plaid, stroke: INK, 'stroke-width': BW, 'stroke-linejoin': 'round'}, flapG, 'fill') : null;
      const breath = el('path', {fill: 'none', stroke: INK, 'stroke-width': HOOD ? 2.6 : 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': '3 10', opacity: 0}, root);
      let K = [[0, {x: 0, y: 0, pose: 'stand', look: 1, vis: 1}]];
      const P = {g: root, H, POSES, armB, armF};
      const BL = o.blink ? (() => { const hb = (i) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); }, r = [];
        for (let i = 1, tb = 1.1 + hb(0) * 1.2; tb < 900; i++) { r.push(tb); tb += 2.6 + 1.9 * hb(i); } return r; })() : null;
      P.keys = (list) => { K = list.slice().sort((a, b) => a[0] - b[0]); return P; };

      function state(t) {
        let a = K[0], b = K[0];
        for (let i = 0; i < K.length; i++) { if (K[i][0] <= t) a = K[i]; if (K[i][0] > t) { b = K[i]; break; } b = K[i]; }
        const span = b[0] - a[0], u = a === b ? 1 : EASE.io2(clamp((t - a[0]) / span));
        const pa = getPose(a[1].pose), pb = getPose(b[1].pose ?? a[1].pose);
        const num = (k, d) => lerp(a[1][k] ?? d, b[1][k] ?? a[1][k] ?? d, u);
        const walking = Math.abs((b[1].x ?? 0) - (a[1].x ?? 0)) > 1 && span > 0.05 && u > 0 && u < 1;
        return {t, x: num('x', 0), y: num('y', 0), pose: mix(pa, pb, u), look: num('look', 1), vis: num('vis', 1), fade: num('fade', 1), mouth: num('mouth', 0), breath: num('breath', 0), sweater: num('sweater', 0),
          nod: num('nod', 0), plaid: num('plaid', 0), walking};
      }
      // скелет в координатах родителя. x ключа — бёдра в позе stand; при смене позы на месте передняя стопа не скользит,
      // при повороте бёдра не прыгают; нижняя точка (подошва или колено) — на y ключа
      function build(p, f, lean, walk, wc) {
        const seg = (q, ang, len) => [q[0] + Math.sin(ang) * len, q[1] + Math.cos(ang) * len];
        const limb = (base, a1, a2, l1, l2) => { const j = seg(base, a1, l1), e = seg(j, a1 + a2, l2); return {pts: [base, j, e], dir: a1 + a2}; };
        const u = [Math.sin(lean), -Math.cos(lean)], n = [Math.cos(lean), Math.sin(lean)];
        const hip = [0, 0], neck = [u[0] * H * 0.3, u[1] * H * 0.3];
        const legs = [0, 1].map((i) => { const s = i ? -1 : 1, sw = walk ? s * wc * 28 : 0, kb = walk ? Math.max(0, s * wc) * 30 : 0;
          return limb([s * H * 0.03 * f, 0], rad((p.hp[i] + sw) * -f), rad((p.kn[i] + kb) * -f), H * 0.24, H * 0.23); });
        const arms = [0, 1].map((i) => { const s = i ? -1 : 1, base = [neck[0] + n[0] * s * H * 0.075 * f - u[0] * H * 0.035, neck[1] + n[1] * s * H * 0.075 * f - u[1] * H * 0.035];
          return limb(base, rad((p.sh[i] + (walk ? -s * wc * 18 * (1 - (p.pk ? p.pk[i] : 0)) : 0)) * -f), rad(p.el[i] * -f), H * 0.17, H * 0.16); });
        return {hip, neck, legs, arms, u, n};
      }
      const SF = {}; // передняя стопа в stand — опорная точка для x
      const standFF = (f) => SF[f] ?? (SF[f] = build(POSES.stand, f, 0, false, 0).legs[0].pts[2][0]);
      function solveS(S, t) {
        const p = S.pose, f = S.look >= 0 ? 1 : -1;
        const ph = S.x / (H * 0.14), wc = S.walking ? Math.sin(ph) : 0;
        const sway = Math.sin(t * 1.7 + seed) * 0.6, lean = rad(p.lean + sway) * f;
        const J = build(p, f, lean, S.walking, wc), J0 = S.walking ? build(p, f, lean, false, 0) : J;
        // опора: нижняя точка ботинка (он повёрнут вместе с голенью) или колено (сустав + толщина штанины)
        const lowY = (L) => Math.max(...L.legs.map((l) => Math.max(...shoePts(l, f).slice(0, 3).map((q) => q[1]), l.pts[1][1] + legW / 2 + 5)));
        const dx = S.x - (J0.legs[0].pts[2][0] - standFF(f)), dy = S.y - lowY(J);
        const mv = (q) => [q[0] + dx, q[1] + dy];
        // «Сосед»: голова меньше (R лица 0.055h) и сидит над воротником — макушка почти там же, где была
        const R = SOSED ? H * 0.055 : H * 0.11, hc = SOSED ? [J.neck[0] + J.u[0] * H * 0.1, J.neck[1] - H * 0.09] : [J.neck[0] + J.u[0] * R * 1.15, J.neck[1] - R * 1.05];
        return {S, f, lean, u: J.u, n: J.n, dx, dy, hip: mv(J.hip), neck: mv(J.neck), legs: J.legs.map((l) => ({pts: l.pts.map(mv), dir: l.dir})), arms: J.arms.map((a) => ({pts: a.pts.map(mv), dir: a.dir})), head: mv(hc), R};
      }
      const solve = (t) => solveS(state(t), t);
      // где окажутся кисти/голова/бёдра в позе относительно (x, y) ключа — чтобы ставить предметы под руку
      P.probe = (pose, f = 1) => { const s = solveS({t: 0, x: 0, y: 0, pose: getPose(pose), look: f, walking: false}, -seed / 1.7);
        const hd = (a) => [a.pts[2][0] + Math.sin(a.dir) * H * 0.035, a.pts[2][1] + Math.cos(a.dir) * H * 0.035];
        return {hand0: hd(s.arms[0]), hand1: hd(s.arms[1]), head: s.head, hip: s.hip, knee: s.legs.map((l) => l.pts[1]), foot: s.legs.map((l) => l.pts[2])}; };
      // ботинок в системе голени: X — к носку (голень, повёрнутая на 90° по взгляду), Y — вдоль голени
      function shoePts(l, f) {
        const a = l.pts[2], Y = [Math.sin(l.dir), Math.cos(l.dir)], X = [Y[1] * f, -Y[0] * f], L = H * 0.06, s0 = H * 0.034, hg = H * 0.042;
        const w = (lx, ly) => [a[0] + X[0] * lx + Y[0] * ly, a[1] + X[1] * lx + Y[1] * ly];
        return [w(-L * 0.42, s0), w(L * 1.08 - H * 0.012, s0), w(L * 1.08, s0 - hg * 0.45), w(L * 1.08 + H * 0.008, s0), w(L * 1.08 - H * 0.006, s0 - hg * 0.85), w(L * 0.25, s0 - hg), w(-L * 0.42, s0 - hg)];
      }
      P.solve = solve;
      P.hand = (i = 0, ox = 0, oy = 0) => (t) => { const s = solve(t), a = s.arms[i]; return [a.pts[2][0] + Math.sin(a.dir) * H * 0.035 + ox, a.pts[2][1] + Math.cos(a.dir) * H * 0.035 + oy]; };
      P.headAt = (t) => solve(t).head;
      P.at = (ox = 0, oy = 0) => (t) => { const s = solve(t); return [s.hip[0] + ox, s.hip[1] + oy]; };
      P.vis = (t) => { const S = state(t); return S.vis * S.fade; };

      const F2 = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1), poly = (pts) => 'M' + pts.map(F2).join('L');
      // гладкий контур через точки (Catmull-Rom → кубические Безье); corners — индексы острых углов
      const spl = (pts, closed, corners) => { const m = pts.length, P = (i) => (closed ? pts[(i + m) % m] : pts[Math.max(0, Math.min(m - 1, i))]), C = (i) => !!corners && corners.has((i + m) % m);
        let d = 'M' + F2(pts[0]);
        for (let i = 0; i < (closed ? m : m - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
          const c1 = C(i) ? p1 : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = C(i + 1) ? p2 : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
          d += 'C' + F2(c1) + ' ' + F2(c2) + ' ' + F2(p2); }
        return d + (closed ? 'Z' : ''); };
      P.draw = (t) => {
        const s = solve(t), S = s.S, f = s.f;
        // наклон головы (ключ nod, градусы: + вверх, − вниз) — поворот головы вокруг низа лица; шея и пар идут следом
        const nodA = -Math.max(-40, Math.min(40, S.nod || 0)) * f, nodC = [s.head[0] - f * s.R * 0.1, s.head[1] + s.R * 0.95], nc = Math.cos(rad(nodA)), ns = Math.sin(rad(nodA));
        const nodP = (p) => (nodA ? [nodC[0] + nc * (p[0] - nodC[0]) - ns * (p[1] - nodC[1]), nodC[1] + ns * (p[0] - nodC[0]) + nc * (p[1] - nodC[1])] : p);
        const q = clamp(S.vis), op = S.fade * (q > 0 ? 1 : 0);
        if (op <= 0.001) { root.style.display = 'none'; return; }
        root.style.display = ''; root.style.opacity = S.fade;
        // порядок кисти: контур тела и головы → руки и ноги «красятся» цветом от плеч и бёдер → заливки.
        // Тушь трубки отдельно от цвета не рисуем: без заливки толстый штрих — чёрный силуэт, а круглый кап пустого штриха — клякса.
        const kb = EASE.io2(clamp(q / 0.45)), kl = EASE.io2(clamp((q - 0.15) / 0.55)), fk = clamp((q - 0.45) / 0.55);
        inks.forEach((n) => { n.style.strokeDashoffset = (1 - kb).toFixed(3); n.style.opacity = clamp(kb / 0.2).toFixed(3); });
        limbs.forEach((n) => { n.style.strokeDashoffset = (1 - kl).toFixed(3); n.style.opacity = clamp(kl / 0.35).toFixed(3); });
        fills.forEach((n) => (n.style.opacity = fk.toFixed(3)));
        // ноги: штанина кончается у щиколотки, её прикрывает ботинок
        const legPts = (l) => { const [h, k, a] = l.pts, d = Math.hypot(a[0] - k[0], a[1] - k[1]) || 1, c = H * 0.035 / d; return [h, k, [a[0] - (a[0] - k[0]) * c, a[1] - (a[1] - k[1]) * c]]; };
        const setTube = (T, pts) => { const d = poly(pts); T.ink.setAttribute('d', d); T.fill.setAttribute('d', d); if (T.sw) T.sw.setAttribute('d', d); };
        setTube(legB, legPts(s.legs[1])); setTube(legF, legPts(s.legs[0]));
        const shoeD = (l) => { const [A, B2, C, Qa, Qb, D, E2] = shoePts(l, f);
          if (SOSED) { const a = l.pts[2], Y = [Math.sin(l.dir), Math.cos(l.dir)], X = [Y[1] * f, -Y[0] * f], w = (lx, ly) => F2([a[0] + X[0] * lx + Y[0] * ly, a[1] + X[1] * lx + Y[1] * ly]), L0 = -H * 0.0275, s0 = H * 0.034, hg = H * 0.042;   // «Сосед»: округлая пятка, верх куполом
            return `M${F2(A)}L${F2(B2)}Q${F2(Qa)} ${F2(C)}Q${F2(Qb)} ${F2(D)}C${w(-H * 0.006, s0 - hg * 1.03)} ${w(L0, s0 - hg * 0.92)} ${w(L0, s0 - hg * 0.45)}Q${w(L0, s0)} ${F2(A)}Z`; }
          return `M${F2(A)}L${F2(B2)}Q${F2(Qa)} ${F2(C)}Q${F2(Qb)} ${F2(D)}L${F2(E2)}Z`; };
        shoeB.setAttribute('d', shoeD(s.legs[1])); shoeF.setAttribute('d', shoeD(s.legs[0]));
        // «Сосед»: светлая полоска подошвы у самого низа ботинка
        if (SOSED) [[soleB, s.legs[1]], [soleF, s.legs[0]]].forEach(([n, l]) => { const a = l.pts[2], Y = [Math.sin(l.dir), Math.cos(l.dir)], X = [Y[1] * f, -Y[0] * f], ly = H * 0.025;
          const w = (lx) => [a[0] + X[0] * lx + Y[0] * ly, a[1] + X[1] * lx + Y[1] * ly]; n.setAttribute('d', `M${F2(w(-H * 0.022))}L${F2(w(H * 0.047))}`); });
        const armPts = (a) => { const [b, e, w] = a.pts; return [b, e, [w[0] - Math.sin(a.dir) * H * 0.02, w[1] - Math.cos(a.dir) * H * 0.02]]; };
        setTube(armB, armPts(s.arms[1])); setTube(armF, armPts(s.arms[0]));
        // резинка-манжета свитера у запястья: короткий отрезок на самом конце рукава
        if (SOSED) [[armB, s.arms[1]], [armF, s.arms[0]]].forEach(([T, a]) => { if (!T.swCuff) return; const we = armPts(a)[2], d = [Math.sin(a.dir), Math.cos(a.dir)];
          T.swCuff.setAttribute('d', `M${F2([we[0] - d[0] * H * 0.012, we[1] - d[1] * H * 0.012])}L${F2(we)}`); T.swCuff.setAttribute('stroke-width', (armW * 0.92).toFixed(1)); T.swCuff.setAttribute('stroke-linecap', 'round'); });
        // текстура ткани едет с бёдрами
        for (const pt0 of ANCH) pt0.setAttribute('patternTransform', `translate(${s.hip[0].toFixed(1)} ${s.hip[1].toFixed(1)})`);
        // манжета: поперёк рукава у запястья
        if (HOOD) [[armB, s.arms[1]], [armF, s.arms[0]]].forEach(([T, a]) => { const w = a.pts[2], d = [Math.sin(a.dir), Math.cos(a.dir)], c = [w[0] - d[0] * H * 0.045, w[1] - d[1] * H * 0.045], hw = armW * 0.5 + 1;
          T.cuff.setAttribute('d', `M${F2([c[0] - d[1] * hw, c[1] + d[0] * hw])}L${F2([c[0] + d[1] * hw, c[1] - d[0] * hw])}`); });
        [[handB, s.arms[1]], [handF, s.arms[0]]].forEach(([h, a]) => { const w = a.pts[2], c = [w[0] + Math.sin(a.dir) * H * 0.035, w[1] + Math.cos(a.dir) * H * 0.035];
          h.setAttribute('cx', c[0].toFixed(1)); h.setAttribute('cy', c[1].toFixed(1)); h.setAttribute('rx', (H * 0.046).toFixed(1)); h.setAttribute('ry', (H * 0.034).toFixed(1));
          h.setAttribute('transform', `rotate(${(90 - (a.dir * 180) / Math.PI).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})`); });
        // тело — худи: покатые плечи, подол чуть шире, тёмная спинка, карман и ворот
        const hip = s.hip, neck = s.neck, u = s.u, n = s.n, len = Math.hypot(neck[0] - hip[0], neck[1] - hip[1]);
        const pt = (b, kn, ku) => [b[0] + n[0] * kn + u[0] * ku, b[1] + n[1] * kn + u[1] * ku];
        const ws = H * 0.12, wh = H * 0.135;
        const SL = pt(neck, ws, -H * 0.04), SR = pt(neck, -ws, -H * 0.04), HL = pt(hip, wh, -H * 0.05), HR = pt(hip, -wh, -H * 0.05);
        const torso = `M${F2(pt(neck, H * 0.05, 0))}C${F2(pt(neck, ws * 0.75, H * 0.005))} ${F2(pt(SL, 0, H * 0.035))} ${F2(SL)}L${F2(HL)}Q${F2(pt(hip, 0, -H * 0.085))} ${F2(HR)}L${F2(SR)}C${F2(pt(SR, 0, H * 0.035))} ${F2(pt(neck, -ws * 0.75, H * 0.005))} ${F2(pt(neck, -H * 0.05, 0))}Z`;
        body.setAttribute('d', torso); swBody.setAttribute('d', torso); bodyInk.setAttribute('d', torso); tclip.setAttribute('d', torso);
        if (SOSED) { shade.setAttribute('d', torso);
          hem.setAttribute('d', `M${F2(pt(hip, wh * 0.98, -H * 0.016))}Q${F2(pt(hip, 0, -H * 0.05))} ${F2(pt(hip, -wh * 0.98, -H * 0.016))}L${F2(HR)}Q${F2(pt(hip, 0, -H * 0.085))} ${F2(HL)}Z`);
          // резинка свитера: полоса по подолу и рубчик поперёк неё
          swRib.setAttribute('d', `M${F2(pt(hip, wh * 0.99, -H * 0.012))}Q${F2(pt(hip, 0, -H * 0.046))} ${F2(pt(hip, -wh * 0.99, -H * 0.012))}L${F2(HR)}Q${F2(pt(hip, 0, -H * 0.085))} ${F2(HL)}Z`);
          let rl = ''; for (let j = -7; j <= 7; j++) { const k = j / 7.6, c = 1 - k * k; rl += `M${F2(pt(hip, wh * k, -H * (0.016 + 0.017 * c)))}L${F2(pt(hip, wh * k, -H * (0.046 + 0.0175 * c)))}`; }
          swRibL.setAttribute('d', rl); }
        const b = -f, BS = pt(neck, b * ws, -H * 0.04), BH = pt(hip, b * wh, -H * 0.05);
        back.setAttribute('d', `M${F2(pt(neck, b * ws * 0.55, -H * 0.012))}C${F2(pt(neck, b * ws * 0.85, -H * 0.005))} ${F2(pt(BS, 0, H * 0.03))} ${F2(BS)}L${F2(BH)}Q${F2(pt(hip, b * wh * 0.8, -H * 0.07))} ${F2(pt(hip, b * wh * 0.55, -H * 0.075))}L${F2(pt(neck, b * ws * 0.45, -H * 0.06))}Z`);
        if (!HOOD) seam.setAttribute('d', `M${F2(pt(neck, H * 0.07, -H * 0.005))}Q${F2(pt(neck, 0, -H * 0.06))} ${F2(pt(neck, -H * 0.07, -H * 0.005))}` +
          `M${F2(pt(hip, f * H * 0.085, H * 0.1))}L${F2(pt(hip, f * -H * 0.02, H * 0.1))}L${F2(pt(hip, f * -H * 0.03, H * 0.0))}L${F2(pt(hip, f * H * 0.095, H * 0.0))}Z`);
        else {
          // карман-кенгуру (верх и два скруглённых входа), резинка по подолу, завязки капюшона
          const pk = (kn, ku) => F2(pt(hip, f * H * kn, H * ku));
          seam.setAttribute('d', `M${pk(-0.02, 0.105)}L${pk(0.066, 0.105)}Q${pk(0.07, 0.045)} ${pk(0.104, 0.012)}M${pk(-0.02, 0.105)}Q${pk(-0.03, 0.05)} ${pk(-0.056, 0.012)}` +
            `M${F2(pt(hip, wh * 0.98, -H * 0.016))}Q${F2(pt(hip, 0, -H * 0.05))} ${F2(pt(hip, -wh * 0.98, -H * 0.016))}` +
            (HOODON || SOSED ? '' : `M${F2(pt(neck, H * 0.06, -H * 0.004))}Q${F2(pt(neck, 0, -H * 0.05))} ${F2(pt(neck, -H * 0.06, -H * 0.004))}`));   // без капюшона — круглый ворот («Сосед» — свой воротник)
          if (HOODON) {
            const [hx0, hy0] = s.head, Rh = s.R, sa = [hx0 + f * Rh * 0.3, hy0 + Rh * 1.02], sb = [hx0 + f * Rh * 0.62, hy0 + Rh * 0.98], dl = H * 0.078;
            const end = (q, k) => [q[0] - u[0] * dl * k, q[1] - u[1] * dl * k];
            strings.setAttribute('d', `M${F2(sa)}L${F2(end(sa, 1))}M${F2(sb)}L${F2(end(sb, 0.9))}M${F2(end(sa, 1))}L${F2(end(sa, 1.12))}M${F2(end(sb, 0.9))}L${F2(end(sb, 1.02))}`);
          }
        }
        let kn = `M${F2(pt(neck, H * 0.06, -H * 0.022))}L${F2(pt(neck, -H * 0.06, -H * 0.022))}`;
        for (const v of [0.3, 0.48, 0.66]) { kn += 'M'; for (let j = 0; j <= 8; j++) kn += (j ? 'L' : '') + F2(pt(hip, H * (0.11 - j * 0.0275), len * v + (j % 2 ? H * 0.012 : 0))); }
        swSeam.setAttribute('d', kn + `M${F2(pt(hip, H * 0.12, -H * 0.025))}L${F2(pt(hip, -H * 0.12, -H * 0.025))}`);
        // свитер надевается сверху вниз: открываем полосу от макушки до подола
        const top = s.head[1] - s.R * 1.2 - H * 0.35, bot = hip[1] + H * 0.12, sv = clamp(S.sweater);
        cr.setAttribute('x', (hip[0] - 1000).toFixed(1)); cr.setAttribute('width', 2000); cr.setAttribute('y', top.toFixed(1)); cr.setAttribute('height', (sv <= 0 ? 0 : (bot - top) * sv).toFixed(1));
        // «Сосед»: воротник (опущенный капюшон) и шея — эллипсы по оси корпуса, наклоняются вместе с ним
        if (SOSED) {
          const ellP = (c, rx, ry, a0, a1, k) => Array.from({length: k + 1}, (_, i) => { const a = a0 + ((a1 - a0) * i) / k; return pt(c, Math.cos(a) * rx, Math.sin(a) * ry); });
          const Co = pt(neck, -f * H * 0.004, H * 0.006), Ci = pt(neck, f * H * 0.008, H * 0.012), orx = H * 0.07, ory = H * 0.03, irx = H * 0.03, iry = H * 0.012;
          const ring = spl(ellP(Co, orx, ory, 0, 2 * Math.PI, 24).slice(0, -1), true);
          colB.setAttribute('d', ring); colInk.setAttribute('d', ring);
          colHole.setAttribute('d', spl(ellP(Ci, irx, iry, 0, 2 * Math.PI, 16).slice(0, -1), true));
          colF.setAttribute('d', spl([...ellP(Co, orx, ory, Math.PI, 2 * Math.PI, 12), ...ellP(Ci, irx, iry * 1.15, 2 * Math.PI, Math.PI, 10)], true));
          const nk = `M${F2(Ci)}L${F2(nodP([s.head[0] - f * s.R * 0.12, s.head[1] + s.R * 0.5]))}`, nw = s.R * 0.78;
          neckI.setAttribute('d', nk); neckI.setAttribute('stroke-width', (nw + LW * 0.75).toFixed(1)); neckS.setAttribute('d', nk); neckS.setAttribute('stroke-width', nw.toFixed(1));
        }
        // голова: лицо, тёмная шапка волос, глаза-точки, рот
        const [hx, hy] = s.head, R = s.R;
        if (HOODON) {
          const L = (x, y) => F2([hx + x * R * f, hy + y * R]);
          const hd = `M${L(0.70, 0.95)}C${L(1.06, 0.55)} ${L(1.1, -0.35)} ${L(0.74, -0.8)}C${L(0.4, -1.12)} ${L(-0.4, -1.14)} ${L(-0.74, -0.84)}C${L(-1.08, -0.52)} ${L(-1.12, 0.36)} ${L(-0.84, 0.94)}Q${L(0, 1.14)} ${L(0.70, 0.95)}Z`;
          hood.setAttribute('d', hd); headInk.setAttribute('d', hd);
          const fcx = hx + 0.26 * R * f, fcy = hy + 0.04 * R, frx = 0.6 * R, fry = 0.74 * R;
          for (const [n, k] of [[hoodIn, 0.09], [face, 0]]) { n.setAttribute('cx', fcx.toFixed(1)); n.setAttribute('cy', fcy.toFixed(1)); n.setAttribute('rx', (frx + k * R).toFixed(1)); n.setAttribute('ry', (fry + k * R * 0.9).toFixed(1)); }
          faceInk.setAttribute('d', `M${(fcx + frx).toFixed(1)} ${fcy.toFixed(1)}a${frx.toFixed(1)} ${fry.toFixed(1)} 0 1 0 ${(-2 * frx).toFixed(1)} 0a${frx.toFixed(1)} ${fry.toFixed(1)} 0 1 0 ${(2 * frx).toFixed(1)} 0`);
          // чёлка: верх овала лица и зубчатый нижний край (зубцы не ниже бровей)
          const E2 = (deg, dy = 0) => { const a = (deg * Math.PI) / 180; return [fcx + Math.cos(a) * frx * f, Math.min(fcy + Math.sin(a) * fry + dy, hy - 0.3 * R)]; };
          let hp = 'M' + F2(E2(192)); for (let a = 200; a <= 344; a += 12) hp += 'L' + F2(E2(a));
          for (let k = 0; k <= 7; k++) { const a = 344 - k * 20.5; hp += 'L' + F2(E2(a, (k % 2 ? 0.2 : 0.42) * fry)); }
          hair.setAttribute('d', hp + 'Z');
          eyes[0].setAttribute('cx', (hx + f * R * 0.5).toFixed(1)); eyes[0].setAttribute('cy', (hy + R * 0.06).toFixed(1));
          eyes[1].setAttribute('cx', (hx + f * R * 0.1).toFixed(1)); eyes[1].setAttribute('cy', (hy + R * 0.08).toFixed(1));
          brows.setAttribute('d', `M${L(0.02, -0.15)}L${L(0.18, -0.18)}M${L(0.41, -0.19)}L${L(0.58, -0.155)}`);
          const m = clamp(S.mouth), mx0 = hx + f * R * 0.17, mx1 = hx + f * R * 0.43, my = hy + R * 0.45;
          mouth.setAttribute('d', `M${mx0.toFixed(1)} ${(my - m * R * 0.05).toFixed(1)}Q${((mx0 + mx1) / 2).toFixed(1)} ${(my + R * (0.03 + m * 0.16)).toFixed(1)} ${mx1.toFixed(1)} ${(my - m * R * 0.08).toFixed(1)}`);
        } else if (SOSED) {
          // «Сосед»: маленькое лицо-овал, ухо со стороны затылка, волосы шапкой с чёлкой и хохолком, глаза-точки, румянец, улыбка
          const L = (x, y) => [hx + x * R * f, hy + y * R], frx = R * 0.95, fry = R * 1.05, M = (list) => list.map(([x, y]) => L(x, y));
          face.setAttribute('cx', hx.toFixed(1)); face.setAttribute('cy', hy.toFixed(1)); face.setAttribute('rx', frx.toFixed(1)); face.setAttribute('ry', fry.toFixed(1));
          faceO.setAttribute('d', `M${(hx + frx).toFixed(1)} ${hy.toFixed(1)}a${frx.toFixed(1)} ${fry.toFixed(1)} 0 1 0 ${(-2 * frx).toFixed(1)} 0a${frx.toFixed(1)} ${fry.toFixed(1)} 0 1 0 ${(2 * frx).toFixed(1)} 0`);
          ear.setAttribute('d', spl(M(S_EAR), true)); earIn.setAttribute('d', spl(M(S_EAR_IN), false));
          const hd = spl(M(S_HAIR), true, S_HAIR_C);
          hair.setAttribute('d', hd); headInk.setAttribute('d', hd); faceInk.setAttribute('d', '');
          hairHi.setAttribute('d', S_HAIR_HI.map((c) => spl(M(c), false)).join(''));
          const e0 = L(0.58, 0.02), e1 = L(0.08, 0.04);
          eyes[0].setAttribute('cx', e0[0].toFixed(1)); eyes[0].setAttribute('cy', e0[1].toFixed(1)); eyes[1].setAttribute('cx', e1[0].toFixed(1)); eyes[1].setAttribute('cy', e1[1].toFixed(1));
          brows.setAttribute('d', `M${F2(L(-0.06, -0.33))}L${F2(L(0.16, -0.37))}M${F2(L(0.44, -0.39))}L${F2(L(0.68, -0.34))}`);
          const bc = L(-0.4, 0.4); blush.setAttribute('cx', bc[0].toFixed(1)); blush.setAttribute('cy', bc[1].toFixed(1)); blush.setAttribute('rx', (R * 0.25).toFixed(1)); blush.setAttribute('ry', (R * 0.15).toFixed(1));
          const m = clamp(S.mouth), mx0 = hx + f * R * 0.16, mx1 = hx + f * R * 0.5, my = hy + R * 0.6;
          mouth.setAttribute('d', `M${mx0.toFixed(1)} ${(my - m * R * 0.05).toFixed(1)}Q${((mx0 + mx1) / 2).toFixed(1)} ${(my + R * (0.05 + m * 0.18)).toFixed(1)} ${mx1.toFixed(1)} ${(my - m * R * 0.08).toFixed(1)}`);
        } else if (HOOD) {
          // открытая голова: круг лица и короткие тёмные волосы шапочкой
          const L = (x, y) => F2([hx + x * R * f, hy + y * R]), sw = f > 0 ? 0 : 1;
          face.setAttribute('cx', hx.toFixed(1)); face.setAttribute('cy', hy.toFixed(1)); face.setAttribute('rx', R.toFixed(1)); face.setAttribute('ry', (R * 1.03).toFixed(1));
          headInk.setAttribute('d', `M${(hx + R).toFixed(1)} ${hy.toFixed(1)}a${R.toFixed(1)} ${(R * 1.03).toFixed(1)} 0 1 0 ${(-2 * R).toFixed(1)} 0a${R.toFixed(1)} ${(R * 1.03).toFixed(1)} 0 1 0 ${(2 * R).toFixed(1)} 0`);
          // волосы шапочкой: дуга по окружности головы ото лба через темя к затылку и мягкий край чёлки; без уха, без прядей
          const R1 = R.toFixed(1);
          hair.setAttribute('d', `M${L(0.75, -0.66)}A${R1} ${R1} 0 0 ${sw} ${L(-0.96, 0.3)}Q${L(-0.62, 0.12)} ${L(-0.42, -0.28)}Q${L(0.12, -0.46)} ${L(0.75, -0.66)}Z`);
          faceInk.setAttribute('d', '');
          eyes[0].setAttribute('cx', (hx + f * R * 0.5).toFixed(1)); eyes[0].setAttribute('cy', (hy + R * 0.06).toFixed(1));
          eyes[1].setAttribute('cx', (hx + f * R * 0.12).toFixed(1)); eyes[1].setAttribute('cy', (hy + R * 0.08).toFixed(1));
          brows.setAttribute('d', `M${L(0.04, -0.15)}L${L(0.2, -0.18)}M${L(0.41, -0.19)}L${L(0.58, -0.155)}`);
          const m = clamp(S.mouth), mx0 = hx + f * R * 0.2, mx1 = hx + f * R * 0.46, my = hy + R * 0.45;
          mouth.setAttribute('d', `M${mx0.toFixed(1)} ${(my - m * R * 0.05).toFixed(1)}Q${((mx0 + mx1) / 2).toFixed(1)} ${(my + R * (0.03 + m * 0.16)).toFixed(1)} ${mx1.toFixed(1)} ${(my - m * R * 0.08).toFixed(1)}`);
        } else {
        face.setAttribute('cx', hx.toFixed(1)); face.setAttribute('cy', hy.toFixed(1));
        headInk.setAttribute('d', `M${(hx + R).toFixed(1)} ${hy.toFixed(1)}a${R.toFixed(1)} ${R.toFixed(1)} 0 1 0 ${(-2 * R).toFixed(1)} 0a${R.toFixed(1)} ${R.toFixed(1)} 0 1 0 ${(2 * R).toFixed(1)} 0`);
        const hp = (ax, ay) => F2([hx + ax * R * f, hy + ay * R]);
        hair.setAttribute('d', `M${hp(0.62, -0.79)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 ${f > 0 ? 0 : 1} ${hp(-0.96, 0.3)}Q${hp(-0.62, 0.12)} ${hp(-0.42, -0.3)}Q${hp(0.1, -0.5)} ${hp(0.62, -0.79)}Z`);
        eyes[0].setAttribute('cx', (hx + f * R * 0.62).toFixed(1)); eyes[0].setAttribute('cy', (hy - R * 0.02).toFixed(1));
        eyes[1].setAttribute('cx', (hx + f * R * 0.22).toFixed(1)); eyes[1].setAttribute('cy', (hy - R * 0.04).toFixed(1));
        const m = clamp(S.mouth), mx0 = hx + f * R * 0.22, mx1 = hx + f * R * 0.66, my = hy + R * 0.42;
        mouth.setAttribute('d', `M${mx0.toFixed(1)} ${(my - m * R * 0.06).toFixed(1)}Q${((mx0 + mx1) / 2).toFixed(1)} ${(my + R * (0.04 + m * 0.2)).toFixed(1)} ${mx1.toFixed(1)} ${(my - m * R * 0.1).toFixed(1)}`);
        }
        // моргание: ~0.16 с, глаз сплющивается в чёрточку
        if (nodA) headG.setAttribute('transform', `rotate(${nodA.toFixed(2)} ${F2(nodC)})`); else headG.removeAttribute('transform');
        // руки в кармане: ближняя рука обрезается областью кармана, кисть гаснет, край кармана — поверх руки
        const pkN = S.pose.pk ? S.pose.pk[0] : 0;
        if (HOOD && pkN > 0.001) {
          const pk = (kn, ku) => F2(pt(hip, f * H * kn, H * ku)), [px, py] = hip;
          pkclip.setAttribute('d', `M${(px - 3000).toFixed(0)} ${(py - 3000).toFixed(0)}h6000v6000h-6000Z` + `M${pk(-0.02, 0.105)}L${pk(0.066, 0.105)}Q${pk(0.07, 0.045)} ${pk(0.104, 0.012)}L${pk(0.11, -0.016)}L${pk(-0.062, -0.016)}L${pk(-0.056, 0.012)}Q${pk(-0.03, 0.05)} ${pk(-0.02, 0.105)}Z`);   // карман до подола: конец рукава не торчит снизу
          armF.g.setAttribute('clip-path', `url(#${pkcid})`);
          pkTop.setAttribute('d', `M${pk(-0.02, 0.105)}L${pk(0.066, 0.105)}Q${pk(0.07, 0.045)} ${pk(0.104, 0.012)}`);
          pkTop.style.opacity = (fk * clamp(pkN * 3)).toFixed(3); handF.style.opacity = (fk * (1 - pkN)).toFixed(3);
        } else { armF.g.removeAttribute('clip-path'); if (pkTop) pkTop.style.opacity = 0; }
        // плед на плечах: со спины через плечи, спереди открыт; появляется сверху вниз — «накинул на плечи»
        if (capeG) { const pl = clamp(S.plaid);
          capeG.style.display = flapG.style.display = pl > 0.001 ? '' : 'none';
          if (pl > 0.001) {
            const pc = (b0, kn, ku) => pt(b0, f * H * kn, H * ku);
            const pts = [pc(neck, 0.035, 0.012), pc(neck, 0.1, -0.012), pc(neck, 0.15, -0.07), pc(neck, 0.135, -0.18), pc(hip, 0.06, 0.07), pc(hip, 0.045, -0.035), pc(hip, -0.1, -0.06), pc(hip, -0.22, -0.045), pc(neck, -0.19, -0.15), pc(neck, -0.12, -0.03), pc(neck, -0.04, 0.03)];
            cape.setAttribute('d', spl(pts, true, new Set([5, 7])));
            capeL.setAttribute('d', `M${F2(pc(neck, -0.06, -0.06))}Q${F2(pc(hip, -0.12, 0.12))} ${F2(pc(hip, -0.1, -0.04))}M${F2(pc(neck, 0.06, -0.08))}Q${F2(pc(hip, 0.0, 0.16))} ${F2(pc(hip, 0.01, 0.0))}`);
            flap.setAttribute('d', spl([pc(neck, 0.05, 0.004), pc(neck, 0.115, -0.018), pc(neck, 0.158, -0.075), pc(neck, 0.15, -0.12), pc(neck, 0.1, -0.09), pc(neck, 0.06, -0.045)], true));
            // накинул на плечи: плед ложится на плечи и сползает по спине вниз (клип сверху вниз) и проявляется
            const xb = hip[0] - f * H * 0.3, xf = neck[0] + f * H * 0.25, x0 = Math.min(xb, xf), w = Math.abs(xf - xb), y0 = neck[1] - H * 0.06, hh = hip[1] + H * 0.2 - y0;
            kcr.setAttribute('x', x0.toFixed(1)); kcr.setAttribute('width', w.toFixed(1)); kcr.setAttribute('y', y0.toFixed(1)); kcr.setAttribute('height', (hh * EASE.o(pl)).toFixed(1));
            capeG.style.opacity = flapG.style.opacity = clamp(pl * 2.5).toFixed(3);
          }
        }
        if (BL) { let k = 0; for (const b of BL) { if (b > t) break; if (t < b + 0.16) k = Math.sin((Math.PI * (t - b)) / 0.16); }
          eyes.forEach((e) => { if (k > 0.02) { const ex = +e.getAttribute('cx'), ey = +e.getAttribute('cy'); e.setAttribute('transform', `translate(${ex} ${ey}) scale(1.15 ${(1 - 0.85 * k).toFixed(3)}) translate(${-ex} ${-ey})`); } else e.removeAttribute('transform'); }); }
        // пар изо рта на холоде
        const br = clamp(S.breath), cyc = ((t + seed * 0.37) % 1.8) / 1.8;
        if (br > 0.01 && q >= 1) { const [bx, by] = nodP([hx + f * R * (SOSED ? 0.98 : 1.05), hy + R * (SOSED ? 0.62 : 0.38)]), k = cyc;   // «Сосед»: пар — от его маленького рта
          let d = ''; for (let j = 0; j <= 6; j++) { const xx = bx + f * (j * H * 0.022 + k * H * 0.05), yy = by - j * H * 0.006 - k * H * 0.03 + Math.sin(j * 1.3 + k * 4) * H * 0.008; d += (j ? 'L' : 'M') + xx.toFixed(1) + ' ' + yy.toFixed(1); }
          breath.setAttribute('d', d); breath.setAttribute('opacity', (br * 0.75 * Math.sin(Math.PI * Math.min(1, k * 1.25))).toFixed(3)); }
        else breath.setAttribute('opacity', 0);
      };
      E.on((t) => P.draw(t));
      return P;
    }
    // «Сосед» со спины — как на баннере канала: маленький силуэт для общих планов (руки в кармане, смотрит вверх).
    //   const b = PH.back(parent, {h: 110, top, top2, jeans, jeans2, shoe, hair, skin, skin2});
    //   b.keys([[t, {x, y, vis, fade, nod, roll, shrug}], ...]) — x, y — середина между стопами на полу;
    //   vis 0→1 — рисуется кистью; nod — смотрит вверх (0…1), roll — наклон головы вбок (градусы), shrug — пожал плечами (0…1)
    function back(parent, o = {}) {
      const H = o.h || 110, INK = '#141413', SKIN = o.skin || '#EFC9A8', SKIN2 = o.skin2 || SKIN, TOP = o.top || '#D97757', TOP2 = o.top2 || '#B4553A';
      const JEANS = o.jeans || '#E1D6C3', JEANS2 = o.jeans2 || JEANS, SHOE = o.shoe || '#2A2420', HAIR = o.hair || '#2A2420', COLLAR = o.collar || TOP;
      const LWb = o.lw || Math.max(1.8, H * 0.02), legW = H * 0.08, armW = H * 0.062, R = H * 0.055, seed = o.seed || 2;
      const root = el('g', {}, parent), g = el('g', {filter: 'url(#inkRough)'}, root), inks = [], fills = [];
      const mk = (tag, a, par, ink) => { const n = el(tag, a, par); if (ink) { n.setAttribute('pathLength', 1); n.setAttribute('stroke-dasharray', '1 1'); inks.push(n); } else fills.push(n); return n; };
      const tube = (w, color) => { const G2 = el('g', {}, g); return {ink: mk('path', {fill: 'none', stroke: INK, 'stroke-width': w + LWb * 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, G2, true),
        fill: mk('path', {fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, G2, true)}; };
      const F2 = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      const spl = (pts, corners) => { const m = pts.length, P = (i) => pts[(i + m) % m], C = (i) => corners.has((i + m) % m); let d = 'M' + F2(pts[0]);
        for (let i = 0; i < m; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
          const c1 = C(i) ? p1 : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = C(i + 1) ? p2 : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
          d += 'C' + F2(c1) + ' ' + F2(c2) + ' ' + F2(p2); } return d + 'Z'; };
      // порядок: руки (их концы уходят за корпус — кисти в кармане спереди), ноги, ботинки, корпус, капюшон на спине, воротник, шея, уши, волосы
      const arms = [tube(armW, TOP), tube(armW, TOP)], legs = [tube(legW, JEANS), tube(legW, JEANS2)];
      const shoes = [0, 1].map(() => mk('path', {fill: SHOE, stroke: INK, 'stroke-width': LWb}, g));
      const soles = [0, 1].map(() => mk('path', {fill: 'none', stroke: o.sole || '#D8CEBF', 'stroke-width': Math.max(1, H * 0.006), 'stroke-linecap': 'round'}, g));
      const gid = 'phBk' + (++N_PH), gr = el('linearGradient', {id: gid, x1: 0, y1: 0, x2: 0, y2: 1}, E.defs);
      [[0, 0], [0.4, 0.06], [1, 0.5]].forEach(([of, op]) => el('stop', {offset: of, 'stop-color': o.shade || '#8C3A22', 'stop-opacity': op}, gr));
      const body = mk('path', {fill: TOP}, g), shade = mk('path', {fill: `url(#${gid})`}, g), hem = mk('path', {fill: TOP2, 'fill-opacity': 0.75}, g), bodyInk = mk('path', {fill: 'none', stroke: INK, 'stroke-width': LWb, 'stroke-linejoin': 'round'}, g, true);
      const hood = mk('path', {fill: TOP2, stroke: INK, 'stroke-width': LWb * 0.9, 'stroke-linejoin': 'round'}, g), hoodSeam = mk('path', {fill: 'none', stroke: INK, 'stroke-width': LWb * 0.7, 'stroke-linecap': 'round'}, g);
      const collar = mk('path', {fill: COLLAR, stroke: INK, 'stroke-width': LWb, 'stroke-linejoin': 'round'}, g);
      const headG = el('g', {}, g);
      const neckI = mk('path', {fill: 'none', stroke: INK, 'stroke-width': R * 0.78 + LWb * 1.4, 'stroke-linecap': 'round'}, headG), neckS = mk('path', {fill: 'none', stroke: SKIN2, 'stroke-width': R * 0.78, 'stroke-linecap': 'round'}, headG);
      const ears = [0, 1].map(() => mk('ellipse', {fill: SKIN, stroke: INK, 'stroke-width': LWb * 0.85}, headG));
      const hair = mk('path', {fill: HAIR, stroke: INK, 'stroke-width': LWb * 0.6, 'stroke-linejoin': 'round'}, headG), hairHi = mk('path', {fill: 'none', stroke: o.hairHi || '#6F665D', 'stroke-width': Math.max(1, H * 0.006), 'stroke-linecap': 'round'}, headG);
      // волосы со спины, в долях R от центра головы: затылок шапкой, хохолок наверху чуть вбок, ровная линия у шеи
      const HB = [[-0.62, 0.6], [-0.93, 0.28], [-1.03, -0.2], [-0.93, -0.66], [-0.62, -0.98], [-0.22, -1.12], [0.0, -1.3], [0.1, -1.62], [0.22, -1.98], [0.34, -1.6], [0.4, -1.22],
        [0.64, -1.0], [0.93, -0.66], [1.03, -0.2], [0.93, 0.28], [0.62, 0.6], [0.3, 0.5], [0, 0.55], [-0.3, 0.5]], HBC = new Set([8, 0, 15]);
      let K = [[0, {x: 0, y: 0, vis: 1}]];
      const B = {g: root, H};
      B.keys = (list) => { K = list.slice().sort((a, b) => a[0] - b[0]); return B; };
      const state = (t) => { let a = K[0], b = K[0];
        for (let i = 0; i < K.length; i++) { if (K[i][0] <= t) a = K[i]; if (K[i][0] > t) { b = K[i]; break; } b = K[i]; }
        const u = a === b ? 1 : EASE.io2(clamp((t - a[0]) / (b[0] - a[0]))), num = (k, d) => lerp(a[1][k] ?? d, b[1][k] ?? a[1][k] ?? d, u);
        return {x: num('x', 0), y: num('y', 0), vis: num('vis', 1), fade: num('fade', 1), nod: num('nod', 0), roll: num('roll', 0), shrug: num('shrug', 0)}; };
      B.draw = (t) => {
        const S = state(t), q = clamp(S.vis);
        if (S.fade * (q > 0 ? 1 : 0) <= 0.001) { root.style.display = 'none'; return; }
        root.style.display = ''; root.style.opacity = S.fade;
        const kb = EASE.io2(clamp(q / 0.6)), fk = clamp((q - 0.4) / 0.6);
        inks.forEach((n) => { n.style.strokeDashoffset = (1 - kb).toFixed(3); n.style.opacity = clamp(kb / 0.2).toFixed(3); });
        fills.forEach((n) => (n.style.opacity = fk.toFixed(3)));
        const X = S.x, Y = S.y, br = Math.sin(t * 1.7 + seed) * H * 0.003, up = S.shrug * H * 0.03 + br, P = (x, y, lift = 0) => [X + x * H, Y + y * H - lift];
        // ноги и ботинки (пятки к нам)
        [[-1, legs[0]], [1, legs[1]]].forEach(([s, T]) => { const d = `M${F2(P(s * 0.034, -0.5))}L${F2(P(s * 0.04, -0.045))}`; T.ink.setAttribute('d', d); T.fill.setAttribute('d', d); });
        [-1, 1].forEach((s, i) => { const [cx, cy] = P(s * 0.043, -0.024);
          shoes[i].setAttribute('d', `M${F2([cx - H * 0.042, cy + H * 0.02])}Q${F2([cx - H * 0.046, cy - H * 0.03])} ${F2([cx, cy - H * 0.03])}Q${F2([cx + H * 0.046, cy - H * 0.03])} ${F2([cx + H * 0.042, cy + H * 0.02])}Z`);
          soles[i].setAttribute('d', `M${F2([cx - H * 0.036, cy + H * 0.012])}L${F2([cx + H * 0.036, cy + H * 0.012])}`); });
        // руки: плечо → локоть чуть в стороны → предплечье внутрь, за корпус
        [-1, 1].forEach((s, i) => { const d = `M${F2(P(s * 0.108, -0.772, up))}L${F2(P(s * 0.158, -0.63, up * 0.6))}L${F2(P(s * 0.1, -0.54, up * 0.3))}`; arms[i].ink.setAttribute('d', d); arms[i].fill.setAttribute('d', d); });
        // корпус: худи темнеет к подолу, тёмная резинка
        const torso = `M${F2(P(0.05, -0.8, up))}C${F2(P(0.09, -0.805, up))} ${F2(P(0.12, -0.795, up))} ${F2(P(0.12, -0.76, up))}L${F2(P(0.135, -0.45))}Q${F2(P(0, -0.415))} ${F2(P(-0.135, -0.45))}L${F2(P(-0.12, -0.76, up))}C${F2(P(-0.12, -0.795, up))} ${F2(P(-0.09, -0.805, up))} ${F2(P(-0.05, -0.8, up))}Z`;
        body.setAttribute('d', torso); shade.setAttribute('d', torso); bodyInk.setAttribute('d', torso);
        hem.setAttribute('d', `M${F2(P(0.133, -0.484))}Q${F2(P(0, -0.45))} ${F2(P(-0.133, -0.484))}L${F2(P(-0.135, -0.45))}Q${F2(P(0, -0.415))} ${F2(P(0.135, -0.45))}Z`);
        // капюшон лежит на спине, шов посередине; воротник вокруг шеи
        hood.setAttribute('d', `M${F2(P(-0.072, -0.792, up))}C${F2(P(-0.08, -0.715, up))} ${F2(P(-0.036, -0.668, up))} ${F2(P(0, -0.662, up))}C${F2(P(0.036, -0.668, up))} ${F2(P(0.08, -0.715, up))} ${F2(P(0.072, -0.792, up))}Z`);
        hoodSeam.setAttribute('d', `M${F2(P(0, -0.79, up))}L${F2(P(0, -0.668, up))}`);
        const [ox, oy] = P(0, -0.8, up), orx = H * 0.07, ory = H * 0.028;
        collar.setAttribute('d', `M${(ox - orx).toFixed(1)} ${oy.toFixed(1)}a${orx.toFixed(1)} ${ory.toFixed(1)} 0 1 0 ${(2 * orx).toFixed(1)} 0a${orx.toFixed(1)} ${ory.toFixed(1)} 0 1 0 ${(-2 * orx).toFixed(1)} 0Z`);
        // голова: шея, уши, затылок с хохолком; nod — смотрит вверх (затылок опускается к воротнику), roll — наклон вбок
        const [hx, hy] = P(0, -0.89, up - S.nod * H * 0.012);
        headG.setAttribute('transform', `rotate(${(S.roll || 0).toFixed(2)} ${ox.toFixed(1)} ${oy.toFixed(1)})`);
        const nk = `M${F2([ox, oy - H * 0.004])}L${F2([hx, hy + R * 0.55])}`; neckI.setAttribute('d', nk); neckS.setAttribute('d', nk);
        [-1, 1].forEach((s, i) => { const e = ears[i]; e.setAttribute('cx', (hx + s * R * 0.97).toFixed(1)); e.setAttribute('cy', (hy + R * 0.08).toFixed(1)); e.setAttribute('rx', (R * 0.22).toFixed(1)); e.setAttribute('ry', (R * 0.32).toFixed(1)); });
        hair.setAttribute('d', spl(HB.map(([a, b]) => [hx + a * R, hy + b * R]), HBC));
        hairHi.setAttribute('d', `M${F2([hx - R * 0.6, hy - R * 0.7])}Q${F2([hx - R * 0.25, hy - R * 0.98])} ${F2([hx + R * 0.1, hy - R * 1.0])}M${F2([hx + R * 0.35, hy - R * 0.9])}Q${F2([hx + R * 0.6, hy - R * 0.8])} ${F2([hx + R * 0.74, hy - R * 0.6])}`);
      };
      E.on((t) => B.draw(t));
      return B;
    }
    return {person, back, POSES};
  };
})(window);
