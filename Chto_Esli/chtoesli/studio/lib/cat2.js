/* cat2.js — кот канала (как в cold_open_light: белый, рыжие пятна, тонкий контур, большие глаза в шоке).
 *   const K = CAT2(); const c = K.sit(parentG, {s, lw}); c.set({x, y, eye:'open'|'shock'|'half'|'closed'|'sad', look:[dx,dy], paw: 0..1, pawTo:[x,y], ear: 0, mouth:'w'|'o'|'flat', tail: phase});
 *   const l = K.loaf(parentG, {s, lw}); l.set({x, y, breath});   // спит «буханкой»
 * Размер: сидя ~300 единиц до кончиков ушей.
 */
(function (G) {
  const {smooth, tube, mk, add, sub, mul, dirA, angOf, ik2} = G.GEOM2;
  const C = {OUT: '#2a221e', FUR: '#F4EFE9', FUR2: '#DCD3CB', PATCH: '#C98A62', PATCH2: '#B0714C', EARIN: '#E9A79C', NOSE: '#D9827A', EYE: '#2a221e', WHITE: '#FFFFFF', PAD: '#E7A098'};
  function mkBase(parent, o) {
    const s = o.s || 1, lw = o.lw || 3, root = mk('g', {}, parent);
    const line = (par, ex) => mk('path', Object.assign({fill: 'none', stroke: C.OUT, 'stroke-width': lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke'}, ex || {}), par);
    const fill = (par, c, ex) => mk('path', Object.assign({fill: c}, ex || {}), par);
    const cache = new Map(); const setD = (n, d) => { if (cache.get(n) !== d) { n.setAttribute('d', d); cache.set(n, d); } };
    return {s, lw, root, line, fill, setD};
  }
  // голова анфас: центр (0,0), ширина ~150
  const HEAD = [[-72, 10], [-78, -20], [-70, -50], [-50, -66], [0, -72], [50, -66], [70, -50], [78, -20], [72, 10], [50, 34], [0, 44], [-50, 34]];
  const EARL = [[-66, -44], [-64, -112], [-22, -66]], EARLI = [[-56, -54], [-56, -96], [-32, -66]];
  function head(B, par) {
    const g = mk('g', {}, par);
    const earsF = B.fill(g, C.FUR), earsIn = B.fill(g, C.EARIN), earsO = B.line(g);
    const hF = B.fill(g, C.FUR), patch = B.fill(g, C.PATCH), hO = B.line(g);
    const eyes = mk('g', {}, g), nose = B.fill(g, C.NOSE), noseO = B.line(g, {'stroke-width': B.lw * 0.7}), mouth = B.line(g, {'stroke-width': B.lw * 0.8}), wh = B.line(g, {'stroke-width': B.lw * 0.45, opacity: 0.8});
    const cid = 'ck' + (G.__ckid = (G.__ckid || 0) + 1), cp = mk('clipPath', {id: cid}, document.querySelector('svg defs')), cpp = mk('path', {}, cp);
    patch.setAttribute('clip-path', `url(#${cid})`);
    return {g, set(f) {
      const ears = [EARL, EARL.map((p) => [-p[0], p[1]])].map((e) => smooth(e, true, [1], 0.6)).join('');
      const earsI = [EARLI, EARLI.map((p) => [-p[0], p[1]])].map((e) => smooth(e, true, [1], 0.6)).join('');
      B.setD(earsF, ears); B.setD(earsO, ears); B.setD(earsIn, earsI);
      const hd = smooth(HEAD, true); B.setD(hF, hd); B.setD(hO, hd); B.setD(cpp, hd);
      B.setD(patch, 'M-90 -80L10 -80Q14 -40 -10 -18Q-40 0 -90 -6Z');
      // глаза
      const k = f.eye || 'open', [lx, ly] = f.look || [0, 0];
      if (eyes.__k !== k) { while (eyes.firstChild) eyes.firstChild.remove(); eyes.__k = k; eyes.__n = [0, 1].map(() => ({w: B.fill(eyes, C.WHITE), wo: B.line(eyes, {'stroke-width': B.lw * 0.8}), p: B.fill(eyes, C.EYE), h: mk('circle', {fill: '#fff'}, eyes), l: B.line(eyes, {'stroke-width': B.lw * 0.9})})); }
      [-1, 1].forEach((sx, i) => { const e = eyes.__n[i], cx = sx * 30 + lx * 5, cy = -14 + ly * 4; let w = '', p = '', l = '', hr = 0;
        const ell = (x, y, rx, ry) => `M${x - rx} ${y}A${rx} ${ry} 0 1 0 ${x + rx} ${y}A${rx} ${ry} 0 1 0 ${x - rx} ${y}Z`;
        if (k === 'open') { p = ell(cx, cy, 7, 9); hr = 2.2; }
        else if (k === 'shock') { w = ell(sx * 30, -16, 19, 21); p = ell(sx * 30 + lx * 4, -15 + ly * 3, 5, 5.6); hr = 1.6; }
        else if (k === 'sad') { w = ell(sx * 30, -12, 15, 16); p = ell(sx * 30 + lx * 3, -9 + ly * 3, 10.5, 12); hr = 4; l = `M${sx * 30 - 16} ${-30 + (sx < 0 ? 6 : 0)}Q${sx * 30} ${-36} ${sx * 30 + 16} ${-30 + (sx > 0 ? 6 : 0)}`; }
        else if (k === 'half') { w = `M${cx - 13} ${cy - 2}L${cx + 13} ${cy - 2}Q${cx + 12} ${cy + 9} ${cx} ${cy + 10}Q${cx - 12} ${cy + 9} ${cx - 13} ${cy - 2}Z`; p = `M${cx - 5 + lx * 3} ${cy - 2}L${cx + 5 + lx * 3} ${cy - 2}Q${cx + 5 + lx * 3} ${cy + 8} ${cx + lx * 3} ${cy + 8}Q${cx - 5 + lx * 3} ${cy + 8} ${cx - 5 + lx * 3} ${cy - 2}Z`; l = `M${cx - 15} ${cy - 2}L${cx + 15} ${cy - 2}`; }
        else if (k === 'closed') { l = `M${cx - 12} ${cy}Q${cx} ${cy + 8} ${cx + 12} ${cy}`; }
        B.setD(e.w, w); B.setD(e.wo, w); B.setD(e.p, p); B.setD(e.l, l);
        if (hr && p) { const hx = k === 'shock' ? sx * 30 + lx * 4 + 1.6 : k === 'sad' ? sx * 30 + lx * 3 + 3.5 : cx + 2, hy = k === 'shock' ? -17 + ly * 3 : k === 'sad' ? -13 + ly * 3 : cy - 3;
          e.h.setAttribute('cx', hx); e.h.setAttribute('cy', hy); e.h.setAttribute('r', hr); e.h.setAttribute('opacity', 1); } else e.h.setAttribute('opacity', 0); });
      B.setD(nose, 'M-7 6L7 6L0 14Z'); B.setD(noseO, 'M-7 6L7 6L0 14Z');
      const m = f.mouth || 'w';
      B.setD(mouth, m === 'o' ? 'M0 14L0 18M-6 24Q0 16 6 24Q6 32 0 32Q-6 32 -6 24Z' : m === 'flat' ? 'M0 14L0 20M-9 21L9 21' : 'M0 14L0 19Q-5 25 -11 21M0 19Q5 25 11 21');
      B.setD(wh, [-1, 1].map((sx) => `M${sx * 42} 8L${sx * 92} 0M${sx * 42} 14L${sx * 94} 16M${sx * 42} 20L${sx * 88} 30`).join(''));
    }};
  }
  function sit(parent, o = {}) {
    const B = mkBase(parent, o), g = mk('g', {}, B.root);
    const tailF = B.fill(g, C.FUR), tailP = B.fill(g, C.PATCH), tailO = B.line(g);
    const bodyF = B.fill(g, C.FUR), bodyP = B.fill(g, C.PATCH), bodyS = B.fill(g, C.FUR2, {opacity: 0.6}), bodyO = B.line(g);
    const pawsF = B.fill(g, C.FUR), pawsO = B.line(g);
    const H = head(B, g);
    const armG = mk('g', {}, g), armF = B.fill(armG, C.FUR), armO = B.line(armG), pawF = B.fill(armG, C.FUR), pawO = B.line(armG), toeL = B.line(armG, {'stroke-width': B.lw * 0.7}),
      padsG = mk('g', {}, armG), pad = B.fill(padsG, C.PAD), padO = B.line(padsG, {'stroke-width': B.lw * 0.55});
    // контур лапы не рисуем внутри силуэта тела — лапа «растёт» из плеча, а не приклеена палкой
    const mid = 'cm' + (G.__ckid = (G.__ckid || 0) + 1), msk = mk('mask', {id: mid, maskUnits: 'userSpaceOnUse', x: -500, y: -700, width: 1000, height: 1000}, document.querySelector('svg defs'));
    mk('rect', {x: -500, y: -700, width: 1000, height: 1000, fill: '#fff'}, msk); const mskBody = mk('path', {fill: '#000'}, msk);
    armO.setAttribute('mask', `url(#${mid})`);
    const A = {root: B.root, C};
    A.set = (q) => {
      B.root.setAttribute('transform', `translate(${(q.x || 0).toFixed(1)} ${(q.y || 0).toFixed(1)}) scale(${B.s})`);
      B.root.setAttribute('opacity', q.alpha == null ? 1 : q.alpha);
      const bd = smooth([[-66, 0], [-80, -56], [-70, -128], [-44, -176], [44, -176], [70, -128], [80, -56], [66, 0]], true, [0, 7]);
      B.setD(bodyF, bd); B.setD(bodyO, bd); B.setD(mskBody, bd); B.setD(bodyP, 'M30 -170Q74 -150 78 -80Q74 -40 60 -30Q40 -80 30 -170Z'); B.setD(bodyS, 'M-66 0L66 0L72 -20Q0 -6 -72 -20Z');
      const tw = Math.sin((q.tail || 0) * 6.283) * 10;
      // хвост — плавная кривая (Безье, 16 точек), без изломов
      const bz = (P0, P1, P2, P3, u) => { const v = 1 - u; return [0, 1].map((i) => v * v * v * P0[i] + 3 * v * v * u * P1[i] + 3 * v * u * u * P2[i] + u * u * u * P3[i]); };
      const tp = [], tws = [], NT = 16;
      for (let i = 0; i <= NT; i++) { const u = i / NT; tp.push(bz([48, -10], [116 + tw * 0.2, -14], [128 + tw * 0.5, -78], [102 + tw, -120], u)); tws.push(27 - 7 * u); }
      const td = tube(tp, tws, [0.5, 1]);
      B.setD(tailF, td); B.setD(tailO, td); B.setD(tailP, tube(tp.slice(12), tws.slice(12), [0.25, 1]));
      const pd = smooth([[-40, 0], [-44, -14], [-30, -22], [-14, -14], [-12, 0]], true) + smooth([[12, 0], [14, -14], [30, -22], [44, -14], [40, 0]], true);
      B.setD(pawsF, pd); B.setD(pawsO, pd);
      H.g.setAttribute('transform', `translate(${(q.hx || 0)} ${-218 + (q.hy || 0)}) rotate(${q.tilt || 0})`);
      H.set(q);
      // поднятая лапа: плечо у края тела → локоть наружу → кисть у pawTo; подушечки к зрителю, внутри контура лапы
      const pw = q.paw || 0;
      armG.setAttribute('opacity', pw > 0.01 ? 1 : 0);
      if (pw > 0.01) { const S = [-54, -140], from = [-40, -118], to = q.pawTo || [-40, -250], T = [from[0] + (to[0] - from[0]) * pw, from[1] + (to[1] - from[1]) * pw];
        const ik = ik2(S, T, 46, 60, -1), E = ik.J, W = ik.E;
        const ad = tube([add(S, mul(dirA(ik.a1), -10)), E, W], [50, 40, 36], [1, 0.2]); B.setD(armF, ad); B.setD(armO, ad);
        const u = dirA(ik.a2), n = [-u[1], u[0]], L = (x, y) => [W[0] + x * n[0] + y * u[0], W[1] + x * n[1] + y * u[1]];
        const pp = (pts) => pts.map((p) => L(p[0], p[1]));
        const paw = smooth(pp([[-17, -4], [-22, 8], [-23, 22], [-18, 33], [-8, 38], [8, 38], [18, 33], [23, 22], [22, 8], [17, -4]]), true);
        B.setD(pawF, paw); B.setD(pawO, paw);
        const toes = [[-8, 38, -7, 31], [8, 38, 7, 31]].map(([x1, y1, x2, y2]) => { const a = L(x1, y1), b = L(x2, y2); return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }).join('');
        B.setD(toeL, toes);
        const ell = (cx, cy, rx, ry) => { const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return smooth(pp(pts), true); };
        const main = smooth(pp([[0, 4], [9, 6], [12, 13], [8, 19], [0, 18], [-8, 19], [-12, 13], [-9, 6]]), true);
        const pads = main + ell(-14.5, 25, 3.6, 4.4) + ell(-5, 30, 3.8, 4.6) + ell(5, 30, 3.8, 4.6) + ell(14.5, 25, 3.6, 4.4);
        B.setD(pad, pads); B.setD(padO, pads); }
    };
    return A;
  }
  function loaf(parent, o = {}) {
    const B = mkBase(parent, o), g = mk('g', {}, B.root);
    const bodyF = B.fill(g, C.FUR), bodyP = B.fill(g, C.PATCH), bodyO = B.line(g), tailF = B.fill(g, C.FUR), tailO = B.line(g);
    const headG = mk('g', {}, g), earF = B.fill(headG, C.FUR), earIn = B.fill(headG, C.EARIN), earO = B.line(headG), hF = B.fill(headG, C.FUR), hP = B.fill(headG, C.PATCH), hO = B.line(headG), eye = B.line(headG, {'stroke-width': B.lw * 0.9}), nose = B.fill(headG, C.NOSE), wh = B.line(headG, {'stroke-width': B.lw * 0.45, opacity: 0.8});
    const fhG = mk('g', {opacity: 0}, g), FH = head(B, fhG);
    const A = {root: B.root};
    A.set = (q) => {
      const br = Math.sin((q.t || 0) * 2.2) * 2.2;
      const fr = q.front || 0; headG.setAttribute('opacity', (1 - fr).toFixed(3)); fhG.setAttribute('opacity', fr.toFixed(3));
      fhG.setAttribute('transform', `translate(${92 + (1 - fr) * 6} ${-58 - br * 0.5 - fr * 4}) scale(${q.flip ? -0.74 : 0.74} 0.74)`);
      if (fr > 0.01) FH.set({eye: q.eye || 'half', look: q.look || [0, 0], mouth: q.mouth || 'w'});
      B.root.setAttribute('transform', `translate(${(q.x || 0).toFixed(1)} ${(q.y || 0).toFixed(1)}) scale(${(q.flip ? -1 : 1) * B.s} ${B.s})`);
      const bd = smooth([[-150, 0], [-170, -40], [-140, -88 - br], [-60, -104 - br], [40, -96 - br], [96, -64], [106, -20], [92, 0]], true, [0, 7]);
      B.setD(bodyF, bd); B.setD(bodyO, bd); B.setD(bodyP, 'M-120 -92Q-60 -112 -10 -100Q-20 -60 -70 -54Q-110 -56 -120 -92Z');
      const td = tube([[-150, -6], [-100, 4], [-30, 6], [30, 2]], [24, 24, 22, 18], [0.5, 1]); B.setD(tailF, td); B.setD(tailO, td);
      headG.setAttribute('transform', `translate(92 ${-46 - br * 0.5})`);
      const hd = smooth([[-52, 30], [-60, -6], [-44, -40], [0, -50], [40, -40], [56, -8], [50, 26], [0, 38]], true);
      const ear = smooth([[-40, -34], [-36, -86], [-6, -48]], true, [1], 0.6) + smooth([[14, -48], [40, -84], [44, -30]], true, [1], 0.6);
      B.setD(earF, ear); B.setD(earO, ear); B.setD(earIn, smooth([[-32, -42], [-32, -72], [-14, -48]], true, [1], 0.6) + smooth([[20, -46], [36, -72], [38, -36]], true, [1], 0.6));
      B.setD(hF, hd); B.setD(hO, hd); B.setD(hP, 'M8 -50Q50 -44 56 -8Q36 -6 20 -20Q8 -34 8 -50Z');
      B.setD(eye, 'M-30 -4Q-20 3 -10 -4M14 -4Q24 3 34 -4'); B.setD(nose, 'M-2 10L8 10L3 16Z');
      B.setD(wh, 'M28 14L74 8M28 20L72 24M-24 14L-66 8M-24 20L-64 26');
    };
    return A;
  }
  G.CAT2 = () => ({sit, loaf, C});
})(window);
