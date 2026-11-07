/* tf_a.js — планы во дворе: s01 макро трубы, s02 общий план, s03/s08/s11 крупно сбоку, s04 окно с котом, s05–s07 стоп-кадр. */
(function (G) {
  const {mk} = G.GEOM2, L2 = G.LOOK2, Y = G.YARD2, TF = G.TF;
  const {kf, ss, win, lerp, clamp, eio, eo} = L2;
  const S2 = G.SOSED2(), K = G.CAT2();
  const amb = (par, op, col) => mk('rect', {x: -100, y: -100, width: 1280, height: 2120, fill: col || '#8E95CC', opacity: op, style: 'mix-blend-mode:multiply'}, par);
  const snowSet = (par, scale, seed) => [
    L2.snow(par, {n: 80, seed: seed + 1, size: [1.4 * scale, 2.6 * scale], speed: [36 * scale, 64 * scale], sway: 9 * scale, opacity: 0.7}),
    L2.snow(par, {n: 36, seed: seed + 2, size: [3.2 * scale, 5 * scale], speed: [80 * scale, 130 * scale], sway: 16 * scale, opacity: 0.85}),
    L2.snow(par, {n: 10, seed: seed + 3, size: [8 * scale, 12 * scale], speed: [170 * scale, 230 * scale], sway: 26 * scale, opacity: 0.45}),
  ];
  const setSnow = (arr, t) => arr.forEach((s) => s.set(TF.ts(t)));
  const rot = (p, a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  // кончик языка (локально от корня героя) для позы q — та же геометрия, что в sosed2.side
  function tipLocal(q) {
    const lean = q.lean || 0, hip = [q.hipX || 0, -410 + (q.hipY || 0)], nk = [hip[0] + rot([2, -380], lean)[0], hip[1] + rot([2, -380], lean)[1]];
    const tilt = (q.tilt || 0) + lean * 0.35, tg = (q.face && q.face.tongue) || 0, p = rot([75 + 24 * tg, -43], tilt);
    return [nk[0] + p[0], nk[1] + p[1]];
  }

  /* ================= s01: макро — труба в инее, уведомление ================= */
  TF.shot({id: 's01', t0: 0, t1: 2.2, build(g, cam) {
    const D = TF.D;
    Y.bokehBg(cam, D, {seed: 3, wallTop: 200, wallR: 1200, ground: 1700, spots: [[170, 520, 130, 1], [880, 360, 96, 1], [300, 1000, 80, 1], [950, 1120, 120, 1], [120, 1380, 90, 0], [760, 760, 64, 1], [470, 300, 70, 0], [990, 700, 50, 1]]});
    this.sn = snowSet(cam, 1.6, 10).slice(0, 2);
    const rd = Y.rod(cam, D, {x: 600, w: 130, y0: -60, y1: 1420, lw: 3.4, band: 40, seed: 7, gap: 16, dots: 5, fs: 1.2});
    // ушко подвеса: хомут с болтом, ниже — край сиденья в снегу
    Y.R(cam, 520, 1380, 160, 64, '#6D768B', Y.C.OUT, 3.4, 10); Y.P(cam, 'M524 1398H676', null, '#9BA4B6', 3, {opacity: 0.8});
    Y.E(cam, 600, 1412, 18, 18, '#4C5468', Y.C.OUT, 3); Y.P(cam, 'M589 1404L611 1420M611 1404L589 1420', null, '#262a38', 2.4);
    Y.P(cam, 'M548 1444H652L640 1560H560Z', '#5D667B', Y.C.OUT, 3.4);
    Y.R(cam, 150, 1560, 980, 110, Y.C.WOOD, Y.C.OUT, 3.4, 10); Y.P(cam, 'M150 1614H1130', null, Y.C.WOOD2, 2.6, {opacity: 0.7});
    Y.P(cam, Y.capS(150, 1130, 1560, 34, 77), Y.C.SNOWHI, Y.C.OUT, 2.8);
    Y.P(cam, Y.capS(520, 680, 1380, 12, 78), Y.C.SNOWHI, Y.C.OUT, 2.4);
    this.near = L2.snow(cam, {n: 9, seed: 19, size: [16, 26], speed: [300, 380], sway: 40, opacity: 0.35});
    L2.glow(cam, D, {x: 1040, y: 260, r: 760, color: '#FFB866', op: 0.55});
    L2.glow(cam, D, {x: 655, y: 760, r: 46, ry: 800, color: '#FFD9A0', op: 0.22});
    amb(g, 0.16);
    this.rd = rd;
  }, update(t, lt) {
    this.cam.setAttribute('transform', TF.camT(kf([[0, 1], [2.2, 1.07]], t), 600, 900));
    setSnow(this.sn, t); this.near.set(TF.ts(t));
  }});
  // уведомление от мамы (подпись кадра)
  TF.inits.push(() => {
    const g = mk('g', {}, TF.U), y0 = 300;
    mk('rect', {x: 70, y: y0 + 8, width: 940, height: 176, rx: 38, fill: '#14111e', opacity: 0.22}, g);
    mk('rect', {x: 70, y: y0, width: 940, height: 176, rx: 38, fill: '#F4F1EC', opacity: 0.97}, g);
    mk('rect', {x: 104, y: y0 + 34, width: 92, height: 92, rx: 22, fill: '#4CC764'}, g);
    mk('path', {d: `M118 ${y0 + 72}q0 -16 26 -16h12q26 0 26 16v6q0 16 -26 16h-14l-14 11v-11.5q-10 -3 -10 -15.5z`, fill: '#fff'}, g); // облачко по центру плитки 104–196
    const tt = (x, y, s, w, c, txt, anchor) => { const n = mk('text', {x, y, 'font-family': 'MS', 'font-size': s, 'font-weight': w, fill: c, 'text-anchor': anchor || 'start'}, g); n.textContent = txt; return n; };
    tt(226, y0 + 72, 40, 700, '#1c1c1e', 'Мама'); tt(976, y0 + 70, 30, 500, '#8a8a8e', 'сейчас', 'end');
    tt(226, y0 + 132, 40, 500, '#1c1c1e', 'На улице −10. Качели не лизать!');
    const C = {g, build() {}, set(k) { g.setAttribute('opacity', clamp(k * 1.5).toFixed(3)); g.setAttribute('transform', `translate(0 ${((1 - eo(clamp(k))) * -120).toFixed(1)})`); }};
    TF.ui.push({c: C, t0: 0.35, t1: 2.18, fin: 0.28, fout: 0.12});
  });
  TF.sound('notif', 0.35, {gain: -8});

  /* ================= s02: общий план двора ================= */
  // шаги: p_k = x0 + k·L + L/2, приземление в t0 + k·T; последний шаг — приставной
  const WK = (() => { const L = 150, v = 380, T = L / v, x0 = -100, t0 = 2.2 - 160 / v, gy = 1660, N = 4, xEnd = 440;
    const plants = []; for (let k = -2; k < N; k++) plants.push({k, x: x0 + k * L + L / 2, t: t0 + k * T, foot: k % 2 === 0 ? 'N' : 'F'});
    const tK = t0 + (N - 1) * T, tStop = tK + 0.85 * T;
    plants.push({k: N, x: xEnd + 18, t: tStop, foot: (N % 2 === 0) ? 'N' : 'F', close: true});
    return {L, v, T, x0, t0, gy, plants, tK, tStop, xEnd}; })();
  function walkAt(t) {
    const {L, v, T, x0, t0, gy, plants, tK, tStop, xEnd} = WK;
    const ta = tK - T / 2, xa = x0 + v * (ta - t0);
    let x;
    if (t <= ta) x = x0 + v * (t - t0);
    else if (t >= tStop) x = xEnd;
    else { const dur = tStop - ta, u = (t - ta) / dur, Dd = xEnd - xa, v0 = v * dur; x = xa + v0 * u + (3 * Dd - 2 * v0) * u * u + (v0 - 2 * Dd) * u * u * u; }
    const feet = {};
    ['N', 'F'].forEach((f) => { const pl = plants.filter((p) => p.foot === f);
      let pos = null;
      for (let i = 0; i < pl.length; i++) { const p = pl[i], prev = pl[i - 1];
        const lift = prev ? (i >= 1 ? (plants.find((q) => q.k === p.k - 1) || {t: p.t - T}).t + 0.06 : p.t - T) : p.t - T;
        if (t >= p.t) pos = [p.x, gy];
        else if (prev && t > lift) { const u = (t - lift) / (p.t - lift), e = eio(u); pos = [lerp(prev.x, p.x, e), gy - 30 * Math.sin(Math.PI * u)]; break; }
        else if (prev) { pos = [prev.x, gy]; break; }
      }
      feet[f] = pos || [pl[0].x, gy]; });
    const moving = t < tStop, ph = (t - t0) / (2 * T);
    const u = (((t - t0) / T) % 1 + 1) % 1, walkK = 1 - ss(tK, tStop, t);
    const hipY = lerp(2, 8 + 34 * Math.pow(Math.cos(Math.PI * u), 2), walkK);
    return {x, feet, hipY, ph, walkK};
  }
  TF.shot({id: 's02', t0: 2.2, t1: 5.0, build(g, cam) {
    const D = TF.D;
    const yard = Y.yardWide(cam, D, {lit: {'1_4': true}});
    const cw = yard.wins.find((w) => w.key === '1_4');
    this.cat = K.sit(cam, {s: 0.26, lw: 2}); this.catAt = [cw.x + 46, cw.y + 102];
    this.prints = mk('path', {fill: '#A3A8C6', opacity: 0.85}, cam);
    this.sw = Y.swing(cam, D, {cx: 600, gy: 1660, s: 233, lw: 2.6});
    this.hero = S2.side(cam, {s: 0.44, lw: 2.8, off: 2});
    this.sn = snowSet(cam, 1, 20);
    amb(cam, 0.2);
    L2.glow(cam, D, {x: yard.lamp[0], y: yard.lamp[1] + 10, r: 600, ry: 640, color: '#FFB866', op: 0.62});
    L2.glow(cam, D, {x: 930, y: 1490, r: 360, ry: 120, color: '#FFC57A', op: 0.5});
    L2.glow(cam, D, {x: yard.door[0], y: yard.door[1] + 20, r: 190, color: '#FFC57A', op: 0.62});
    yard.wins.filter((w) => w.lit).forEach((w) => L2.glow(cam, D, {x: w.x + 46, y: w.y + 52, r: 100, color: '#FFB060', op: 0.34}));
  }, update(t, lt) {
    this.cam.setAttribute('transform', TF.camT(kf([[2.2, 1], [5.0, 1.05]], t), 520, 1320));
    setSnow(this.sn, t);
    const w = walkAt(t), q = {x: w.x, y: WK.gy, hipY: w.hipY};
    const sw = Math.sin(w.ph * 2 * Math.PI) * w.walkK;
    q.legN = {foot: [w.feet.N[0], w.feet.N[1] - 15]}; q.legF = {foot: [w.feet.F[0], w.feet.F[1] - 15]};
    const look = t < 3.95 ? 0 : ss(3.95, 4.25, t);
    q.armN = {sh: lerp(-40, -22, look), el: lerp(-100, -84, look), handA: lerp(-112, -100, look), phoneA: lerp(-10, -4, look)}; q.handN = 'phone';
    q.armF = {sh: 4 + 16 * sw, el: -12 - 8 * Math.max(0, sw)};
    q.tilt = lerp(7, -3, look); q.lean = ss(4.55, 4.95, t) * 4;
    const face = {mouth: t < 3.1 ? 'smile' : t < 4.1 ? 'smirk' : 'flat', look: look > 0.5 ? [1, -0.4] : [0.4, 0.6], brow: ss(4.1, 4.35, t) * 0.5};
    if (t > 4.62 && t < 4.72) face.eye = 'closed';
    q.face = face;
    this.hero.set(q);
    // следы: для шагов, с которых нога уже ушла
    let d = '';
    WK.plants.forEach((p) => { const nxt = WK.plants.find((o) => o.foot === p.foot && o.k > p.k); const lifted = nxt && t > (WK.plants.find((o) => o.k === nxt.k - 1) || {t: 0}).t + 0.06;
      if (lifted && !p.close) { const y = WK.gy + (p.foot === 'N' ? 4 : -6); d += `M${p.x - 22} ${y}a22 7 0 1 0 44 0a22 7 0 1 0 -44 0Z`; } });
    for (let i = 0; i < 4; i++) { const x = -260 + i * 150 + 75, y = WK.gy + (i % 2 ? -6 : 4); d += `M${x - 22} ${y}a22 7 0 1 0 44 0a22 7 0 1 0 -44 0Z`; }
    this.prints.setAttribute('d', d);
    this.cat.set({x: this.catAt[0], y: this.catAt[1], eye: t > 4.4 ? 'open' : 'half', look: [-1, 1], tail: TF.T * 0.4});
  }});
  TF.inits.push(() => {
    TF.bub({text: 'Мам, мне 27.', x: 250, y: 1060, tail: [175, 120], size: 50, at: [175, 120]}, 3.25, 4.15);
    TF.bub({text: '…а правда прилипнет?', kind: 'thought', font: 'CV', size: 64, x: 470, y: 1040, tail: [-20, 150], at: [0, 120]}, 4.05, 5.0);
  });
  WK.plants.filter((p) => p.t > 2.3 && p.t < 3.6).forEach((p) => TF.sound('step', p.t, {gain: p.close ? -15 : -11, foot: p.foot})); // по одному звуку на касание стопы

  /* ================= крупный план сбоку (s03, s08, s11) ================= */
  const ROD_X = 812, ROD_W = 46, CY = 880, HS = 2.4, HY = CY + 890 * 2.4;
  function buildClose(g, cam, self, seed) {
    const D = TF.D;
    Y.bokehBg(cam, D, {seed, wallTop: 160, wallR: 1240, ground: 1560, spots: [[120, 380, 110, 1], [380, 300, 80, 1], [930, 520, 120, 1], [170, 820, 90, 0], [990, 1040, 70, 1], [600, 230, 60, 1], [300, 1250, 100, 1], [80, 1150, 70, 0]]});
    self.sn = snowSet(cam, 1.5, seed).slice(0, 2);
    self.rod = Y.rod(cam, D, {x: ROD_X, w: ROD_W, y0: -60, y1: 2000, lw: 3.2, band: 22, seed: seed + 5, gap: 9, dots: 7});
    self.hero = S2.side(cam, {s: HS, lw: 3.6, off: 3});
    self.bloom = mk('g', {opacity: 0}, cam);
    const bl = mk('path', {fill: 'none', stroke: '#F3F8FF', 'stroke-width': 2.6, 'stroke-linecap': 'round'}, self.bloom);
    let d = ''; [[0, 0, 16], [14, -18, 10], [10, 20, 11], [-8, -26, 8], [-6, 24, 9], [22, 4, 7]].forEach(([x, y, r]) => { for (let a = 0; a < 3; a++) { const an = (a * Math.PI) / 3; d += `M${(x - Math.cos(an) * r).toFixed(1)} ${(y - Math.sin(an) * r).toFixed(1)}L${(x + Math.cos(an) * r).toFixed(1)} ${(y + Math.sin(an) * r).toFixed(1)}`; } });
    bl.setAttribute('d', d);
    self.tipFrost = mk('ellipse', {rx: 12, ry: 16, fill: '#DDEBFA', opacity: 0}, cam);
    self.vap = mk('g', {}, cam);
    const vid = L2.radial(D, [[0, '#ffffff', 0.85], [0.5, '#F4F2FF', 0.45], [1, '#F4F2FF', 0]]);
    self.puffs = []; for (let i = 0; i < 18; i++) self.puffs.push(mk('circle', {r: 0, fill: `url(#${vid})`, opacity: 0}, self.vap));
    self.drop = mk('path', {d: 'M0 -16C6 -6 11 2 11 8A11 11 0 0 1 -11 8C-11 2 -6 -6 0 -16Z', fill: '#BFE0F7', stroke: Y.C.OUT, 'stroke-width': 2.4, opacity: 0}, cam);
    self.sn2 = snowSet(cam, 1.5, seed + 9).slice(2);
    amb(cam, 0.14);
    L2.glow(cam, D, {x: 1080, y: 300, r: 700, color: '#FFB866', op: 0.5});
    L2.glow(cam, D, {x: ROD_X + 10, y: 900, r: 26, ry: 1000, color: '#FFD9A0', op: 0.2});
  }
  // поза крупного плана: gap — зазор кончика языка до трубы (px), tg — язык
  function closePose(self, t, o) {
    const q = {y: HY, lean: o.lean || 0, tilt: o.tilt || 0, face: Object.assign({mouth: o.tg > 0 ? 'tongue' : (o.mouth || 'flat'), tongue: o.tg}, o.face || {}),
      armN: {sh: 8, el: -10}, armF: {sh: -4, el: -10}};
    const tl = tipLocal(q), contactX = ROD_X - ROD_W / 2 + 3;
    q.x = contactX - HS * tl[0] - (o.gap || 0);
    self.hero.set(q);
    return [contactX, HY + HS * tl[1]];
  }
  function closeUpdate(self, t, camZ) {
    self.cam.setAttribute('transform', TF.camT(camZ, 700, 900));
    setSnow(self.sn, t); setSnow(self.sn2, t);
  }

  TF.shot({id: 's03', t0: 5.0, t1: 6.3, build(g, cam) { buildClose(g, cam, this, 40); }, update(t) {
    closeUpdate(this, t, kf([[5.0, 1.0], [6.3, 1.04]], t));
    const tg = kf([[5.2, 0], [5.45, 1]], t), gap = kf([[5.0, 80], [5.45, 0]], t);
    const face = {eye: t < 5.52 ? 'open' : 'wide', brow: kf([[5.0, 0.4], [5.5, 0.4], [5.6, 1.1]], t), worry: ss(5.85, 6.05, t), look: t < 5.5 ? [1, 0] : [0.7, 0.8]};
    const c = closePose(this, t, {tg, gap, lean: 3, tilt: 2, face, mouth: 'flat'});
    const k = ss(5.45, 5.7, t);
    this.bloom.setAttribute('opacity', k.toFixed(3)); this.bloom.setAttribute('transform', `translate(${c[0] + 4} ${c[1]}) scale(${(0.4 + 0.6 * k).toFixed(3)})`);
    this.tipFrost.setAttribute('cx', c[0] - 6); this.tipFrost.setAttribute('cy', c[1] + 2); this.tipFrost.setAttribute('opacity', (0.55 * k).toFixed(3));
  }});
  TF.inits.push(() => { TF.cap({lines: ['Правда.'], x: 540, y: 430, size: 64, font: 'PFX'}, 5.6, 6.3); });

  TF.shot({id: 's08', t0: 15.3, t1: 18.1, build(g, cam) { buildClose(g, cam, this, 60); }, update(t) {
    closeUpdate(this, t, kf([[15.3, 1.04], [18.1, 1.08]], t));
    const face = {eye: (t > 16.7 && t < 16.82) || (t > 17.75 && t < 17.87) ? 'closed' : 'open', worry: 0.9, brow: 0.3, look: t < 16.2 ? [0.6, 0.7] : t < 17.2 ? [-0.4, -0.6] : [0.55, 0.35]};
    const c = closePose(this, t, {tg: 1, gap: 0, lean: 3, tilt: 2, face});
    this.bloom.setAttribute('opacity', 1); this.bloom.setAttribute('transform', `translate(${c[0] + 4} ${c[1]})`);
    this.tipFrost.setAttribute('cx', c[0] - 6); this.tipFrost.setAttribute('cy', c[1] + 2); this.tipFrost.setAttribute('opacity', 0.55);
  }});

  const EX = [24.3, 25.4, 26.5], REL = 27.2;
  TF.shot({id: 's11', t0: 24.1, t1: 28.1, build(g, cam) { buildClose(g, cam, this, 80); }, update(t) {
    closeUpdate(this, t, kf([[24.1, 1.02], [28.1, 1.08]], t));
    const tg = kf([[REL, 1], [REL + 0.22, 0]], t), gap = kf([[REL, 0], [REL + 0.5, 46]], t);
    const exh = EX.some((e) => t > e - 0.05 && t < e + 0.75);
    const face = {eye: t > REL + 0.25 ? 'happy' : exh ? 'closed' : 'open', worry: t > REL + 0.2 ? 0 : 0.5, brow: t > REL + 0.2 ? 0.5 : 0.1, mouth: t > REL + 0.2 ? 'smile' : 'flat', look: [0.6, 0.6]};
    const c0 = [ROD_X - ROD_W / 2 + 3, 0];
    const c = closePose(this, t, {tg, gap, lean: 3, tilt: 2, face});
    const cy = c[1];
    // пар: три выдоха, облачка летят к трубе
    let pi = 0;
    EX.forEach((e, j) => { for (let i = 0; i < 6; i++, pi++) { const p = this.puffs[pi], u = (t - e - i * 0.05) / 1.1;
      if (u <= 0 || u >= 1) { p.setAttribute('opacity', 0); continue; }
      const x = c0[0] - 40 + u * 90 + i * 6, y = cy - 6 - u * (30 + i * 10) + (i % 2 ? 12 : -8), r = 22 + u * (70 + i * 8);
      p.setAttribute('cx', x.toFixed(1)); p.setAttribute('cy', y.toFixed(1)); p.setAttribute('r', r.toFixed(1)); p.setAttribute('opacity', (0.75 * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u * 0.5)).toFixed(3)); } });
    // иней тает кругами с каждым выдохом
    const mk2 = clamp(kf([[24.3, 0], [24.9, 0.35], [25.4, 0.35], [26.0, 0.7], [26.5, 0.7], [27.1, 1]], t));
    this.rod.melt(cy, 60 + 130 * mk2, mk2);
    const bk = 1 - ss(24.5, 26.8, t);
    this.bloom.setAttribute('opacity', (bk * (t < REL ? 1 : 0)).toFixed(3)); this.bloom.setAttribute('transform', `translate(${c0[0] + 4} ${cy})`);
    this.tipFrost.setAttribute('cx', c[0] - 6); this.tipFrost.setAttribute('cy', cy + 2); this.tipFrost.setAttribute('opacity', (0.55 * (1 - ss(24.4, 26.6, t))).toFixed(3));
    // капля: набухает и падает
    const dg = ss(25.9, 26.6, t), fall = t > 26.6 ? Math.pow(t - 26.6, 2) * 2600 : 0;
    this.drop.setAttribute('opacity', (dg * (fall > 900 ? 0 : 1)).toFixed(3));
    this.drop.setAttribute('transform', `translate(${c0[0] + 10} ${cy + 34 + fall}) scale(${(0.4 + 0.6 * dg).toFixed(3)})`);
  }});
  TF.inits.push(() => {
    TF.cap({lines: ['Медленно.', 'Лёд отпустит сам.'], x: 540, y: 380, size: 60}, 24.4, 26.95);
    TF.cap({lines: [[['+500 ауры', {fill: '#2F7A4A'}], [' за спокойствие', {}]]], x: 540, y: 420, size: 56, mcol: '#2F7A4A'}, 27.4, 28.1);
  });
  EX.forEach((e) => TF.sound('breath', e, {gain: -9}));
  TF.sound('release', REL, {gain: -14});
})(window);
