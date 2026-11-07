/* sosed2.js — «Сосед» по листу ref/character_sheet_v2.png (запрос владельца, 03.11.2026), рисовка «Свет».
 * Большая голова (~1/4.8 роста), уши, брови, мимика (спокоен/рад/тревога/удивлён/спит + ухмылка, язык, выдох, щёки),
 * худи: капюшон лежит за спиной, завязки с наконечниками, карман-кенгуру, резинки, штриховка тени, заливка чуть сдвинута
 * от контура; белые брюки, чёрные ботинки со светлой подошвой.
 * Рост H = 1000 единиц, вид масштабируется одним постоянным s (без анимации scale, без растяжений), контур — в px экрана.
 *
 *   const S2 = SOSED2();
 *   const a = S2.side(parentG, {s: 0.6, lw: 3.4, off: 3});      // профиль, смотрит по +x (dir: -1 — по −x)
 *   a.set({x, y, lean, tilt, armN: {sh, el} | {to: [x, y]}, armF, handN: 'relax'|'grip'|'phone'|'flat'|'fist', handF,
 *          legN: {hp, kn} | {foot: [x, y], toe}, legF, face: {eye, brow, worry, mouth, blush, tongue, look}});
 *   a.wrist('N') → [x, y] кисти в координатах родителя; a.headAt() → центр головы; a.mouthAt() → губы.
 *   const f = S2.front(parentG, {...}); f.set({x, y, armL, armR, handL, handR, face, tilt, legs: false})
 * Углы — градусы от вертикали вниз, минус — вперёд (по взгляду): плечо −170…60, локоть −150…0, бедро −100…40, колено 0…150.
 */
