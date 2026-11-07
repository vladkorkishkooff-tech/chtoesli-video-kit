/* tf_c.js — дома: s12 полоскание и запреты, s13 «к врачу, если», s14 звонок мамы, s15 кот крупно. Переход паром. */
(function (G) {
  const {mk} = G.GEOM2, L2 = G.LOOK2, Y = G.YARD2, TF = G.TF;
  const {kf, ss, win, lerp, clamp, eio, eo} = L2;
  const S2 = G.SOSED2(), K = G.CAT2(), C = Y.C, OUT = '#211c1a';
  const HS = 0.74, HX = 540, HIP = 1175, HY0 = HIP + 410 * HS;
  const HK = 0.86, HIPC = 1068; // сидя: герой в группе с масштабом HK, таз на сиденье дивана (y кадра HIPC)
  const toLoc = (p) => [HX + (p[0] - HX) / HK, HIP + (p[1] - HIPC) / HK];
  const TBY = 1172, TBK = 0.85, MUG = [640, 1296], CAT = [360, 1308]; // столик, кружка, кот
  const PH = [676, 1100]; // телефон на диване рядом с бедром (координаты кадра)
  const T = (par, x, y, s, txt, o = {}) => { const n = mk('text', {x, y, 'font-family': o.font || 'PF', 'font-size': s, 'font-weight': o.w || null, fill: o.fill || '#2A2421', 'text-anchor': o.a || 'start', style: 'font-variant-numeric: lining-nums', opacity: o.op}, par); n.textContent = txt; return n; };

  // ---------- хват: тыльная сторона кисти + 4 пальца, обхватывающие предмет (стакан/телефон) ----------
  // предмет в своей системе: линия костяшек x = kx, пальцы — полосы [y0, y1, x кончика]; рисуется в hg поверх героя
  const SKIN = '#EEC4A2', SKIN2 = '#DDAA88', NAIL = '#F7DCCB', R2D = Math.PI / 180;
  const LU = 165 * HS, LF = 150 * HS; // длины плеча/предплечья в единицах hg
  const ln = (par, w, c) => mk('path', {fill: 'none', stroke: c || OUT, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke'}, par);
  const GRIP = {
    glass: {kx: -25, yc: -33.5, bands: [[-53, -43.4, 14], [-43.4, -33.6, 17], [-33.6, -23.8, 14], [-23.8, -15, 8]], sag: 2.2, cx: 0, hw: 25},
    phone: {kx: -15, yc: 11, bands: [[-5, 3.5, 9], [3.5, 12, 11], [12, 20, 9], [20, 27, 5]], sag: 0, cx: 0, hw: 15},
  };
  function grip(par, kind) {
    const R = {kind, c: GRIP[kind], g: mk('g', {}, par)};
    R.obj = mk('g', {}, R.g);
    if (kind === 'glass') {
      mk('path', {d: 'M-24 -76H24L19 0H-19Z', fill: '#E4F1FA', opacity: 0.95}, R.obj);
      R.water = mk('path', {d: 'M-21 -44H21L19 0H-19Z', fill: '#9CCBEB'}, R.obj);
      mk('path', {d: 'M-24 -76H24L19 0H-19Z', fill: 'none', stroke: OUT, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke'}, R.obj);
      mk('path', {d: 'M-14 -66V-10', stroke: '#fff', 'stroke-width': 4, opacity: 0.7, 'stroke-linecap': 'round'}, R.obj);
    } else {
      mk('rect', {x: -13, y: -30, width: 26, height: 60, rx: 6, fill: '#2a2a33'}, R.obj);
      R.back = mk('g', {}, R.obj); // задняя крышка с камерой (у уха)
      mk('rect', {x: -10, y: -27, width: 20, height: 54, rx: 4, fill: '#34343f'}, R.back);
      mk('circle', {cx: -5, cy: -22, r: 2.6, fill: '#15151b', stroke: '#55556a', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke'}, R.back);
      R.scr = mk('g', {}, R.obj); // экран (лежал экраном вверх, светится при звонке)
      mk('rect', {x: -10, y: -26, width: 20, height: 50, rx: 3, fill: '#3b3c48'}, R.scr);
      R.glow = mk('rect', {x: -10, y: -26, width: 20, height: 50, rx: 3, fill: '#BFE0FF', opacity: 0}, R.scr);
      mk('rect', {x: -13, y: -30, width: 26, height: 60, rx: 6, fill: 'none', stroke: OUT, 'stroke-width': 2.6, 'vector-effect': 'non-scaling-stroke'}, R.obj);
    }
    R.backF = mk('path', {fill: SKIN}, R.g); R.backS = ln(R.g, 2.2, SKIN2); R.backO = ln(R.g, 2.6);
    R.fF = mk('path', {fill: SKIN}, R.g); R.fN = mk('path', {fill: NAIL, stroke: SKIN2, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke'}, R.g); R.fS = ln(R.g, 2, SKIN2); R.fO = ln(R.g, 2.4);
    return R;
  }
  const P2 = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  const poly = (pts) => 'M' + pts.map(P2).join('L');
  // fa — hero.forearm(k); o: {tilt (°, мир), m (±1 зеркально), k (масштаб предмета), reach (костяшки от запястья, hg)}
  function gripSet(R, fa, o) {
    const c = R.c, a = fa.ang * R2D, u = [-Math.sin(a), Math.cos(a)], n = [u[1], -u[0]], W = fa.W, s = fa.s;
    const K = [W[0] + u[0] * (o.reach || 20), W[1] + u[1] * (o.reach || 20)];
    const th = (o.tilt || 0) * R2D, cs = Math.cos(th), sn = Math.sin(th), m = o.m || 1, k = o.k || 1;
    const M = (p) => { const x = m * k * (p[0] - c.kx), y = k * (p[1] - c.yc); return [K[0] + x * cs - y * sn, K[1] + x * sn + y * cs]; };
    R.M = M;
    R.obj.setAttribute('transform', `translate(${P2(K)}) rotate(${(o.tilt || 0).toFixed(2)}) scale(${(m * k).toFixed(3)} ${k.toFixed(3)}) translate(${-c.kx} ${-c.yc})`);
    // основание кисти — сразу за краем манжеты (манжета кончается на 2 ед. за запястьем, скругление 0.25)
    const wc = 27 * s, dep = 0.25 * wc, hw = 13.5 * k, base = [];
    for (let i = 0; i <= 6; i++) { const cc = (-1 + i / 3) * (hw / wc), off = 2 * s + dep * Math.sqrt(Math.max(0, 1 - cc * cc)) + 1.7;
      base.push([W[0] + u[0] * off + n[0] * cc * wc, W[1] + u[1] * off + n[1] * cc * wc]); }
    const b0 = c.bands[0], bl = c.bands[c.bands.length - 1];
    let Kt = M([c.kx, b0[0]]), Kb = M([c.kx, bl[1]]);
    const dn = (p) => (p[0] - W[0]) * n[0] + (p[1] - W[1]) * n[1];
    // base[0] — сторона −n, base[6] — +n; костяшка с большей проекцией на n идёт к +n
    let Kp = Kt, Km = Kb; if (dn(Kt) < dn(Kb)) { Kp = Kb; Km = Kt; }
    const Bm = base[0], Bp = base[6];
    const bulge = (A, B, side) => { const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], d = [B[0] - A[0], B[1] - A[1]], L0 = Math.hypot(d[0], d[1]) || 1; let q = [-d[1] / L0, d[0] / L0];
      const toSide = (mid[0] - W[0]) * n[0] * side + (mid[1] - W[1]) * n[1] * side; if ((q[0] * n[0] + q[1] * n[1]) * side < 0) q = [-q[0], -q[1]];
      return [mid[0] + q[0] * L0 * 0.1, mid[1] + q[1] * L0 * 0.1]; };
    const cp = bulge(Bp, Kp, 1), cm = bulge(Km, Bm, -1);
    const backD = `M${P2(Bp)}Q${P2(cp)} ${P2(Kp)}L${P2(Km)}Q${P2(cm)} ${P2(Bm)}` + base.slice(1).map((p) => 'L' + P2(p)).join('') + 'Z';
    R.backF.setAttribute('d', backD); R.backF.setAttribute('transform', 'translate(2 0.7)');
    R.backO.setAttribute('d', `M${P2(Bp)}Q${P2(cp)} ${P2(Kp)}M${P2(Km)}Q${P2(cm)} ${P2(Bm)}`);
    // складки-костяшки на тыльной стороне
    let ks = ''; c.bands.forEach((b, i) => { if (i === 0) return; const y = b[0]; const p0 = M([c.kx - 7, y - 1.5]), p1 = M([c.kx - 2.5, y]); ks += `M${P2(p0)}L${P2(p1)}`; });
    R.backS.setAttribute('d', ks);
    // пальцы
    let fd = '', od = '', sd = '', nd = '';
    const yo = (x) => c.sag * (1 - Math.min(1, ((x - c.cx) / c.hw) ** 2));
    c.bands.forEach((b, i) => {
      const [y0, y1, tip] = b, r = (y1 - y0) / 2, xt = tip - r, x0 = c.kx - 3, N = 6;
      const top = [], bot = [], arc = [];
      for (let j = 0; j <= N; j++) { const x = x0 + ((xt - x0) * j) / N; top.push(M([x, y0 + yo(x)])); bot.push(M([x, y1 + yo(x)])); }
      const yc0 = (y0 + y1) / 2 + yo(xt);
      for (let j = 1; j < 8; j++) { const t = -Math.PI / 2 + (Math.PI * j) / 8; arc.push(M([xt + Math.cos(t) * r * 0.95, yc0 + Math.sin(t) * r])); }
      const outline = top.concat(arc, bot.slice().reverse());
      fd += poly(outline) + 'Z';
      // контур: у крайних пальцев — от самого основания, у средних — разделительные линии начинаются у костяшек
      const st = i === 0 ? 0 : 1;
      od += poly(top.slice(st).concat(arc, bot.slice().reverse().slice(0, i === c.bands.length - 1 ? N + 1 : N)));
      // тень вдоль нижней части пальца
      const sh = []; for (let j = 1; j <= N - 1; j++) { const x = x0 + ((xt - x0) * j) / N; sh.push(M([x, y1 - 1.8 + yo(x)])); } sd += poly(sh);
      // ноготь на кончике (видна тыльная сторона пальцев)
      if (tip - c.kx > 22) { const nx = xt - r * 0.15, ny = yc0, nr = r * 0.55, np = [];
        for (let j = 0; j < 10; j++) { const t = (Math.PI * 2 * j) / 10; np.push(M([nx + Math.cos(t) * nr * 1.05, ny + Math.sin(t) * nr * 0.8])); } nd += poly(np) + 'Z'; }
    });
    R.fF.setAttribute('d', fd); R.fF.setAttribute('transform', 'translate(2 0.7)');
    R.fO.setAttribute('d', od); R.fS.setAttribute('d', sd); R.fN.setAttribute('d', nd);
    // заливка под контуром без сдвига (чтобы между пальцами и тыльной стороной не было щели)
    if (!R.fF2) { R.fF2 = mk('path', {fill: SKIN}, R.g); R.g.insertBefore(R.fF2, R.fN); R.bF2 = mk('path', {fill: SKIN}, R.g); R.g.insertBefore(R.bF2, R.backS); }
    R.fF2.setAttribute('d', fd); R.bF2.setAttribute('d', backD);
    return R;
  }
  // плечо героя в hg (с учётом наклона корпуса)
  function shoulderHG(side, lean) { const p = side === 'L' ? [-86, -318] : [86, -318], r = (lean || 0) * R2D, cc = Math.cos(r), sn = Math.sin(r); return [HX + (p[0] * cc - p[1] * sn) * HS, HIP + (p[0] * sn + p[1] * cc) * HS]; }
  // поза руки по экранным точкам локтя и запястья: укорочение звеньев даёт ракурс «к зрителю»
  // сторону сгиба выбираем ту, при которой IK ставит локоть ближе к заданному
  function armVia(side, Es, Ws, lean) { const S = shoulderHG(side, lean), E = toLoc(Es), Wt = toLoc(Ws), sx = side === 'L' ? -1 : 1;
    const uk = Math.min(1, Math.hypot(E[0] - S[0], E[1] - S[1]) / LU), fk = Math.min(1, Math.hypot(Wt[0] - E[0], Wt[1] - E[1]) / LF);
    const mir = (p) => [p[0] * -sx, p[1]], v = mir([Wt[0] - S[0], Wt[1] - S[1]]); let bend = 1, bd = 1e9;
    [1, -1].forEach((b) => { const J = mir(G.GEOM2.ik2([0, 0], v, LU * uk, LF * fk, b).J), d = Math.hypot(S[0] + J[0] - E[0], S[1] + J[1] - E[1]); if (d < bd) { bd = d; bend = b; } });
    return {to: Wt, uk, fk, bend}; }
  // поворот экранной точки вокруг таза (наклон корпуса)
  const rotHip = (p, lean) => { const r = (lean || 0) * R2D, cc = Math.cos(r), sn = Math.sin(r), d = [p[0] - HX, p[1] - HIPC]; return [HX + d[0] * cc - d[1] * sn, HIPC + d[0] * sn + d[1] * cc]; };
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  // общая сцена комнаты для s12–s14
  function buildHome(g, cam, self) {
    const D = TF.D;
    const rm = Y.room(cam, D, {lw: 2.8}); self.rm = rm;
    // телефон на диване справа
    self.phoneSofa = mk('g', {}, cam);
    mk('rect', {x: -22, y: -10, width: 44, height: 20, rx: 6, fill: '#2a2a33', stroke: OUT, 'stroke-width': 2.6}, self.phoneSofa);
    self.phoneGlow = mk('rect', {x: -18, y: -8, width: 36, height: 12, rx: 4, fill: '#BFE0FF', opacity: 0}, self.phoneSofa);
    self.phoneSofa.setAttribute('transform', `translate(${PH[0]} ${PH[1] + 6})`);
    // ковёр под столиком (перспектива пола)
    const rug = mk('g', {}, cam);
    Y.P(rug, 'M150 1336L930 1336L1030 1776L50 1776Z', '#76565E', OUT, 2.6);
    Y.P(rug, 'M186 1362L894 1362L980 1748L100 1748Z', null, '#B48A84', 5, {opacity: 0.55});
    Y.P(rug, 'M214 1386L866 1386L944 1724L136 1724Z', null, '#B48A84', 2.5, {opacity: 0.4});
    let fr = ''; for (let i = 0; i <= 40; i++) { const x = 56 + i * 24.35; fr += `M${x.toFixed(1)} 1778l${(-2 + (i % 3)).toFixed(0)} 18`; }
    Y.P(rug, fr, null, '#B48A84', 3, {opacity: 0.8});
    // тень-вмятина на сиденье и тень на полу (координаты кадра)
    mk('ellipse', {cx: HX, cy: 1112, rx: 130, ry: 18, fill: '#45486A', opacity: 0.6}, cam);
    mk('ellipse', {cx: HX, cy: 1318, rx: 104, ry: 12, fill: '#1c1a2a', opacity: 0.3}, cam);
    // герой (локальные координаты как у стоящего, группа масштабирует и сажает на диван)
    const hg = mk('g', {transform: `translate(${HX} ${HIPC}) scale(${HK}) translate(${-HX} ${-HIP})`}, cam);
    // ноги сидя (анфас): короткие бёдра (ракурс к зрителю), колени, голени до пола, тапки
    const lg = mk('g', {}, hg), KN = HIP + 107, A = HIP + 262;
    [-1, 1].forEach((sx) => { const x = HX + sx * 40;
      Y.P(lg, `M${x - 27} ${KN - 14}L${x - 24} ${A}H${x + 24}L${x + 27} ${KN - 14}Z`, '#D9D4CC', OUT, 3); // голень
      Y.P(lg, `M${x - 22} ${KN + 4}V${A - 6}`, null, '#C4BEB6', 4, {opacity: 0.55});
      Y.P(lg, `M${x - 29} ${A - 4}Q${x - 36} ${A + 22} ${x - 6} ${A + 27}Q${x + 6} ${A + 29} ${x + 24} ${A + 25}Q${x + 36} ${A + 20} ${x + 29} ${A - 4}Z`, '#3B3850', OUT, 3); // тапок
      Y.P(lg, `M${x - 22} ${A + 6}Q${x} ${A + 12} ${x + 22} ${A + 6}`, null, '#6A6688', 3, {opacity: 0.8});
      Y.P(lg, `M${x - 33} ${HIP - 16}L${x - 38} ${KN - 12}Q${x - 37} ${KN + 8} ${x} ${KN + 10}Q${x + 37} ${KN + 8} ${x + 38} ${KN - 12}L${x + 33} ${HIP - 16}Z`, '#EDEAE4', OUT, 3); // бедро
      Y.P(lg, `M${x - 26} ${KN - 6}Q${x} ${KN + 2} ${x + 26} ${KN - 6}`, null, '#CFCAC2', 3, {opacity: 0.9}); // колено
    });
    self.hero = S2.front(hg, {s: HS, lw: 3, off: 2});
    // стакан и телефон в руке — кисть рисует хват (пальцы обхватывают предмет)
    self.gl = grip(hg, 'glass');
    self.ph = grip(hg, 'phone'); self.ph.g.setAttribute('opacity', 0);
    // стол, кружка с паром, кот «буханкой»
    // журнальный столик перед диваном: задний край чуть ниже колен — голени за столом
    const tg = mk('g', {transform: `translate(540 ${TBY}) scale(${TBK}) translate(-540 -1450)`}, cam); Y.table(tg, D, {lw: 2.8 / TBK});
    const mg = mk('g', {transform: `translate(${MUG[0]} ${MUG[1]}) scale(0.62)`}, cam);
    mk('ellipse', {cx: 0, cy: 4, rx: 70, ry: 14, fill: '#8a5a3c', opacity: 0.5}, mg);
    mk('path', {d: 'M40 -70q42 0 42 34t-42 34', fill: 'none', stroke: OUT, 'stroke-width': 13}, mg); mk('path', {d: 'M40 -70q42 0 42 34t-42 34', fill: 'none', stroke: '#D06A33', 'stroke-width': 7}, mg);
    mk('path', {d: 'M-46 -96H46V-8Q46 4 34 4H-34Q-46 4 -46 -8Z', fill: '#D06A33', stroke: OUT, 'stroke-width': 3}, mg);
    mk('ellipse', {cx: 0, cy: -96, rx: 46, ry: 10, fill: '#6E3B22', stroke: OUT, 'stroke-width': 3}, mg);
    self.steam = [0, 1, 2].map((i) => mk('path', {fill: 'none', stroke: '#F4EFE6', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6}, mg));
    self.cat = K.loaf(cam, {s: 0.64, lw: 2.8});
    self.specks = L2.snow(cam, {n: 26, seed: 140, size: [1.4, 2.6], speed: [6, 14], sway: 22, opacity: 0.45, color: '#FFE9C2'});
    mk('rect', {x: -100, y: -100, width: 1280, height: 2120, fill: '#8E95CC', opacity: 0.1, style: 'mix-blend-mode:multiply'}, cam);
    L2.glow(cam, D, {x: rm.lampAt[0], y: rm.lampAt[1], r: 720, ry: 820, color: '#FFB866', op: 0.62});
    L2.glow(cam, D, {x: 230, y: 610, r: 330, ry: 420, color: '#9FB0F0', op: 0.2});
    L2.glow(cam, D, {x: MUG[0], y: MUG[1] - 70, r: 110, color: '#FFC57A', op: 0.25});
    self.ringG = mk('g', {opacity: 0}, cam);
    self.rings = [0, 1, 2].map(() => mk('path', {fill: 'none', stroke: '#FBF4E4', 'stroke-width': 4, 'stroke-linecap': 'round'}, self.ringG));
  }
  function homeTick(self, t) {
    self.specks.set(t);
    self.steam.forEach((p, i) => { const ph = t * 1.6 + i * 2.1, x = -22 + i * 22; let d = `M${x} -112`; for (let j = 1; j <= 4; j++) { const y = -112 - j * 26; d += `Q${(x + Math.sin(ph + j) * 12).toFixed(1)} ${(y + 13).toFixed(1)} ${(x + Math.sin(ph + j + 1) * 6).toFixed(1)} ${y}`; } p.setAttribute('d', d); p.setAttribute('opacity', (0.45 + 0.15 * Math.sin(ph)).toFixed(3)); });
    // часы идут
    const a = (Math.floor(t) * 6) % 360, r = (a * Math.PI) / 180; // секундная стрелка шагает раз в секунду
    self.rm.clockHands.setAttribute('d', `M800 250L${(800 + Math.sin(r) * 42).toFixed(1)} ${(250 - Math.cos(r) * 42).toFixed(1)}M800 250L828 266`);
  }
  const heroBase = (o) => Object.assign({x: HX, y: HY0, legs: false, armL: {sh: 10, el: -60}, armR: {sh: 10, el: -60}, handL: 'relax', handR: 'relax'}, o);
  // позы рук (экранные координаты локтя E и запястья W)
  const POSE = {
    rest: {E: [465, 965], W: [510, 985], tilt: 0},          // стакан у живота
    mid: {E: [466, 955], W: [505, 925], tilt: 0},           // стакан у груди (полощет рот)
    drink: {E: [460, 917], W: [500, 848], tilt: 18},        // стакан у губ
    restR: {E: [620, 967.5], W: [636.7, 1061.5]},           // свободная рука на диване у бедра
    reachR: {E: [676, 987.4], W: [684, 1078]},              // тянется к телефону на диване (наклон 15°)
    earR: {E: [645, 885], W: [607.5, 797.8], tilt: 12},     // телефон у уха
  };
  // запястье, при котором точка предмета objPt попадает в экранную точку target (предплечье — от локтя E)
  function wristFor(Es, target, objPt, o, c) { let W = target.slice();
    for (let i = 0; i < 8; i++) { const d = [W[0] - Es[0], W[1] - Es[1]], L0 = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L0, d[1] / L0];
      const th = (o.tilt || 0) * R2D, cs = Math.cos(th), sn = Math.sin(th), x = (o.m || 1) * (o.k || 1) * (objPt[0] - c.kx), y = (o.k || 1) * (objPt[1] - c.yc), r = o.reach || 20;
      W = [target[0] - (u[0] * r + x * cs - y * sn) * HK, target[1] - (u[1] * r + x * sn + y * cs) * HK]; }
    return W; }
  POSE.drink.W = wristFor(POSE.drink.E, [540, 805], [0, -76], {tilt: POSE.drink.tilt, m: 1}, GRIP.glass);   // край стакана у губ
  POSE.earR.W = wristFor(POSE.earR.E, [590, 770], [0, 0], {tilt: POSE.earR.tilt, m: -1}, GRIP.phone);      // телефон прижат к уху
  POSE.grabR = {W: wristFor(POSE.reachR.E, [676, 1106], [0, 0], {tilt: -90, m: -1, k: 0.85}, GRIP.phone)}; // телефон там, где лежал
  POSE.reachR.W = POSE.grabR.W;
  // уровень воды горизонтален в мире: в системе стакана линия y = yw − x·tg(tilt)
  function waterD(yw, tilt) { const tg = Math.tan(tilt * R2D), hwAt = (y) => 19 + (5 * -y) / 76 - 0.8;
    const yl = yw + 20 * tg, yr = yw - 20 * tg, xl = -hwAt(yl), xr = hwAt(yr);
    return `M${xl.toFixed(1)} ${(yw - xl * tg).toFixed(1)}L${xr.toFixed(1)} ${(yw - xr * tg).toFixed(1)}L19 -1H-19Z`; }
  // поставить героя: стакан в правой руке героя (armL), свободная/телефонная рука (armR)
  function poseHome(self, q) {
    const lean = q.lean || 0, gp = q.glass, spec = {};
    const Eg = rotHip(gp.E, lean), Wg = rotHip(gp.W, lean);
    const armL = armVia('L', Eg, Wg, lean);
    let armR, handR = 'relax';
    if (q.armR) { armR = armVia('R', q.armR.E, q.armR.W, lean); handR = q.armR.hand || 'relax'; }
    self.hero.set(heroBase({lean, armL, handL: 'none', armR, handR, face: q.face, tilt: q.tilt}));
    gripSet(self.gl, self.hero.forearm('L'), {tilt: gp.tilt || 0, m: 1, k: 1, reach: 20});
    self.gl.water.setAttribute('d', waterD(q.yw == null ? -22 : q.yw, gp.tilt || 0));
    if (q.phone) gripSet(self.ph, self.hero.forearm('R'), q.phone);
    self.ph.g.setAttribute('opacity', q.phone ? 1 : 0);
  }
  const lerpPose = (a, b, k) => ({E: lerp2(a.E, b.E, k), W: lerp2(a.W, b.W, k), tilt: lerp(a.tilt || 0, b.tilt || 0, k)});

  /* ================= s12: полоскание, запреты на сутки ================= */
  TF.shot({id: 's12', t0: 28.1, t1: 31.5, build(g, cam) { buildHome(g, cam, this); }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[28.1, 1.06], [31.5, 1.0]], t), 540, 1000));
    homeTick(this, t);
    const lift = kf([[28.5, 0], [28.75, 1], [29.0, 1], [29.15, 0.35], [29.95, 0.35], [30.2, 0]], t);
    const gp = lift < 0.35 ? lerpPose(POSE.rest, POSE.mid, lift / 0.35) : lerpPose(POSE.mid, POSE.drink, (lift - 0.35) / 0.65);
    const puff = t > 29.05 && t < 29.95 ? 0.75 + 0.25 * Math.sin((t - 29.05) * 18) : 0;
    const face = puff ? {mouth: 'puff', puff, eye: 'open', look: [0.3, 0]} : t > 30.1 ? {mouth: 'smile', eye: 'happy'} : {mouth: 'flat', eye: 'open'};
    if (t > 28.75 && t < 29.0) face.eye = 'closed';
    poseHome(this, {glass: gp, armR: POSE.restR, face, yw: t < 29.0 ? -44 : -22});
    this.cat.set({x: CAT[0], y: CAT[1], t});
  }});
  TF.inits.push(() => {
    TF.cap({lines: ['Дома: прополощи рот', [['тёплой водой', {mark: true}], ['.', {}]]], x: 540, y: 340, size: 56}, 28.5, 29.95);
    TF.cap({lines: ['Сутки — без горячего,', 'кислого и острого.'], x: 540, y: 340, size: 56}, 30.05, 31.45);
    // значки: горячий чай, лимон, перец — перечёркнуты
    const g = mk('g', {}, TF.U), y = 560;
    mk('rect', {x: 150, y: y - 110, width: 780, height: 220, rx: 22, fill: '#14111e', opacity: 0.2, transform: 'translate(0 8)'}, g);
    mk('rect', {x: 150, y: y - 110, width: 780, height: 220, rx: 22, fill: '#F4EFE6', opacity: 0.97}, g);
    const ink = {stroke: OUT, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
    const items = [];
    const i1 = mk('g', {transform: `translate(280 ${y + 10})`}, g);
    mk('path', Object.assign({d: 'M-46 -40H46V30Q46 44 32 44H-32Q-46 44 -46 30Z', fill: '#D06A33'}, ink), i1); mk('path', Object.assign({d: 'M46 -26q30 0 30 24t-30 24', fill: 'none'}, ink), i1);
    mk('path', {d: 'M-20 -54q-10 -14 0 -28q10 -14 0 -28M14 -54q-10 -14 0 -28q10 -14 0 -28', fill: 'none', stroke: '#C7532A', 'stroke-width': 5, 'stroke-linecap': 'round'}, i1);
    const i2 = mk('g', {transform: `translate(540 ${y})`}, g);
    mk('circle', Object.assign({r: 62, fill: '#F2D24A'}, ink), i2); mk('circle', {r: 48, fill: '#FBEFA6'}, i2);
    for (let a = 0; a < 8; a++) { const an = (a * Math.PI) / 4; mk('path', {d: `M0 0L${(Math.cos(an) * 46).toFixed(1)} ${(Math.sin(an) * 46).toFixed(1)}`, stroke: '#E8C23A', 'stroke-width': 4}, i2); }
    mk('circle', Object.assign({r: 62, fill: 'none'}, ink), i2);
    const i3 = mk('g', {transform: `translate(800 ${y})`}, g);
    mk('path', Object.assign({d: 'M-50 -40Q-60 30 10 56Q40 64 52 52Q20 44 4 10Q-12 -24 -26 -44Z', fill: '#D2432E'}, ink), i3);
    mk('path', Object.assign({d: 'M-30 -46Q-40 -66 -20 -76M-36 -42Q-20 -56 -10 -44', fill: 'none', stroke: '#4F7A3A', 'stroke-width': 6}), i3);
    [i1, i2, i3].forEach((ig, i) => { const x = mk('path', {d: 'M-62 -62L62 62M62 -62L-62 62', stroke: '#B83A26', 'stroke-width': 11, 'stroke-linecap': 'round', opacity: 0}, ig); items.push(x); });
    const C2 = {g, build() {}, set(k) { const t = TF.t; g.setAttribute('opacity', clamp(k * 1.4).toFixed(3)); g.setAttribute('transform', `translate(0 ${((1 - eo(clamp(k))) * 20).toFixed(1)})`);
      items.forEach((x, i) => { const kk = ss(30.35 + i * 0.2, 30.5 + i * 0.2, t); x.setAttribute('opacity', kk.toFixed(3)); x.setAttribute('stroke-dasharray', '180 180'); x.setAttribute('stroke-dashoffset', (180 * (1 - kk)).toFixed(1)); }); }};
    TF.ui.push({c: C2, t0: 30.1, t1: 31.45, fin: 0.2, fout: 0.12});
  });
  TF.sound('sip', 28.78, {gain: -10});
  TF.sound('rinse', 29.1, {gain: -12, dur: 0.85});

  /* ================= s13: к врачу, если ================= */
  TF.shot({id: 's13', t0: 31.5, t1: 35.1, build(g, cam) { buildHome(g, cam, this); }, update(t) {
    this.cam.setAttribute('transform', TF.camT(1.0, 540, 1000));
    homeTick(this, t);
    // читает карточку: взгляд вниз по пунктам, лёгкий наклон головы на каждом, дыхание
    const item = clamp((t - 31.9) / 0.6, 0, 3.6), nod = [32.0, 32.6, 33.2, 33.8].reduce((a, ti) => a + Math.exp(-(((t - ti - 0.18) / 0.14) ** 2)), 0);
    const face = {mouth: t > 34.3 ? 'flat' : 'flat', eye: (t > 33.0 && t < 33.12) || (t > 34.55 && t < 34.67) ? 'closed' : 'open', worry: 0.4 + 0.15 * clamp(item - 2), look: [0.15 * Math.sin(t * 2.2), -0.75 + item * 0.12]};
    poseHome(this, {glass: POSE.rest, armR: POSE.restR, face, tilt: 3.5 * nod - 1, lean: 0.7 * Math.sin(t * 1.7)});
    this.cat.set({x: CAT[0], y: CAT[1], t});
  }});
  TF.inits.push(() => {
    const g = mk('g', {}, TF.U), x = 120, y = 240, w = 840, h = 430;
    mk('rect', {x: x + 4, y: y + 10, width: w, height: h, rx: 10, fill: '#14111e', opacity: 0.25}, g);
    mk('rect', {x, y, width: w, height: h, rx: 10, fill: '#F6EFE0'}, g);
    mk('rect', {x: x + w / 2 - 80, y: y - 22, width: 160, height: 46, fill: '#E9DDB0', opacity: 0.85, transform: `rotate(2 ${x + w / 2} ${y})`}, g);
    const hd = T(g, x + 50, y + 92, 62, 'К врачу, если:', {font: 'PF'});
    mk('path', {d: L2.squig(x + 50, x + 250, y + 112, 3.2, 34), fill: 'none', stroke: '#D2692F', 'stroke-width': 5, 'stroke-linecap': 'round'}, g);
    const its = ['сильно болит', 'опух', 'кровит', 'трудно есть или говорить'].map((s, i) => { const gg = mk('g', {opacity: 0}, g), yy = y + 186 + i * 68;
      mk('circle', {cx: x + 66, cy: yy - 16, r: 10, fill: '#C7532A'}, gg); T(gg, x + 96, yy, 60, s, {font: 'CV', w: 700, fill: '#2B2836'}); return gg; });
    const C2 = {g, build() {}, set(k) { const t = TF.t; g.setAttribute('opacity', clamp(k * 1.4).toFixed(3)); g.setAttribute('transform', `translate(0 ${((1 - eo(clamp(k))) * 24).toFixed(1)})`);
      its.forEach((it, i) => { const kk = ss(32.0 + i * 0.6, 32.2 + i * 0.6, t); it.setAttribute('opacity', kk.toFixed(3)); it.setAttribute('transform', `translate(${((1 - kk) * -16).toFixed(1)} 0)`); }); }};
    TF.ui.push({c: C2, t0: 31.6, t1: 35.0, fin: 0.25, fout: 0.15});
  });

  /* ================= s14: звонит мама ================= */
  const RING = 35.15;
  TF.shot({id: 's14', t0: 35.1, t1: 38.3, build(g, cam) { buildHome(g, cam, this); }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[35.1, 1.0], [38.3, 1.08]], t), 560, 980));
    homeTick(this, t);
    const reach = kf([[35.45, 0], [35.75, 1]], t), toEar = kf([[35.78, 0], [36.2, 1]], t);
    // слушает маму: глаза бегают (качели-то лизал), голова к телефону
    const shifty = t > 36.15 && t < 37.2 ? (t > 36.55 && t < 36.85 ? [0.75, 0.05] : [-0.7, 0.1]) : null;
    const face = {mouth: t > 37.2 ? 'talk' : 'flat', eye: t > 37.2 ? 'happy' : 'open', look: t < 35.5 ? [0.8, 0.6] : shifty || [0, 0], blush: t > 37.2 ? 1.6 : 1, worry: shifty ? 0.5 : 0};
    if (t > 37.2 && t < 37.5) face.mouth = 'talk'; else if (t > 37.5) face.mouth = 'smile';
    const lean = 15 * reach * (1 - toEar), inHand = reach > 0.95;
    const ringing = t > RING && t < 36.0, gl = ringing ? 0.6 + 0.4 * Math.sin(t * 20) : 0;
    let armR, phone = null;
    if (!inHand) armR = {E: lerp2(POSE.restR.E, POSE.reachR.E, reach), W: lerp2(POSE.restR.W, POSE.reachR.W, reach), hand: 'relax'};
    else { const k = eio(toEar); armR = {E: lerp2(POSE.reachR.E, POSE.earR.E, k), W: lerp2(POSE.grabR.W, POSE.earR.W, k), hand: 'none'};
      phone = {tilt: lerp(-90, POSE.earR.tilt, k), m: -1, k: lerp(0.85, 1, k), reach: 20}; }
    poseHome(this, {glass: POSE.rest, armR, face, lean, phone});
    this.phoneSofa.setAttribute('opacity', inHand ? 0 : 1);
    this.phoneGlow.setAttribute('opacity', gl.toFixed(3));
    this.ph.glow.setAttribute('opacity', gl.toFixed(3)); const fl = toEar > 0.45; this.ph.scr.setAttribute('opacity', fl ? 0 : 1); this.ph.back.setAttribute('opacity', fl ? 1 : 0);
    this.ringG.setAttribute('opacity', ringing && !inHand ? 1 : 0);
    this.rings.forEach((r, i) => { const rr = 26 + i * 16 + ((t * 40) % 16); const X = PH[0], Y0 = PH[1] - 6; r.setAttribute('d', `M${X - rr} ${Y0 - rr * 0.4}A${rr} ${rr} 0 0 1 ${X - rr * 0.3} ${Y0 - rr}M${X + rr} ${Y0 - rr * 0.4}A${rr} ${rr} 0 0 0 ${X + rr * 0.3} ${Y0 - rr}`); });
    this.cat.set({x: CAT[0], y: CAT[1], t, front: ss(37.3, 37.5, t), eye: 'half', look: [0, 0]});
  }});
  TF.inits.push(() => {
    TF.bub({text: 'Ну что, качели не лизал?', x: 400, y: 560, tail: [250, 230], size: 46, at: [250, 230]}, 36.05, 37.25);
    TF.bub({text: 'Не, ты фто.', x: 760, y: 690, tail: [-190, 150], size: 50, at: [-190, 150]}, 37.25, 38.3);
  });
  TF.sound('ring', RING, {gain: -14, dur: 0.9});

  /* ================= s15: кот крупно, лапка ================= */
  TF.shot({id: 's15', t0: 38.3, t1: 41.3, build(g, cam) {
    const D = TF.D;
    const wall = L2.linear(D, [[0, '#5D6185'], [1, '#6C6F91']], 0, 0, 1, 0); Y.R(cam, -100, -100, 1280, 2120, `url(#${wall})`);
    const idw = L2.radial(D, [[0, '#A9B3E6', 0.5], [1, '#A9B3E6', 0]]); Y.E(cam, 130, 700, 260, 380, `url(#${idw})`);
    const idl = L2.radial(D, [[0, '#FFD592', 0.9], [0.5, '#F1A85A', 0.5], [1, '#F1A85A', 0]]);
    [[900, 520, 170], [760, 300, 70], [980, 980, 90], [300, 380, 60]].forEach(([x, y, r]) => Y.E(cam, x, y, r, r, `url(#${idl})`));
    Y.P(cam, 'M-100 1380Q540 1330 1180 1380V2020H-100Z', '#5A5E80', null, 0, {opacity: 0.9});
    this.cat = K.sit(cam, {s: 2.3, lw: 4});
    this.specks = L2.snow(cam, {n: 22, seed: 150, size: [1.6, 3], speed: [6, 14], sway: 22, opacity: 0.5, color: '#FFE9C2'});
    mk('rect', {x: -100, y: -100, width: 1280, height: 2120, fill: '#8E95CC', opacity: 0.08, style: 'mix-blend-mode:multiply'}, cam);
    L2.glow(cam, D, {x: 1000, y: 420, r: 720, color: '#FFB866', op: 0.55});
  }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[38.3, 1.0], [41.3, 1.06]], t), 540, 1000));
    this.specks.set(t);
    const paw = kf([[38.6, 0], [38.95, 1]], t, eo);
    this.cat.set({x: 540, y: 1600, eye: 'sad', look: [0, 0.2], paw, pawTo: [-110, -214], mouth: 'w', tail: t * 0.5, tilt: kf([[38.3, 0], [39.0, -4]], t)});
  }});
  TF.inits.push(() => {
    const g = mk('g', {}, TF.U);
    mk('rect', {x: 360, y: 262, width: 360, height: 136, rx: 18, fill: '#F4EFE6', opacity: 0.95}, g);
    mk('image', {href: 'tex/logo_chtoesli.png', x: 380, y: 272, width: 320, height: 115}, g);
    const C2 = {g, build() {}, set(k) { g.setAttribute('opacity', clamp(k * 1.3).toFixed(3)); }};
    TF.ui.push({c: C2, t0: 38.5, t1: 41.3, fin: 0.3, fout: 0.01});
    TF.cap({lines: ['Сохрани —', [['и пусть ', {}], ['не пригодится', {mark: true}], ['.', {}]]], x: 540, y: 520, size: 60, fout: 0.01}, 38.75, 41.3);
  });
  TF.sound('purr', 38.4, {gain: -16, dur: 2.9});

  /* ---------- переход паром: s11 → s12 ---------- */
  TF.inits.push(() => {
    const r = mk('rect', {x: 0, y: 0, width: 1080, height: 1920, fill: '#F3F2F8'}, TF.U);
    TF.ui.push({c: {g: r, build() {}, set(k) { r.setAttribute('opacity', k.toFixed(3)); }}, k: (t) => (t < 28.1 ? ss(27.85, 28.1, t) : 1 - ss(28.1, 28.5, t)) * (t > 27.8 && t < 28.6 ? 1 : 0)});
  });
})(window);
