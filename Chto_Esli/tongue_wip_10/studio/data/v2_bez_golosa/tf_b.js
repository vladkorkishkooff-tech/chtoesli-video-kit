/* tf_b.js — s08 градусник (поверх крупного плана), s09–s10 вид из глаз: телефон, поиск, ответ. */
(function (G) {
  const {mk} = G.GEOM2, L2 = G.LOOK2, Y = G.YARD2, TF = G.TF;
  const {kf, ss, win, lerp, clamp, eio, eo} = L2;
  const C = Y.C;
  const T = (par, x, y, s, txt, o = {}) => { const n = mk('text', {x, y, 'font-family': o.font || 'MS', 'font-size': s, 'font-weight': o.w || 600, fill: o.fill || '#1c1c1e', 'text-anchor': o.a || 'start', style: 'font-variant-numeric: lining-nums', opacity: o.op}, par); n.textContent = txt; return n; };

  /* ---------- s08: градусник ---------- */
  TF.inits.push(() => {
    const g = mk('g', {}, TF.U), x0 = 70, y0 = 290, w = 296, h = 900;
    mk('rect', {x: x0 + 4, y: y0 + 10, width: w, height: h, rx: 22, fill: '#14111e', opacity: 0.22}, g);
    mk('rect', {x: x0, y: y0, width: w, height: h, rx: 22, fill: '#F4EFE6', opacity: 0.97}, g);
    const tx = x0 + 96, top = y0 + 120, bot = y0 + 660, Y_ = (tc) => top + (-tc / 30) * (bot - top);
    T(g, x0 + 30, y0 + 66, 42, '°C', {font: 'PF', fill: '#2A2421'});
    const band = mk('rect', {x: x0 + 16, y: Y_(-5), width: w - 32, height: Y_(-15) - Y_(-5), rx: 12, fill: '#E8603A', opacity: 0}, g);
    mk('rect', {x: tx - 17, y: top - 26, width: 34, height: bot - top + 70, rx: 17, fill: '#fff', stroke: '#2a221e', 'stroke-width': 3.4}, g);
    mk('circle', {cx: tx, cy: bot + 76, r: 38, fill: '#fff', stroke: '#2a221e', 'stroke-width': 3.4}, g);
    mk('circle', {cx: tx, cy: bot + 76, r: 28, fill: '#3F7FC4'}, g);
    const merc = mk('rect', {x: tx - 9, width: 18, rx: 9, fill: '#3F7FC4'}, g);
    for (let tc = 0; tc >= -30; tc -= 5) { const y = Y_(tc); mk('path', {d: `M${tx + 22} ${y}H${tx + 46}`, stroke: '#2a221e', 'stroke-width': 3}, g);
      T(g, tx + 58, y + 13, 36, (tc < 0 ? '−' : '') + Math.abs(tc), {w: tc === -5 || tc === -10 || tc === -15 ? 800 : 600, fill: '#2A2421'}); }
    for (let tc = -2.5; tc > -30; tc -= 5) mk('path', {d: `M${tx + 22} ${Y_(tc)}H${tx + 36}`, stroke: '#2a221e', 'stroke-width': 2, opacity: 0.6}, g);
    const mark = mk('g', {opacity: 0}, g);
    mk('path', {d: `M${tx - 26} ${Y_(-10)}L${tx - 52} ${Y_(-10) - 16}V${Y_(-10) + 16}Z`, fill: '#2A2421'}, mark);
    const lab = T(g, x0 + w / 2, y0 + h - 40, 46, 'опаснее всего', {font: 'CV', w: 700, a: 'middle', fill: '#B83A26', op: 0});
    const C2 = {g, build() {}, set(k) { const t = TF.t;
      g.setAttribute('opacity', clamp(k * 1.4).toFixed(3)); g.setAttribute('transform', `translate(${((1 - eo(clamp(k))) * -60).toFixed(1)} 0)`);
      const lv = kf([[15.6, -30], [16.3, -10]], t), yy = Y_(lv); merc.setAttribute('y', yy.toFixed(1)); merc.setAttribute('height', (bot + 50 - yy).toFixed(1));
      const bk = ss(16.3, 16.6, t); band.setAttribute('opacity', (0.32 * bk).toFixed(3)); lab.setAttribute('opacity', bk.toFixed(3));
      mark.setAttribute('opacity', ss(16.6, 16.8, t).toFixed(3)); }};
    TF.ui.push({c: C2, t0: 15.45, t1: 18.05, fin: 0.3, fout: 0.15});
    TF.cap({lines: [[['Хуже всего ', {}], ['не −30', {}], [',', {}]], [['а от ', {}], ['−5 до −15', {mark: true}], ['. Сегодня −10.', {}]]], x: 590, y: 1310, size: 50}, 15.7, 18.05);
  });

  /* ---------- s09–s10: телефон от первого лица ---------- */
  const PX = 236, PY = 330, PW = 608, PH = 1220, SX = PX + 18, SY = PY + 18, SW = PW - 36, SH = PH - 36;
  const sway = (t) => `translate(${(2.4 * Math.sin(1.3 * t) + 1.3 * Math.sin(2.9 * t + 1)).toFixed(2)} ${(2.8 * Math.sin(1.1 * t + 0.5) + 1.1 * Math.sin(3.3 * t)).toFixed(2)}) rotate(${(0.35 * Math.sin(0.9 * t + 0.3)).toFixed(3)} 540 1100)`;
  const TB = [921, 1300], TIP = [250, -48], TIPA = (Math.atan2(TIP[1], TIP[0]) * 180) / Math.PI, TIPL = Math.hypot(TIP[0], TIP[1]);
  const TA = (Math.atan2(1220 - TB[1], 660 - TB[0]) * 180) / Math.PI - TIPA; // при rot=0 кончик пальца над «л/д»
  const thumbT = (rot, ext) => `translate(${TB[0]} ${TB[1]}) rotate(${(TA + rot).toFixed(2)}) scale(${(1 + ext / TIPL).toFixed(4)} 1)`;
  // набор: палец «перепрыгивает» по клавишам (в пределах досягаемости) и нажимает на каждом щелчке
  const KEYS = ['йцукенгшщзх', 'фывапролджэ', 'ячсмитьбю'];
  const keyAt = (ch) => { if (ch === ' ') return [500, 1409]; for (let r = 0; r < 3; r++) { const i = KEYS[r].indexOf(ch); if (i >= 0) return [(r < 2 ? 298.2 : 346.5) + i * 48.36, 1087 + r * 108]; } return [660, 1220]; };
  const poseFor = (p) => { const v = [p[0] - TB[0], p[1] - TB[1]], a = (Math.atan2(v[1], v[0]) * 180) / Math.PI; let rot = a - TA - TIPA; while (rot > 180) rot -= 360; while (rot < -180) rot += 360; return [Math.max(-34, Math.min(30, rot)), Math.max(-34, Math.min(24, Math.hypot(v[0], v[1]) - TIPL))]; };
  const NEU = [660, 1220], TYPED = 'язык прилип к кач';
  const TGT = [...TYPED].map((ch) => { const k = keyAt(ch); return [NEU[0] + (k[0] - NEU[0]) * 0.55, NEU[1] + (k[1] - NEU[1]) * 0.55]; });
  function typingThumb(t) {
    const t0 = 18.3, dt = 1 / 17;
    if (t < t0 - 0.15) return poseFor(NEU);
    const i = Math.floor((t - t0) / dt);
    if (i >= TGT.length) { // после набора: палец возвращается, затем нажимает «Найти» (20.8)
      const back = eio(clamp((t - (t0 + TGT.length * dt)) / 0.25)), last = poseFor(TGT[TGT.length - 1]), neu = poseFor(NEU), go = poseFor([735, 1409]);
      const k = ss(20.55, 20.75, t) * (1 - ss(20.9, 21.05, t));
      const p0 = [lerp(last[0], neu[0], back), lerp(last[1], neu[1], back)];
      const press = Math.exp(-(((t - 20.8) / 0.035) ** 2)) * -10;
      return [lerp(p0[0], go[0], k), lerp(p0[1], go[1], k) + press];
    }
    const a = poseFor(i < 0 ? NEU : TGT[i]), b = poseFor(TGT[Math.max(0, Math.min(TGT.length - 1, i + 1))]), u = i < 0 ? 0 : eio(clamp(((t - t0) / dt - i - 0.35) / 0.65));
    const press = Math.exp(-(((t - t0 - Math.max(0, i) * dt) / 0.018) ** 2)) * -9;
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + press];
  }
  function buildPOV(g, cam, self, seed) {
    const D = TF.D;
    Y.bokehBg(cam, D, {seed, wallTop: 120, wallR: 1240, ground: 1640, spots: [[160, 300, 120, 1], [900, 260, 100, 1], [980, 900, 130, 1], [110, 1100, 90, 0], [700, 1700, 110, 1], [250, 1600, 80, 1], [560, 150, 70, 0]]});
    // труба у самого лица — слева, не в фокусе
    const rg = L2.linear(D, [[0, '#3B4257', 0.0], [0.15, '#4A5268', 0.9], [0.6, '#8D96A8', 0.92], [0.85, '#C9B697', 0.9], [1, '#4A5268', 0]], 0, 0, 1, 0);
    Y.R(cam, -40, -100, 190, 2120, `url(#${rg})`);
    self.sn = [L2.snow(cam, {n: 50, seed: seed + 1, size: [2.4, 4], speed: [60, 100], sway: 14, opacity: 0.7})];
    // телефон
    const hold = mk('g', {}, cam); self.hold = hold; // телефон и рука чуть «плывут» — держит в руке
    const ph = mk('g', {}, hold); self.ph = ph;
    mk('rect', {x: PX + 6, y: PY + 16, width: PW, height: PH, rx: 76, fill: '#0d0b14', opacity: 0.35}, ph);
    mk('rect', {x: PX, y: PY, width: PW, height: PH, rx: 76, fill: '#22232C', stroke: C.OUT, 'stroke-width': 3.4}, ph);
    mk('rect', {x: PX + PW - 2, y: PY + 250, width: 8, height: 120, rx: 3, fill: '#2b2c36', stroke: C.OUT, 'stroke-width': 2}, ph);
    const scr = mk('g', {}, ph); self.scr = scr;
    const cid = 'scrClip' + seed; const cp = mk('clipPath', {id: cid}, D); mk('rect', {x: SX, y: SY, width: SW, height: SH, rx: 58}, cp);
    scr.setAttribute('clip-path', `url(#${cid})`);
    mk('rect', {x: SX, y: SY, width: SW, height: SH, fill: '#F6F4EF'}, scr);
    mk('rect', {x: SX + SW / 2 - 70, y: SY + 18, width: 140, height: 38, rx: 19, fill: '#0f0f14'}, scr);
    T(scr, SX + 58, SY + 52, 30, '18:42', {w: 700});
    mk('path', {d: `M${SX + SW - 150} ${SY + 50}h8v-8h-8zM${SX + SW - 136} ${SY + 50}h8v-14h-8zM${SX + SW - 122} ${SY + 50}h8v-20h-8z`, fill: '#1c1c1e'}, scr);
    mk('rect', {x: SX + SW - 100, y: SY + 28, width: 48, height: 24, rx: 6, fill: 'none', stroke: '#1c1c1e', 'stroke-width': 2.4}, scr);
    mk('rect', {x: SX + SW - 96, y: SY + 32, width: 22, height: 16, rx: 3, fill: '#D9534F'}, scr);
    // рука (правая, от первого лица): ладонь за телефоном — видны кончики пальцев у левого края и основание ладони
    // справа-снизу; большой палец лежит на экране. Всё, что за телефоном, рисуется ДО телефона и им перекрывается.
    const SK = '#EEC4A2', SK2 = '#DDAA88', OUT = '#211c1a', CR = '#B98468';
    const back = mk('g', {}); hold.insertBefore(back, ph);
    const sm = G.GEOM2.smooth;
    [[1004, 40, 188, -4], [1090, 42, 180, 0], [1174, 39, 188, 4], [1252, 33, 200, 9]].forEach(([y, h, tx, a]) => { // указательный … мизинец
      const fg = mk('g', {transform: `rotate(${a} ${PX} ${y})`}, back);
      Y.P(fg, sm([[tx, y], [tx + 8, y - h * 0.78], [tx + 34, y - h], [PX + 90, y - h], [PX + 90, y + h], [tx + 34, y + h], [tx + 8, y + h * 0.78]], true, [3, 4]), SK, OUT, 3.2);
      Y.P(fg, `M${tx + 14} ${y + h * 0.62}Q${tx + 30} ${y + h * 0.86} ${PX + 4} ${y + h * 0.8}`, null, SK2, 5, {opacity: 0.7, 'stroke-linecap': 'round'});
    });
    // ладонь и запястье (за телефоном): виден бугор у большого пальца справа и пятка ладони под телефоном
    const PALM = sm([[300, 1000], [760, 1070], [858, 1170], [906, 1262], [948, 1360], [972, 1470], [1000, 1580], [1160, 1800], [1160, 2100], [760, 2100], [800, 1760], [720, 1640], [560, 1500], [300, 1320]], true, [8, 9]);
    Y.P(back, PALM, SK, OUT, 3.4);
    Y.P(back, `M${PX + PW + 4} 1470Q${PX + PW + 70} 1500 ${PX + PW + 110} 1560`, null, CR, 3, {opacity: 0.8, 'stroke-linecap': 'round'}); // складка у основания большого пальца
    // рукав худи с манжетой
    const W0 = [905, 1650], du = [0.5, 0.866], dn = [0.866, -0.5], at = (a, b) => [W0[0] + du[0] * a + dn[0] * b, W0[1] + du[1] * a + dn[1] * b];
    const quad = (a0, w0, a1, w1) => [at(a0, -w0), at(a0, w0), at(a1, w1), at(a1, -w1)].map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L');
    Y.P(back, 'M' + quad(95, 210, 700, 260) + 'Z', '#C9612C', OUT, 3.4);
    let hatch = ''; for (let i = 0; i < 8; i++) { const a = at(150 + i * 4, -150 + i * 44), b = at(560, -170 + i * 50); hatch += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
    Y.P(back, hatch, null, '#7a3314', 1.6, {opacity: 0.55});
    Y.P(back, 'M' + quad(30, 186, 104, 200) + 'Z', '#B5552A', OUT, 3.4);
    let rib = ''; for (let i = -5; i <= 5; i++) { const a = at(38, i * 31), b = at(98, i * 33); rib += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
    Y.P(back, rib, null, '#8F3D19', 2, {opacity: 0.6});
    // большой палец — поверх экрана; основание в «перепонке» на контуре ладони (TB), палец обрезается по ладони и телефону
    const cpId = 'thClip' + seed, cpT = mk('clipPath', {id: cpId}, D);
    mk('rect', {x: PX - 60, y: PY - 60, width: PW + 60, height: PH + 120}, cpT); mk('path', {d: PALM}, cpT);
    const thumbWrap = mk('g', {'clip-path': `url(#${cpId})`}, hold), thumb = mk('g', {}, thumbWrap); self.thumb = thumb;
    const tl = [[0, 0], [60, -4], [130, -8], [190, -11], [230, -17], [254, -32], [262, -50], [254, -68], [232, -80], [190, -85], [140, -88], [90, -95], [40, -108], [0, -124], [-60, -150], [-90, -60], [-60, 20]];
    Y.P(thumb, sm(tl, true, [0, 13]), SK, null, 0);
    Y.P(thumb, sm(tl.slice(0, 14), false), null, OUT, 3.4);
    Y.P(thumb, sm([[198, -24], [238, -28], [248, -48], [240, -70], [200, -74], [188, -49]], true), '#F7DCCB', CR, 2.4); // ноготь
    Y.P(thumb, 'M230 -38Q243 -48 236 -62', null, '#fff', 2.6, {opacity: 0.7, 'stroke-linecap': 'round'});
    Y.P(thumb, 'M152 -86Q146 -72 154 -60', null, CR, 2.6, {'stroke-linecap': 'round'}); // сгиб
    Y.P(thumb, 'M30 -100Q80 -80 130 -82', null, SK2, 6, {opacity: 0.5, 'stroke-linecap': 'round'}); // тень на подушечке
    mk('rect', {x: -100, y: -100, width: 1280, height: 2120, fill: '#8E95CC', opacity: 0.12, style: 'mix-blend-mode:multiply'}, cam);
    L2.glow(cam, D, {x: 540, y: 900, r: 520, ry: 700, color: '#DCEBFF', op: 0.18});
    L2.glow(cam, D, {x: 1080, y: 200, r: 600, color: '#FFB866', op: 0.4});
  }
  const ROW = (par, y, txt, bold) => { const gg = mk('g', {}, par);
    mk('circle', {cx: SX + 62, cy: y - 12, r: 13, fill: 'none', stroke: '#8a8a8e', 'stroke-width': 3.4}, gg); mk('path', {d: `M${SX + 72} ${y - 2}l12 12`, stroke: '#8a8a8e', 'stroke-width': 3.6, 'stroke-linecap': 'round'}, gg);
    const n = mk('text', {x: SX + 104, y, 'font-family': 'MS', 'font-size': 35, fill: '#1c1c1e'}, gg);
    const a = mk('tspan', {'font-weight': 500, fill: '#6b6b70'}, n); a.textContent = '…'; const b = mk('tspan', {'font-weight': 700}, n); b.textContent = txt;
    mk('path', {d: `M${SX + 40} ${y + 40}H${SX + SW - 40}`, stroke: '#E2E0DA', 'stroke-width': 2}, gg); return gg; };
  TF.shot({id: 's09', t0: 18.1, t1: 21.1, build(g, cam) {
    buildPOV(g, cam, this, 90);
    const s = this.scr;
    mk('rect', {x: SX + 30, y: SY + 120, width: SW - 60, height: 96, rx: 48, fill: '#fff', stroke: '#D6D3CC', 'stroke-width': 2.4}, s);
    mk('circle', {cx: SX + 84, cy: SY + 162, r: 15, fill: 'none', stroke: '#6b6b70', 'stroke-width': 3.6}, s); mk('path', {d: `M${SX + 95} ${SY + 173}l13 13`, stroke: '#6b6b70', 'stroke-width': 4, 'stroke-linecap': 'round'}, s);
    this.typed = T(s, SX + 122, SY + 181, 38, '', {w: 500});
    this.caret = mk('rect', {width: 3.4, height: 46, fill: '#2F6FEB'}, s);
    this.rows = mk('g', {}, s);
    this.r1 = ROW(this.rows, SY + 330, 'к качелям что делать'); this.r2 = ROW(this.rows, SY + 440, 'в 27 лет'); this.r3 = ROW(this.rows, SY + 550, 'как не говорить маме');
    this.hl = mk('rect', {x: SX + 20, y: SY + 268, width: SW - 40, height: 96, rx: 20, fill: '#2F6FEB', opacity: 0}, s); s.insertBefore(this.hl, this.rows);
    // клавиатура
    const kb = mk('g', {}, s); mk('rect', {x: SX, y: SY + SH - 520, width: SW, height: 520, fill: '#D7D5DD'}, kb);
    const keys = ['йцукенгшщзх', 'фывапролджэ', 'ячсмитьбю'];
    keys.forEach((row, ri) => { const n = row.length, kw = (SW - 40) / 11, x0 = SX + 20 + ((11 - n) * kw) / 2; [...row].forEach((ch, i) => { const x = x0 + i * kw, y = SY + SH - 490 + ri * 108;
      mk('rect', {x: x + 4, y, width: kw - 8, height: 90, rx: 10, fill: '#fff'}, kb); T(kb, x + kw / 2, y + 60, 34, ch, {a: 'middle', w: 500}); }); });
    mk('rect', {x: SX + 20, y: SY + SH - 166, width: 92, height: 86, rx: 10, fill: '#ADB1BC'}, kb); T(kb, SX + 66, SY + SH - 110, 28, '123', {a: 'middle', w: 600});
    mk('rect', {x: SX + 122, y: SY + SH - 166, width: 260, height: 86, rx: 10, fill: '#fff'}, kb);
    mk('rect', {x: SX + 392, y: SY + SH - 166, width: SW - 412, height: 86, rx: 10, fill: '#2F6FEB'}, kb); T(kb, SX + 392 + (SW - 412) / 2, SY + SH - 110, 30, 'Найти', {a: 'middle', w: 700, fill: '#fff'});
    this.kb = kb;
  }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[18.1, 1.0], [21.1, 1.04]], t), 540, 900));
    this.sn.forEach((s) => s.set(TF.ts(t))); this.hold.setAttribute('transform', sway(t));
    const full = 'язык прилип к кач', n = Math.max(0, Math.min(full.length, Math.floor(((t - 18.3) / 1.0) * full.length)));
    this.typed.textContent = full.slice(0, n);
    const w = n ? this.typed.getComputedTextLength() : 0;
    this.caret.setAttribute('x', (SX + 124 + w).toFixed(1)); this.caret.setAttribute('y', SY + 140); this.caret.setAttribute('opacity', (Math.floor(t * 2.4) % 2 === 0 || (t > 18.3 && t < 19.35)) ? 1 : 0);
    [this.r1, this.r2, this.r3].forEach((r, i) => { const k = ss(19.4 + i * 0.12, 19.6 + i * 0.12, t); r.setAttribute('opacity', k.toFixed(3)); r.setAttribute('transform', `translate(0 ${((1 - k) * 14).toFixed(1)})`); });
    this.hl.setAttribute('opacity', (0.14 * ss(20.75, 20.85, t)).toFixed(3));
    const tp = typingThumb(t); this.thumb.setAttribute('transform', thumbT(tp[0], tp[1]));
  }});
  TF.sound('typing', 18.3, {dur: 1.05, gain: -12});

  TF.shot({id: 's10', t0: 21.1, t1: 24.1, build(g, cam) {
    buildPOV(g, cam, this, 100);
    const s = this.scr;
    mk('rect', {x: SX + 30, y: SY + 120, width: SW - 60, height: 96, rx: 48, fill: '#fff', stroke: '#D6D3CC', 'stroke-width': 2.4}, s);
    T(s, SX + 84, SY + 180, 34, 'язык прилип к качелям…', {w: 500, fill: '#3a3a3e'});
    const card = (y, h) => { const gg = mk('g', {}, s); mk('rect', {x: SX + 26, y: y + 6, width: SW - 52, height: h, rx: 30, fill: '#000', opacity: 0.06}, gg); mk('rect', {x: SX + 26, y, width: SW - 52, height: h, rx: 30, fill: '#fff', stroke: '#E2E0DA', 'stroke-width': 2}, gg); return gg; };
    this.c1 = card(SY + 260, 430); this.c2 = card(SY + 730, 330);
    T(this.c1, SX + 60, SY + 318, 28, 'ПЕРВАЯ ПОМОЩЬ', {w: 700, fill: '#8a8a8e'});
    T(this.c1, SX + 60, SY + 396, 50, 'Полей тёплой', {w: 800}); T(this.c1, SX + 60, SY + 458, 50, 'водой.', {w: 800});
    T(this.c1, SX + 60, SY + 560, 50, 'Не кипятком!', {w: 800, fill: '#C2412D'});
    // значок: стакан с тёплой водой
    const ic = mk('g', {transform: `translate(${SX + SW - 96} ${SY + 336}) scale(0.72)`}, this.c1);
    mk('path', {d: 'M-34 -40H34L26 54H-26Z', fill: '#D8ECFA', stroke: '#2a221e', 'stroke-width': 3.4, 'stroke-linejoin': 'round'}, ic);
    mk('path', {d: 'M-30 -6H30L26 54H-26Z', fill: '#8FC3EA'}, ic); mk('path', {d: 'M-34 -40H34L26 54H-26Z', fill: 'none', stroke: '#2a221e', 'stroke-width': 3.4, 'stroke-linejoin': 'round'}, ic);
    mk('path', {d: 'M-14 -56q-8 -12 0 -24q8 -12 0 -24M10 -56q-8 -12 0 -24q8 -12 0 -24', fill: 'none', stroke: '#E0622C', 'stroke-width': 4, 'stroke-linecap': 'round'}, ic);
    T(this.c2, SX + 60, SY + 788, 28, 'ЕСЛИ ВОДЫ НЕТ', {w: 700, fill: '#8a8a8e'});
    T(this.c2, SX + 60, SY + 866, 48, 'Подыши', {w: 800}); T(this.c2, SX + 60, SY + 928, 48, 'на металл.', {w: 800});
    const ic2 = mk('g', {transform: `translate(${SX + SW - 190} ${SY + 806}) scale(0.72)`}, this.c2);
    mk('path', {d: 'M-40 10q-18 0 -18 -18t18 -18q4 -22 28 -22q20 0 28 16q24 -4 30 18q16 4 14 20q-2 16 -20 16H-40Z', fill: '#EEF3FA', stroke: '#2a221e', 'stroke-width': 3.4}, ic2);
    mk('path', {d: 'M-70 40h50M-60 58h70', stroke: '#2a221e', 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: 0.6}, ic2);
  }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[21.1, 1.02], [24.1, 1.07]], t), 540, 820));
    this.sn.forEach((s) => s.set(TF.ts(t))); this.hold.setAttribute('transform', sway(t));
    const k1 = ss(21.15, 21.4, t), k2 = ss(22.5, 22.75, t);
    this.thumb.setAttribute('transform', thumbT(-14 * eio(clamp((t - 21.1) / 0.3)), 0)); // палец уходит вниз — не закрывает текст и значок
    this.c1.setAttribute('opacity', k1.toFixed(3)); this.c1.setAttribute('transform', `translate(0 ${((1 - k1) * 24).toFixed(1)})`);
    this.c2.setAttribute('opacity', k2.toFixed(3)); this.c2.setAttribute('transform', `translate(0 ${((1 - k2) * 24).toFixed(1)})`);
  }});
  TF.sound('tap', 20.8, {gain: -14});
})(window);