(function (G) {
  const {smooth, tube, ik2, mk, dirA, angOf, add, sub, mul, len, wrap} = G.GEOM2;
  const C = {
    OUT: '#211c1a', SKIN: '#EEC4A2', SKIN2: '#DDAA88', BLUSH: '#E8907F', HAIR: '#1d1a19', HAIRHI: '#77706b',
    HOOD: '#C9612C', HOOD2: '#A94C20', HOODIN: '#8F3D19', HATCH: '#7a3314', RIB: '#B5552A',
    PANT: '#EDEAE4', PANT2: '#CFCAC2', PANTF: '#C4BEB6', SHOE: '#1f1c1b', SOLE: '#ECE7DF', SHOEHI: '#55504c',
    TEE: '#F2EFE9', STR: '#F4F0EA', MOUTH: '#7d2b25', TONGUE: '#E0736F', TEETH: '#FBF8F2', PHONE: '#2a2a33', PHONE2: '#3b3c48',
  };
  const LIM = {sh: [-170, 60], el: [-150, 0], hp: [-100, 40], kn: [0, 150]};
  const lim = (k, v, tag) => { if (v < LIM[k][0] - 0.5 || v > LIM[k][1] + 0.5) (G.__poseErr = G.__poseErr || []).push(`${tag} ${k}=${v.toFixed(0)}`); return v; };

  function base(parent, o) {
    const s = o.s || 0.6, lw = o.lw || 3.4, offPx = o.off == null ? 3 : o.off;
    const root = mk('g', {}, parent), g = mk('g', {}, root);
    const line = (par, extra) => mk('path', Object.assign({fill: 'none', stroke: C.OUT, 'stroke-width': lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke'}, extra || {}), par);
    const fill = (par, color, extra) => mk('path', Object.assign({fill: color}, extra || {}), par);
    let uid = (G.__s2uid = (G.__s2uid || 0) + 1);
    const clip = (d) => { const id = 's2c' + (++G.__s2uid); const cp = mk('clipPath', {id, clipPathUnits: 'userSpaceOnUse'}, o.defs || document.querySelector('svg defs')); const p = mk('path', {d: d || ''}, cp); return {id, p}; };
    return {s, lw, offPx, root, g, line, fill, clip, uid};
  }
  // штриховка: набор параллельных линий в квадрате [x0,y0,x1,y1], угол a (градусы), шаг gap
  function hatchD(x0, y0, x1, y1, gap, a = 62) {
    let d = ''; const t = Math.tan((a * Math.PI) / 180), h = y1 - y0;
    for (let x = x0 - h / t; x < x1; x += gap) d += `M${x.toFixed(1)} ${y1.toFixed(1)}L${(x + h / t).toFixed(1)} ${y0.toFixed(1)}`;
    return d;
  }

  /* ---------------------------------- ПРОФИЛЬ ---------------------------------- */
  // голова в профиль: начало — верх шеи, смотрит по +x; подбородок y≈+4, макушка y≈−212
  const HS = {
    face: [[-30, 2], [-48, -60], [-52, -130], [-10, -170], [44, -160], [58, -134], [62, -110], [64, -97], [74, -80], [74, -71], [66, -66], [65, -56], [63, -49], [65, -42], [61, -26], [50, -8], [28, 3], [0, 6]],
    faceC: [],
    hair: [[53, -150], [62, -164], [73, -183], [65, -201], [41, -213], [6, -217], [-30, -209], [-56, -191], [-70, -163], [-74, -128], [-70, -98], [-58, -76], [-44, -80], [-36, -98], [-28, -112], [-10, -120], [6, -118], [12, -106], [13, -90], [22, -112], [36, -132], [47, -144]],
    hairC: [0, 11, 18],
    hairHi: [[[-44, -178], [-16, -195], [16, -198]], [[-62, -132], [-58, -152]], [[32, -196], [52, -188]]],
    ear: [[-4, -99], [-18, -103], [-28, -93], [-30, -77], [-23, -63], [-10, -61], [-4, -71]],
    earIn: [[-12, -93], [-21, -88], [-21, -75], [-13, -70]],
    neck: [[-28, -8], [20, 0], [24, 46], [-26, 46]],
  };
  // корпус в профиль (от тазобедренного сустава, вверх — минус)
  const TS = {
    body: [[-92, 46], [-97, -12], [-100, -140], [-98, -252], [-86, -318], [-58, -352], [-22, -366], [22, -367], [49, -347], [63, -300], [71, -200], [75, -80], [76, 46]],
    bodyC: [0, 12],
    hood: [[-10, -368], [-30, -402], [-64, -416], [-98, -400], [-114, -360], [-110, -318], [-90, -296], [-64, -302], [-42, -330], [-26, -356]],
    hoodIn: [[-42, -390], [-68, -400], [-92, -386], [-98, -356], [-86, -334], [-66, -338], [-52, -362]],
    neckTop: [2, -380], shoulder: [-14, -320], hipJ: [0, 0],
  };
  const LEN = {u: 165, f: 150, t: 205, n: 172};

  function side(parent, o = {}) {
    const B = base(parent, o), {s, line, fill, g} = B;
    const dir = o.dir || 1;
    const offL = () => [(B.offPx / s) * dir, (B.offPx * 0.35) / s];       // сдвиг заливки — в экранных px вправо-вниз
    const part = (par) => mk('g', {}, par);
    // слои: дальняя рука, дальняя нога, ближняя нога, корпус, голова, ближняя рука
    const L = {};
    const mkLimb = (key, colors, opt = {}) => { const gg = part(g); const r = {g: gg, fill: fill(gg, colors[0]), shade: null, cuff: null, out: line(gg), extra: line(gg, {'stroke-width': B.lw * 0.7})};
      if (opt.shade) { const cl = B.clip(); r.clip = cl; r.shade = fill(gg, colors[1], {'clip-path': `url(#${cl.id})`}); }
      if (opt.cuff) { r.cuffG = part(gg); r.cuff = fill(r.cuffG, colors[2]); r.cuffO = line(r.cuffG); }
      if (opt.hand) { r.hand = part(gg); }
      if (opt.shoe) { r.shoe = part(gg); r.shoeF = fill(r.shoe, C.SHOE); r.shoeHi = line(r.shoe, {stroke: C.SHOEHI, 'stroke-width': B.lw * 0.6}); r.sole = line(r.shoe, {stroke: C.SOLE, 'stroke-width': B.lw * 0.9, 'stroke-linecap': 'butt'}); r.shoeO = line(r.shoe); }
      L[key] = r; return r; };
    mkLimb('armF', [C.HOOD2, C.HOODIN, C.RIB], {cuff: true, hand: true});
    mkLimb('legF', [C.PANTF, C.PANT2], {shade: true, shoe: true});
    mkLimb('legN', [C.PANT, C.PANT2], {shade: true, shoe: true});
    // корпус
    const tG = part(g), tFill = fill(tG, C.HOOD), tClip = B.clip(), hatch = line(tG, {stroke: C.HATCH, 'stroke-width': B.lw * 0.45, 'clip-path': `url(#${tClip.id})`, opacity: 0.85});
    const tShade = fill(tG, 'url(#s2HoodShade)', {'clip-path': `url(#${tClip.id})`});
    const hem = line(tG, {'stroke-width': B.lw * 0.75}), pocket = line(tG, {'stroke-width': B.lw * 0.75}), tOut = line(tG);
    const hoodG = part(tG), hoodF = fill(hoodG, C.HOOD), hoodIn = fill(hoodG, C.HOODIN), hoodInO = line(hoodG, {'stroke-width': B.lw * 0.7}), hoodO = line(hoodG);
    const strG = part(tG), str = line(strG, {'stroke-width': B.lw * 0.8}), aglet = mk('rect', {fill: C.STR, stroke: C.OUT, 'stroke-width': B.lw * 0.6, 'vector-effect': 'non-scaling-stroke', rx: 2}, strG);
    // голова
    const hG = part(g), neckF = fill(hG, C.SKIN2), neckO = line(hG, {'stroke-width': B.lw * 0.8});
    const collar = line(hG, {'stroke-width': B.lw * 0.9}), tee = fill(hG, C.TEE);
    const headG = part(hG);
    const faceF = fill(headG, C.SKIN), blush = mk('ellipse', {fill: C.BLUSH, opacity: 0.7}, headG), faceO = line(headG);
    const earF = fill(headG, C.SKIN), earO = line(headG, {'stroke-width': B.lw * 0.85}), earIn = line(headG, {'stroke-width': B.lw * 0.6});
    const hairF = fill(headG, C.HAIR), hairHi = line(headG, {stroke: C.HAIRHI, 'stroke-width': B.lw * 0.55}), hairO = line(headG, {'stroke-width': B.lw * 0.6});
    const eyeG = part(headG), brow = line(headG, {'stroke-width': B.lw * 0.95});
    const mouthG = part(headG);
    mkLimb('armN', [C.HOOD, C.HOODIN, C.RIB], {cuff: true, hand: true});
    const st = {x: 0, y: 0};
    const W = (p) => [st.x + p[0] * s * dir, st.y + p[1] * s];                      // локальные → координаты родителя
    const Loc = (p) => [(p[0] - st.x) / (s * dir), (p[1] - st.y) / s];
    const cache = {};
    function setD(n, d) { if (cache[n.__id || (n.__id = Math.random())] !== d) { n.setAttribute('d', d); cache[n.__id] = d; } }
    function limb(r, pts, ws, kind, opt = {}) {
      const d = tube(pts, ws, opt.caps || [1, 0.5]);
      const [ox, oy] = offL();
      setD(r.fill, d); r.fill.setAttribute('transform', `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`); setD(r.out, d);
      if (r.shade) { setD(r.clip.p, d); const back = pts.map((p, i) => { const nx = i < pts.length - 1 ? sub(pts[i + 1], p) : sub(p, pts[i - 1]); const n = mul([nx[1], -nx[0]], 1 / (len(nx) || 1)); return add(p, mul(n, -ws[i] * 0.42)); });
        setD(r.shade, tube(back, ws.map((w) => w * 0.42), [1, 1])); r.shade.setAttribute('opacity', 0.85); }
      setD(r.extra, opt.extra || '');
    }
    function shoeD(ank, a) { // ботинок у щиколотки, a — наклон стопы (минус — носок вниз)
      const pts = [[-30, -4], [-34, 20], [-30, 37], [80, 37], [92, 27], [86, 10], [62, -2], [30, -8], [0, -10]].map((p) => rot(p, a)).map((p) => add(ank, p));
      const sole = [[-31, 29], [90, 29]].map((p) => add(ank, rot(p, a)));
      const hi = [[10, -2], [46, 0], [70, 8]].map((p) => add(ank, rot(p, a)));
      return {d: smooth(pts, true, [2, 3], 1), sole: `M${G.GEOM2.P(sole[0])}L${G.GEOM2.P(sole[1])}`, hi: smooth(hi, false)};
    }
    const rot = (p, a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; };
    const tr = (p, a, o2) => add(o2, rot(p, a));
    const HANDS = {
      relax: {d: [[-18, -2], [-21, 20], [-19, 44], [-11, 62], [2, 68], [13, 62], [18, 46], [19, 22], [17, -2]], th: [[12, 10], [24, 20], [27, 34], [19, 40], [12, 30]], lines: [[[-3, 50], [-1, 62]]]},
      flat: {d: [[-17, -2], [-20, 24], [-16, 56], [-8, 76], [4, 80], [13, 72], [16, 50], [18, 24], [16, -2]], th: [[12, 12], [24, 24], [26, 38], [18, 42], [11, 32]], lines: [[[-2, 58], [0, 74]]]},
      fist: {d: [[-20, -2], [-25, 20], [-22, 44], [-8, 56], [12, 55], [25, 42], [26, 16], [19, -2]], th: [[16, 4], [30, 14], [31, 28], [22, 32], [14, 22]], lines: [[[2, 24], [24, 22]], [[0, 36], [24, 36]], [[2, 48], [20, 48]]]},
      // хват за вертикальную трубу (кисть ставится handA = −90): пальцы лежат друг над другом, линии между ними — вдоль предплечья, большой палец сверху
      grip: {d: [[-20, -2], [-25, 18], [-26, 40], [-21, 54], [-8, 59], [8, 59], [21, 54], [26, 38], [25, 16], [19, -2]], th: [[13, 3], [25, 8], [32, 19], [31, 31], [25, 35], [19, 27], [15, 14]], thO: [[23, 7], [31, 17], [31.5, 29], [26, 35], [20.5, 30]],
        lines: [[[-24, 22], [-12, 25], [0, 26], [12, 25], [22, 23]], [[-13, 27], [-13.5, 56]], [[-1, 29], [-1, 58.5]], [[11, 28], [11.5, 56]]]},
      // телефон в кулаке (handA ≈ −110): телефон торчит вверх из кулака экраном к лицу, большой палец придерживает его сбоку
      phone: {d: [[-19, -2], [-24, 18], [-25, 38], [-20, 52], [-8, 57], [8, 57], [20, 51], [25, 36], [24, 16], [18, -2]], th: [[13, 4], [25, 10], [33, 21], [33, 30], [26, 31], [19, 22], [15, 12]], thO: [[23, 9], [31.5, 18], [33.5, 28], [27, 31.5], [20.5, 25]],
        lines: [[[-23, 22], [-12, 24.5], [0, 25.5], [12, 24.5], [21, 22]], [[-13, 27], [-13.5, 54]], [[-1, 28], [-1, 56]], [[11, 27], [11.5, 53]]], phone: true},
    };
    function hand(r, wr, a, type, sideK) {
      const H = HANDS[type] || HANDS.relax; const hg = r.hand;
      if (hg.__type !== type) { while (hg.firstChild) hg.firstChild.remove(); hg.__type = type;
        hg.__ph = H.phone ? {g: part(hg)} : null;
        if (hg.__ph) { hg.__ph.body = mk('rect', {x: -11, y: -58, width: 22, height: 88, rx: 5, fill: C.PHONE, stroke: C.OUT, 'stroke-width': B.lw * 0.8, 'vector-effect': 'non-scaling-stroke'}, hg.__ph.g);
          hg.__ph.glow = mk('rect', {x: -8, y: -53, width: 13, height: 70, rx: 2.5, fill: '#bfe0ff', opacity: 0.9}, hg.__ph.g); }
        hg.__f = fill(hg, C.SKIN); hg.__o = line(hg, {'stroke-width': B.lw * 0.85}); hg.__tf = fill(hg, C.SKIN); hg.__to = line(hg, {'stroke-width': B.lw * 0.85}); hg.__l = line(hg, {'stroke-width': B.lw * 0.55}); }
      hg.setAttribute('transform', `translate(${wr[0].toFixed(1)} ${wr[1].toFixed(1)}) rotate(${a.toFixed(1)})`);
      const d = smooth(H.d, true), th = smooth(H.th, true);
      const [ox, oy] = offL();
      setD(hg.__f, d); setD(hg.__o, d); setD(hg.__tf, th); setD(hg.__to, H.thO ? smooth(H.thO, false) : th);
      hg.__f.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
      setD(hg.__l, H.lines.map((l) => smooth(l, false)).join(''));
      if (hg.__ph) { hg.__ph.g.setAttribute('transform', `rotate(${(-a + (r.phoneA || 0)).toFixed(1)} 0 30)`); }
    }
    // мимика профиля
    const FACE0 = {eye: 'open', brow: 0, worry: 0, mouth: 'smile', blush: 1, tongue: 0, look: [0, 0], open: 0};
    function face(fc) {
      const f = Object.assign({}, FACE0, fc || {});
      const [lx, ly] = f.look, ex = 40 + lx * 3, ey = -94 + ly * 3;
      // глаз
      if (eyeG.__k !== f.eye) { while (eyeG.firstChild) eyeG.firstChild.remove(); eyeG.__k = f.eye;
        if (f.eye === 'open' || f.eye === 'wide') { eyeG.__e = mk('ellipse', {fill: C.OUT}, eyeG); eyeG.__h = mk('circle', {fill: '#fff', r: 2.2}, eyeG); }
        else eyeG.__p = line(eyeG, {'stroke-width': B.lw * 0.9}); }
      if (f.eye === 'open' || f.eye === 'wide') { const w = f.eye === 'wide'; eyeG.__e.setAttribute('cx', ex); eyeG.__e.setAttribute('cy', ey); eyeG.__e.setAttribute('rx', w ? 7.6 : 6.2); eyeG.__e.setAttribute('ry', w ? 10.2 : 8.2);
        eyeG.__h.setAttribute('cx', ex + 1.8); eyeG.__h.setAttribute('cy', ey - 3); eyeG.__h.setAttribute('r', w ? 2.6 : 1.9); }
      else if (f.eye === 'closed') setD(eyeG.__p, `M${ex - 7} ${ey - 1}Q${ex} ${ey + 5} ${ex + 7} ${ey - 1}`);
      else if (f.eye === 'happy') setD(eyeG.__p, `M${ex - 7} ${ey + 2}Q${ex} ${ey - 7} ${ex + 7} ${ey + 2}`);
      else setD(eyeG.__p, `M${ex - 7} ${ey}L${ex + 7} ${ey - 1}`);
      // бровь: raise — вверх, worry — внутренний (передний) конец вверх
      const by = -117 - f.brow * 8, bw = f.worry * 8;
      setD(brow, `M${30} ${(by + bw * 0.4).toFixed(1)}Q${41} ${(by - 4 - bw * 0.3).toFixed(1)} ${52} ${(by - 2 - bw).toFixed(1)}`);
      blush.setAttribute('cx', 24); blush.setAttribute('cy', -63); blush.setAttribute('rx', 15); blush.setAttribute('ry', 8); blush.setAttribute('opacity', 0.62 * f.blush);
      // рот
      const mk2 = f.mouth + '|' + (f.tongue > 0 ? 't' : '');
      if (mouthG.__k !== mk2) { while (mouthG.firstChild) mouthG.firstChild.remove(); mouthG.__k = mk2;
        mouthG.__in = fill(mouthG, C.MOUTH); mouthG.__l = line(mouthG, {'stroke-width': B.lw * 0.85}); mouthG.__tg = fill(mouthG, C.TONGUE); mouthG.__tgo = line(mouthG, {'stroke-width': B.lw * 0.8}); }
      let inD = '', l = '', tg = '';
      switch (f.mouth) {
        case 'smile': l = 'M65 -47Q58 -40 50 -46'; break;
        case 'smirk': l = 'M64 -45Q57 -44 51 -51'; break;
        case 'flat': l = 'M65 -45L54 -45'; break;
        case 'frown': l = 'M65 -43Q58 -49 51 -43'; break;
        case 'grin': inD = 'M66 -50Q58 -36 49 -47Q57 -46 66 -50Z'; l = inD; break;
        case 'o': inD = 'M66 -51Q57 -51 57 -45Q57 -38 66 -39Z'; l = inD; break;
        case 'open': inD = 'M67 -53Q55 -52 55 -45Q56 -36 67 -37Z'; l = inD; break;
        case 'tongue': inD = 'M67 -52Q57 -50 57 -45Q57 -40 67 -38Z'; l = inD; break;
        default: l = '';
      }
      if (f.tongue > 0) { const tl = 4 + f.tongue * 24, x1 = 62 + tl;
        tg = `M58 -51Q${(60 + x1) / 2} -54 ${x1} -51Q${x1 + 9} -50 ${x1 + 9} -43Q${x1 + 9} -36 ${x1} -35Q${(60 + x1) / 2} -33 58 -37Z`;
        mouthG.__groove = `M62 -43L${x1 - 2} -43`; } else mouthG.__groove = '';
      setD(mouthG.__in, inD); setD(mouthG.__l, l + (mouthG.__groove || '')); setD(mouthG.__tg, tg); setD(mouthG.__tgo, tg);
    }
    const A = {root: B.root, s, dir, C};
    let last = null;
    A.set = function (q) {
      st.x = q.x || 0; st.y = q.y || 0;
      B.root.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${(s * dir).toFixed(4)} ${s.toFixed(4)})`);
      B.root.setAttribute('opacity', q.alpha == null ? 1 : q.alpha);
      const lean = q.lean || 0, hipLift = q.hipY || 0;
      const hip = [q.hipX || 0, -410 + hipLift];
      // корпус: поворот вокруг таза
      const tRot = (p) => add(hip, rot(p, lean));
      tG.setAttribute('transform', `translate(${hip[0]} ${hip[1]}) rotate(${lean.toFixed(2)})`);
      const [ox, oy] = offL(), bd = smooth(TS.body, true, TS.bodyC);
      setD(tFill, bd); tFill.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`); setD(tOut, bd); setD(tClip.p, bd);
      setD(tShade, bd);
      setD(hatch, hatchD(-104, -330, -70, 40, 15));
      setD(hem, 'M-95 18Q-10 22 76 18'); setD(pocket, 'M47 -112Q52 -50 52 18M47 -112Q60 -110 72 -100');
      const hd = smooth(TS.hood, true), hi = smooth(TS.hoodIn, true);
      setD(hoodF, hd); hoodF.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`); setD(hoodO, hd); setD(hoodIn, hi); setD(hoodInO, hi);
      setD(str, 'M30 -360Q31 -310 35 -268'); aglet.setAttribute('x', 31); aglet.setAttribute('y', -270); aglet.setAttribute('width', 8); aglet.setAttribute('height', 16);
      // голова на шее
      const nk = tRot(TS.neckTop), tilt = (q.tilt || 0) + lean * 0.35;
      hG.setAttribute('transform', `translate(${nk[0].toFixed(1)} ${nk[1].toFixed(1)}) rotate(${tilt.toFixed(2)})`);
      const nd = smooth(HS.neck, true, [2, 3]); setD(neckF, nd); setD(neckO, 'M-28 -8L-26 46M20 0L24 46');
      // ворот: передний край худи под подбородком + полоска футболки
      setD(collar, ''); setD(tee, 'M10 18Q20 12 30 20L28 28Q19 22 12 26Z');
      const fd = smooth(HS.face, true, HS.faceC), hr = smooth(HS.hair, true, HS.hairC), ed = smooth(HS.ear, true);
      setD(faceF, fd); setD(faceO, fd); setD(earF, ed); setD(earO, ed); setD(earIn, smooth(HS.earIn, false));
      setD(hairF, hr); setD(hairO, hr); setD(hairHi, HS.hairHi.map((h) => smooth(h, false)).join(''));
      face(q.face);
      // плечо в мировых (локальных героя) координатах
      const shW = tRot(TS.shoulder);
      const arm = (key, spec, handT, k) => {
        const r = L[key]; let a1, a2, el;
        if (spec && spec.to) { const T = Loc(spec.to); const ik = ik2(shW, T, LEN.u, LEN.f, 1); a1 = ik.a1; a2 = ik.a2; }
        else { a1 = (spec && spec.sh) || 0; a2 = a1 + ((spec && spec.el) || 0); }
        lim('sh', a1, key); lim('el', wrap(a2 - a1), key);
        const E = add(shW, mul(dirA(a1), LEN.u)), Wr = add(E, mul(dirA(a2), LEN.f));
        const Wc = add(E, mul(dirA(a2), LEN.f - 20));
        const sleeve = [add(shW, mul(dirA(a1), -14)), E, Wc];
        limb(r, sleeve, [80, 68, 60], 'arm', {caps: [1, 0.25]});
        // манжета
        const cpts = [Wc, add(Wc, mul(dirA(a2), 22))], cd = tube(cpts, [56, 52], [0.2, 0.25]);
        setD(r.cuff, cd); setD(r.cuffO, cd); r.cuff.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
        // складки на сгибе локтя
        const bend = wrap(a2 - a1);
        if (bend < -35) { const inner = add(E, mul(dirA(a1 + 90), -18)); setD(r.extra, `M${G.GEOM2.P(add(inner, mul(dirA(a1), -16)))}Q${G.GEOM2.P(add(inner, [6, 0]))} ${G.GEOM2.P(add(inner, mul(dirA(a2), 16)))}`); }
        else setD(r.extra, '');
        r.phoneA = spec && spec.phoneA;
        hand(r, add(Wr, mul(dirA(a2), 0)), spec && spec.handA != null ? spec.handA : a2 + ((spec && spec.wrist) || 0), handT || 'relax', k); // handA — угол кисти в мире (хват за трубу)
        r.W = Wr; r.a2 = a2;
      };
      arm('armF', q.armF || {sh: -8, el: -10}, q.handF, 1);
      arm('armN', q.armN || {sh: 6, el: -10}, q.handN, 0);
      // ноги
      const leg = (key, spec) => {
        const r = L[key], hJ = add(hip, [key === 'legF' ? -6 : 4, 0]); let a1, a2, ank, toe = (spec && spec.toe) || 0;
        if (spec && spec.foot) { const T = Loc(spec.foot); const ik = ik2(hJ, T, LEN.t, LEN.n, -1); a1 = ik.a1; a2 = ik.a2; }
        else { a1 = (spec && spec.hp) || 0; a2 = a1 + ((spec && spec.kn) || 0); }
        lim('hp', a1, key); lim('kn', wrap(a2 - a1), key);
        const K = add(hJ, mul(dirA(a1), LEN.t)); ank = add(K, mul(dirA(a2), LEN.n));
        limb(r, [add(hJ, mul(dirA(a1), -30)), K, ank], [98, 80, 74], 'leg', {caps: [1, 0.15], extra: `M${G.GEOM2.P(add(K, [4, -70]))}L${G.GEOM2.P(add(K, [6, -20]))}`});
        const sh = shoeD(add(ank, mul(dirA(a2), -4)), toe);
        setD(r.shoeF, sh.d); setD(r.shoeO, sh.d); setD(r.sole, sh.sole); setD(r.shoeHi, sh.hi);
        r.ank = ank;
      };
      leg('legF', q.legF || {hp: 3, kn: 0}); leg('legN', q.legN || {hp: -3, kn: 3});
      last = {hip, nk, tilt, lean};
      return A;
    };
    A.wrist = (k) => W(L[k === 'F' ? 'armF' : 'armN'].W);
    A.headAt = () => { const p = add(last.nk, rot([10, -100], last.tilt)); return W(p); };
    A.mouthAt = () => { const p = add(last.nk, rot([66, -45], last.tilt)); return W(p); };
    A.local = (p) => W(p);
    A.toLocal = Loc;
    A.LEN = LEN;
    return A;
  }

  /* ---------------------------------- АНФАС ---------------------------------- */
  const HF = {
    face: [[0, 6], [34, -1], [57, -28], [66, -66], [64, -108], [55, -140], [0, -152], [-55, -140], [-64, -108], [-66, -66], [-57, -28], [-34, -1]],
    hair: [[-68, -104], [-80, -138], [-79, -176], [-61, -201], [-28, -215], [10, -217], [45, -209], [70, -189], [81, -156], [77, -118], [67, -103], [60, -127], [50, -139], [30, -144], [10, -139], [-12, -146], [-37, -144], [-55, -134], [-61, -117]],
    hairC: [0, 10],
    hairHi: [[[-40, -188], [-6, -201], [28, -197]], [[-58, -160], [-48, -180]]],
    earR: [[60, -104], [74, -111], [84, -96], [82, -73], [70, -60], [61, -66]],
    earRIn: [[66, -98], [76, -94], [76, -78], [68, -72]],
  };
  const TF = {
    body: [[-92, 46], [-94, -60], [-96, -200], [-96, -282], [-86, -330], [-60, -352], [-26, -362], [26, -362], [60, -352], [86, -330], [96, -282], [96, -200], [94, -60], [92, 46]],
    bodyC: [0, 13],
    hood: [[-66, -352], [-78, -378], [-66, -400], [-34, -404], [0, -400], [34, -404], [66, -400], [78, -378], [66, -352], [36, -360], [0, -356], [-36, -360]],
    neckTop: [0, -388], shL: [-86, -318], shR: [86, -318],
  };
  function front(parent, o = {}) {
    const B = base(parent, o), {s, line, fill, g} = B;
    const offL = () => [B.offPx / s, (B.offPx * 0.35) / s];
    const part = (par) => mk('g', {}, par);
    const L = {};
    const cache = {};
    function setD(n, d) { if (cache[n.__id || (n.__id = Math.random())] !== d) { n.setAttribute('d', d); cache[n.__id] = d; } }
    const mkArm = (key) => { const gg = part(g); const r = {g: gg, fill: fill(gg, C.HOOD), out: line(gg), fill2: fill(gg, C.HOOD), out2: line(gg), extra: line(gg, {'stroke-width': B.lw * 0.7})}; r.cuffG = part(gg); r.cuff = fill(r.cuffG, C.RIB); r.cuffO = line(r.cuffG); r.hand = part(gg); L[key] = r; return r; };
    // ноги (если видны)
    const legsG = part(g), legL = {f: fill(legsG, C.PANT), o: line(legsG)}, legR = {f: fill(legsG, C.PANT), o: line(legsG)}, shoes = fill(legsG, C.SHOE), shoesO = line(legsG), soles = line(legsG, {stroke: C.SOLE, 'stroke-width': B.lw * 0.9});
    const hoodBack = part(g), hoodF = fill(hoodBack, C.HOOD2), hoodO = line(hoodBack);
    const tG = part(g), tFill = fill(tG, C.HOOD), tClip = B.clip(), hatch = line(tG, {stroke: C.HATCH, 'stroke-width': B.lw * 0.45, 'clip-path': `url(#${tClip.id})`, opacity: 0.85});
    const tShade = fill(tG, 'url(#s2HoodShadeF)', {'clip-path': `url(#${tClip.id})`});
    const pocketF = fill(tG, C.HOOD), pocket = line(tG, {'stroke-width': B.lw * 0.85}), hem = line(tG, {'stroke-width': B.lw * 0.75}), tOut = line(tG);
    const neckG = part(g), neckF = fill(neckG, C.SKIN2), neckO = line(neckG, {'stroke-width': B.lw * 0.8}), tee = fill(neckG, C.TEE), teeO = line(neckG, {'stroke-width': B.lw * 0.7});
    const hoodRim = fill(neckG, C.HOOD), hoodRimO = line(neckG, {'stroke-width': B.lw * 0.9});
    const strG = part(g), str = line(strG, {'stroke-width': B.lw * 0.8}), ag1 = mk('rect', {fill: C.STR, stroke: C.OUT, 'stroke-width': B.lw * 0.6, 'vector-effect': 'non-scaling-stroke', rx: 2, width: 8, height: 16}, strG), ag2 = mk('rect', {fill: C.STR, stroke: C.OUT, 'stroke-width': B.lw * 0.6, 'vector-effect': 'non-scaling-stroke', rx: 2, width: 8, height: 16}, strG);
    const hG = part(g), headG = part(hG);
    const earsF = fill(headG, C.SKIN), earsO = line(headG, {'stroke-width': B.lw * 0.85}), earsIn = line(headG, {'stroke-width': B.lw * 0.6});
    const faceF = fill(headG, C.SKIN), blushL = mk('ellipse', {fill: C.BLUSH}, headG), blushR = mk('ellipse', {fill: C.BLUSH}, headG), faceO = line(headG);
    const hairF = fill(headG, C.HAIR), hairHi = line(headG, {stroke: C.HAIRHI, 'stroke-width': B.lw * 0.55}), hairO = line(headG, {'stroke-width': B.lw * 0.6});
    const eyeG = part(headG), brows = line(headG, {'stroke-width': B.lw * 0.95}), nose = line(headG, {'stroke-width': B.lw * 0.8}), mouthG = part(headG);
    mkArm('armL'); mkArm('armR');
    const st = {x: 0, y: 0};
    const W = (p) => [st.x + p[0] * s, st.y + p[1] * s], Loc = (p) => [(p[0] - st.x) / s, (p[1] - st.y) / s];
    const rot = (p, a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; };
    const HANDS = {
      // расслабленная кисть: ладонь+сомкнутые пальцы (кончики — гребешком), большой палец вдоль внутреннего края, контур только снаружи
      relax: {d: [[-17, -2], [-20, 16], [-21, 34], [-19, 47], [-15, 56], [-10.5, 58.5], [-6, 63.5], [-1.5, 62], [3.5, 66], [8.5, 62], [12.5, 61], [17, 53], [19.5, 40], [20, 24], [18, -2]],
        th: [[11, 6], [21, 11], [26.5, 23], [26, 35], [21.5, 42], [16.5, 39.5], [14, 28], [12, 16]], thO: [[19, 9], [25.5, 20], [26.5, 32], [23.5, 40.5], [19, 41.5], [16, 37], [14.5, 30]],
        lines: [[[-10.5, 47], [-10.5, 58]], [[-1.5, 49], [-1.5, 61.5]], [[8, 48], [8.5, 61.5]], [[4, 18], [10, 24]]]},
      fist: {d: [[-22, -2], [-26, 22], [-22, 46], [-6, 56], [12, 55], [25, 42], [26, 16], [19, -2]], th: [[16, 4], [30, 14], [31, 28], [22, 32], [14, 22]], lines: [[[0, 24], [22, 22]], [[-2, 36], [22, 36]], [[0, 48], [18, 48]]]},
      hold: {d: [[-22, -2], [-27, 22], [-24, 46], [-8, 58], [14, 57], [26, 42], [27, 16], [20, -2]], th: [[-16, 6], [-32, 18], [-34, 32], [-24, 36], [-16, 24]], lines: [[[-2, 24], [20, 22]], [[-4, 36], [20, 36]], [[-2, 48], [16, 48]]]},
      open: {d: [[-22, -2], [-26, 26], [-24, 60], [-14, 84], [0, 90], [14, 84], [22, 60], [26, 26], [20, -2]], th: [[18, 10], [34, 22], [38, 38], [28, 42], [18, 30]], lines: [[[-8, 62], [-6, 84]], [[2, 64], [2, 86]], [[12, 62], [12, 82]]]},
    };
    function hand(r, wr, a, type, mirror) {
      const hg = r.hand;
      if (type === 'none') { if (hg.__type !== 'none') { while (hg.firstChild) hg.firstChild.remove(); hg.__type = 'none'; } return; } // кисть рисует сцена (хват стакана/телефона)
      const H = HANDS[type] || HANDS.relax;
      if (hg.__type !== type) { while (hg.firstChild) hg.firstChild.remove(); hg.__type = type; hg.__f = fill(hg, C.SKIN); hg.__o = line(hg, {'stroke-width': B.lw * 0.85}); hg.__tf = fill(hg, C.SKIN); hg.__to = line(hg, {'stroke-width': B.lw * 0.85}); hg.__l = line(hg, {'stroke-width': B.lw * 0.55}); }
      hg.setAttribute('transform', `translate(${wr[0].toFixed(1)} ${wr[1].toFixed(1)}) rotate(${a.toFixed(1)}) scale(${mirror ? -1 : 1} 1)`);
      const [ox, oy] = offL(), d = smooth(H.d, true), th = smooth(H.th, true);
      setD(hg.__f, d); setD(hg.__o, d); setD(hg.__tf, th); setD(hg.__to, H.thO ? smooth(H.thO, false) : th); setD(hg.__l, H.lines.map((l) => smooth(l, false)).join(''));
      hg.__f.setAttribute('transform', `translate(${(mirror ? -ox : ox).toFixed(1)} ${oy.toFixed(1)})`);
    }
    const FACE0 = {eye: 'open', brow: 0, worry: 0, mouth: 'smile', blush: 1, look: [0, 0], puff: 0};
    function face(fc) {
      const f = Object.assign({}, FACE0, fc || {});
      const [lx, ly] = f.look;
      if (eyeG.__k !== f.eye) { while (eyeG.firstChild) eyeG.firstChild.remove(); eyeG.__k = f.eye;
        eyeG.__e = [0, 1].map(() => (f.eye === 'open' || f.eye === 'wide' ? {e: mk('ellipse', {fill: C.OUT}, eyeG), h: mk('circle', {fill: '#fff'}, eyeG)} : {p: line(eyeG, {'stroke-width': B.lw * 0.9})})); }
      [-1, 1].forEach((sx, i) => { const ex = sx * 28 + lx * 4, ey = -84 + ly * 3, e = eyeG.__e[i];
        if (e.e) { const w = f.eye === 'wide'; e.e.setAttribute('cx', ex); e.e.setAttribute('cy', ey); e.e.setAttribute('rx', w ? 7.4 : 6.2); e.e.setAttribute('ry', w ? 9.6 : 7.8); e.h.setAttribute('cx', ex + 1.8); e.h.setAttribute('cy', ey - 2.8); e.h.setAttribute('r', w ? 2.5 : 1.8); }
        else if (f.eye === 'closed') setD(e.p, `M${ex - 9} ${ey - 1}Q${ex} ${ey + 5} ${ex + 9} ${ey - 1}`);
        else if (f.eye === 'happy') setD(e.p, `M${ex - 8} ${ey + 3}Q${ex} ${ey - 7} ${ex + 8} ${ey + 3}`);
        else setD(e.p, `M${ex - 8} ${ey}L${ex + 8} ${ey}`); });
      const by = -106 - f.brow * 8, bw = f.worry * 9;
      setD(brows, [-1, 1].map((sx) => `M${sx * 40} ${(by + 2 + bw * 0.2).toFixed(1)}Q${sx * 29} ${(by - 4 - bw * 0.4).toFixed(1)} ${sx * 18} ${(by - bw).toFixed(1)}`).join(''));
      setD(nose, 'M4 -93Q11 -73 8 -65Q4 -59 -3 -62');
      [blushL, blushR].forEach((b, i) => { b.setAttribute('cx', (i ? 1 : -1) * (44 + f.puff * 6)); b.setAttribute('cy', -56); b.setAttribute('rx', 15 + f.puff * 3); b.setAttribute('ry', 9 + f.puff * 2); b.setAttribute('opacity', 0.62 * f.blush); });
      if (!mouthG.__in) { mouthG.__in = fill(mouthG, C.MOUTH); mouthG.__te = fill(mouthG, C.TEETH); mouthG.__l = line(mouthG, {'stroke-width': B.lw * 0.85}); }
      let inD = '', l = '', te = '';
      switch (f.mouth) {
        case 'smile': l = 'M-15 -40Q0 -28 15 -40'; break;
        case 'smirk': l = 'M-12 -36Q2 -32 15 -42'; break;
        case 'flat': l = 'M-10 -36L10 -36'; break;
        case 'frown': l = 'M-11 -31Q0 -42 11 -31'; break;
        case 'grin': inD = 'M-17 -43Q0 -40 17 -43Q13 -25 0 -24Q-13 -25 -17 -43Z'; te = 'M-14 -42Q0 -40 14 -42L13 -37Q0 -35 -13 -37Z'; l = inD; break;
        case 'o': inD = 'M0 -44Q7 -44 7 -36Q7 -28 0 -28Q-7 -28 -7 -36Q-7 -44 0 -44Z'; l = inD; break;
        case 'talk': inD = 'M-9 -39Q0 -41 9 -39Q7 -30 0 -30Q-7 -30 -9 -39Z'; l = inD; break;
        case 'puff': l = 'M-5 -37Q0 -34 5 -37'; break;
        default: l = '';
      }
      setD(mouthG.__in, inD); setD(mouthG.__te, te); setD(mouthG.__l, l);
      return f;
    }
    const A = {root: B.root, s, C};
    let last = null;
    A.set = function (q) {
      st.x = q.x || 0; st.y = q.y || 0;
      B.root.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${s.toFixed(4)})`);
      B.root.setAttribute('opacity', q.alpha == null ? 1 : q.alpha);
      const hip = [0, -410 + (q.hipY || 0)], lean = q.lean || 0;
      const [ox, oy] = offL();
      tG.setAttribute('transform', `translate(${hip[0]} ${hip[1]}) rotate(${lean})`);
      hoodBack.setAttribute('transform', `translate(${hip[0]} ${hip[1]}) rotate(${lean})`);
      strG.setAttribute('transform', `translate(${hip[0]} ${hip[1]}) rotate(${lean})`);
      neckG.setAttribute('transform', `translate(${hip[0]} ${hip[1]}) rotate(${lean})`);
      const bd = smooth(TF.body, true, TF.bodyC);
      setD(tFill, bd); setD(tOut, bd); setD(tClip.p, bd); setD(tShade, bd); tFill.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
      setD(hatch, hatchD(-100, -300, -70, 40, 15));
      const pk = 'M-62 -150L62 -150L74 18L-74 18Z'; setD(pocketF, pk); setD(pocket, 'M-62 -150L62 -150M-62 -150L-74 18M62 -150L74 18'); setD(hem, 'M-103 16Q0 20 103 16');
      pocketF.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
      // капюшон за шеей (виден по бокам шеи) и его край вокруг ворота
      const hd = smooth(TF.hood, true); setD(hoodF, hd); setD(hoodO, hd);
      setD(neckF, 'M-30 -400L30 -400L28 -352L-28 -352Z'); setD(neckO, 'M-30 -400L-28 -356M30 -400L28 -356');
      setD(tee, 'M-30 -362Q0 -330 30 -362L26 -352Q0 -324 -26 -352Z'); setD(teeO, 'M-26 -352Q0 -324 26 -352');
      setD(hoodRim, 'M-74 -350Q-40 -372 -30 -364Q0 -326 30 -364Q40 -372 74 -350Q50 -330 26 -350Q0 -318 -26 -350Q-50 -330 -74 -350Z');
      setD(hoodRimO, 'M-74 -350Q-40 -372 -30 -364Q0 -326 30 -364Q40 -372 74 -350');
      setD(str, 'M-14 -346Q-16 -305 -18 -262M14 -346Q16 -305 18 -262');
      ag1.setAttribute('x', -22); ag1.setAttribute('y', -266); ag2.setAttribute('x', 14); ag2.setAttribute('y', -266);
      // голова
      const nk = add(hip, rot(TF.neckTop, lean)), tilt = (q.tilt || 0);
      hG.setAttribute('transform', `translate(${nk[0].toFixed(1)} ${nk[1].toFixed(1)}) rotate(${tilt.toFixed(2)})`);
      const f = face(q.face);
      const fpts = HF.face.map((p) => (f.puff && p[1] > -80 && p[1] < -10 ? [p[0] * (1 + f.puff * 0.12), p[1]] : p));
      const fd = smooth(fpts, true); setD(faceF, fd); setD(faceO, fd);
      const er = smooth(HF.earR, true), el2 = smooth(HF.earR.map((p) => [-p[0], p[1]]), true);
      setD(earsF, er + el2); setD(earsO, er + el2); setD(earsIn, smooth(HF.earRIn, false) + smooth(HF.earRIn.map((p) => [-p[0], p[1]]), false));
      const hr = smooth(HF.hair, true, HF.hairC); setD(hairF, hr); setD(hairO, hr); setD(hairHi, HF.hairHi.map((h) => smooth(h, false)).join(''));
      // руки: armL — слева на экране (правая рука героя)
      const arm = (key, spec, handT, sx) => {
        const r = L[key], shp = add(hip, rot(sx < 0 ? TF.shL : TF.shR, lean)); let a1, a2;
        // в анфас угол «вперёд» = наружу (sx): sh>0 — рука отводится в сторону, el<0 — предплечье к центру
        const lu = LEN.u * ((spec && spec.uk) || 1), lf = LEN.f * ((spec && spec.fk) || 1); // fk/uk < 1 — звено в ракурсе (к зрителю)
        if (spec && spec.to) { const T = Loc(spec.to); const v = sub(T, shp); const mirror = (p) => [p[0] * -sx, p[1]];
          const ik = ik2([0, 0], mirror(v), lu, lf, spec.bend || 1); a1 = ik.a1; a2 = ik.a2; }
        else { a1 = (spec && spec.sh) || 0; a2 = a1 + ((spec && spec.el) || 0); }
        const dA = (a) => { const d = dirA(a); return [d[0] * -sx, d[1]]; };
        const E = add(shp, mul(dA(a1), lu)), Wr = add(E, mul(dA(a2), lf)), Wc = add(E, mul(dA(a2), lf - 20));
        // сильно сложенная рука (предплечье к лицу): одной трубкой не нарисовать — плечо и предплечье отдельно, предплечье спереди
        const vU = sub(shp, E), vF = sub(Wc, E), cosE = (vU[0] * vF[0] + vU[1] * vF[1]) / ((len(vU) * len(vF)) || 1);
        const split = spec && spec.split != null ? spec.split : cosE > 0.5;
        if (!split) { const d = tube([add(shp, mul(dA(a1), -14)), E, Wc], [82, 70, 62], [1, 0.25]); setD(r.fill, d); setD(r.out, d); setD(r.fill2, ''); setD(r.out2, ''); }
        else { const dU = tube([add(shp, mul(dA(a1), -14)), E], [82, 72], [1, 1]), dF = tube([E, Wc], [72, 62], [1, 0.25]);
          setD(r.fill, dU); setD(r.out, dU); setD(r.fill2, dF); setD(r.out2, dF); r.fill2.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`); }
        r.fill.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
        const cd = tube([Wc, add(Wc, mul(dA(a2), 22))], [58, 54], [0.2, 0.25]); setD(r.cuff, cd); setD(r.cuffO, cd); r.cuff.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);
        const ang = G.GEOM2.angOf(dA(a2));
        hand(r, Wr, ang + ((spec && spec.wrist) || 0) * -sx, handT || 'relax', sx > 0);
        r.W = Wr; r.ang = ang; r.E = E;
      };
      arm('armL', q.armL || {sh: 8, el: -6}, q.handL, -1);
      arm('armR', q.armR || {sh: 8, el: -6}, q.handR, 1);
      // ноги в анфас (стоя)
      legsG.setAttribute('display', q.legs === false ? 'none' : 'inline');
      if (q.legs !== false) { const lp = (sx) => tube([[sx * 46, -440], [sx * 48, -230], [sx * 50, -40]], [96, 82, 76], [1, 0.1]);
        setD(legL.f, lp(-1)); setD(legL.o, lp(-1)); setD(legR.f, lp(1)); setD(legR.o, lp(1));
        const sh = (sx) => smooth([[sx * 50 - 44, -36], [sx * 50 + 44, -36], [sx * 50 + 52, -8], [sx * 50 + 44, 2], [sx * 50 - 44, 2], [sx * 50 - 52, -8]], true);
        setD(shoes, sh(-1) + sh(1)); setD(shoesO, sh(-1) + sh(1)); setD(soles, [-1, 1].map((sx) => `M${sx * 50 - 46} -6L${sx * 50 + 46} -6`).join('')); }
      last = {hip, nk, tilt};
      return A;
    };
    A.wrist = (k) => W(L[k === 'L' ? 'armL' : 'armR'].W);
    A.forearm = (k) => { const r = L[k === 'L' ? 'armL' : 'armR']; return {W: W(r.W), E: W(r.E), ang: r.ang, s}; }; // запястье, локоть (координаты родителя), угол предплечья
    A.headAt = () => W(add(last.nk, [0, -100]));
    A.toLocal = Loc; A.local = W; A.LEN = LEN;
    return A;
  }
  // градиенты ткани (тень к низу и к спине) — один раз на документ
  function defs(D) {
    if (D.querySelector('#s2HoodShade')) return;
    const gr = mk('linearGradient', {id: 's2HoodShade', x1: 0, y1: 0, x2: 1, y2: 1}, D);
    [[0, 0.0], [0.55, 0.0], [1, 0.28]].forEach(([of, op]) => mk('stop', {offset: of, 'stop-color': '#5e240c', 'stop-opacity': op}, gr));
    const gf = mk('linearGradient', {id: 's2HoodShadeF', x1: 0, y1: 0, x2: 0, y2: 1}, D);
    [[0, 0.0], [0.6, 0.04], [1, 0.26]].forEach(([of, op]) => mk('stop', {offset: of, 'stop-color': '#5e240c', 'stop-opacity': op}, gf));
  }
  G.SOSED2 = function () { const D = document.querySelector('svg defs'); defs(D); return {side, front, C, LEN}; };
})(window);
