/* yard2.js — декорации «Свет» для шортса про язык и качели: вечерний двор (панельный дом, подъезд, баки,
 * качели с жёсткими подвесами, горка, снеговик, лавочка, фонарь), крупные планы трубы в инее, окно с котом,
 * комната из cold open. Всё рисуется один раз; динамика — через возвращаемые объекты.
 */
(function (G) {
  const {mk, smooth} = G.GEOM2, {rng, lerp, clamp, radial, linear, glow} = G.LOOK2;
  const C = {
    OUT: '#1F1C29', SKY0: '#20244A', SKY1: '#353866', SKY2: '#585684', MOON: '#F1EAD6',
    FAR: '#3A3D63', FAR2: '#33365A', PANEL: '#666A8D', PANEL2: '#5D6185', SEAM: '#4C5073', BASE: '#4E5070',
    WLIT: '#F4BE6E', WLIT2: '#E39550', WCUR: '#D98A4A', WDARK: '#2F3351', WDARK2: '#3A3F5E', WFR: '#3B3446',
    SNOW: '#CFD2E5', SNOW2: '#B4B8D2', SNOW3: '#9EA3C2', SNOWHI: '#E7E9F4',
    PAINT: '#3E7389', PAINT2: '#2E5A6D', ROD: '#8D96AA', WOOD: '#9A6A4B', WOOD2: '#7B5137',
    POLE: '#3A3F56', LAMP: '#FFD996', BIN: '#3D6B5B', BIN2: '#2E5246', DOOR: '#6E4E40', DOOR2: '#5A3E33', CANOPY: '#585C78',
    SLIDE: '#C2553A', SLIDE2: '#E0A23A', BENCH: '#7A5A44', CARROT: '#E07A2E', BUCKET: '#5C6F96',
  };
  const P = (par, d, fill, stroke, lw, ex) => mk('path', Object.assign({d, fill: fill || 'none', stroke: stroke || 'none', 'stroke-width': lw || 0, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}, ex || {}), par);
  const R = (par, x, y, w, h, fill, stroke, lw, rx, ex) => mk('rect', Object.assign({x, y, width: w, height: h, fill: fill || 'none', stroke: stroke || 'none', 'stroke-width': lw || 0, rx: rx || 0}, ex || {}), par);
  const E = (par, cx, cy, rx, ry, fill, stroke, lw, ex) => mk('ellipse', Object.assign({cx, cy, rx, ry, fill: fill || 'none', stroke: stroke || 'none', 'stroke-width': lw || 0}, ex || {}), par);
  const circ = (x, y, r) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`;
  // снежная шапка над отрезком (x0..x1) на высоте y: волнистый верх
  const cap = (x0, x1, y, h, seed) => { const r = rng(seed || 3); let d = `M${x0 - 2} ${y + 2}`; const n = Math.max(2, Math.round((x1 - x0) / 26));
    for (let i = 0; i <= n; i++) { const x = lerp(x0 - 2, x1 + 2, i / n), yy = y - h * (0.55 + 0.45 * Math.sin((i / n) * Math.PI)) - r() * h * 0.3; d += (i ? 'L' : 'L') + x.toFixed(1) + ' ' + yy.toFixed(1); }
    return d + `L${x1 + 2} ${y + 2}Z`; };
  const capS = (x0, x1, y, h, seed) => { const r = rng(seed || 3), n = Math.max(2, Math.round((x1 - x0) / 30)), pts = [[x0 - 3, y + 3]];
    for (let i = 0; i <= n; i++) pts.push([lerp(x0 - 3, x1 + 3, i / n), y - h * (0.45 + 0.55 * Math.sin((i / n) * Math.PI)) - r() * h * 0.25]);
    pts.push([x1 + 3, y + 3]); return smooth(pts, true, [0, pts.length - 1], 0.9); };

  /* окно дома: lit — тёплое, иначе тёмное; cur — шторы */
  function win(par, x, y, w, h, lit, lw, defs, o = {}) {
    const g = mk('g', {}, par);
    if (lit) { const id = o.grad || (win.__g = win.__g || radial(defs, [[0, '#FFE2A6'], [0.55, C.WLIT], [1, C.WLIT2]]));
      R(g, x, y, w, h, `url(#${id})`);
      if (o.cur !== false) { P(g, `M${x} ${y}L${x + w * 0.22} ${y}Q${x + w * 0.16} ${y + h * 0.5} ${x + w * 0.24} ${y + h}L${x} ${y + h}Z`, C.WCUR, null, 0, {opacity: 0.85});
        P(g, `M${x + w} ${y}L${x + w * 0.8} ${y}Q${x + w * 0.86} ${y + h * 0.5} ${x + w * 0.78} ${y + h}L${x + w} ${y + h}Z`, C.WCUR, null, 0, {opacity: 0.85}); } }
    else { R(g, x, y, w, h, C.WDARK); P(g, `M${x + w * 0.15} ${y + h}L${x + w * 0.62} ${y}L${x + w * 0.8} ${y}L${x + w * 0.33} ${y + h}Z`, '#ffffff', null, 0, {opacity: 0.05}); }
    P(g, `M${x + w * 0.5} ${y}V${y + h}M${x} ${y + h * 0.36}H${x + w * 0.5}`, null, lit ? '#7a4a2c' : C.WFR, lw * 0.8, {opacity: lit ? 0.7 : 0.9});
    R(g, x, y, w, h, null, C.OUT, lw);
    R(g, x - 4, y + h, w + 8, 6, C.SNOWHI, C.OUT, lw * 0.7);
    return g;
  }

  /* ---------------- двор: общий план ---------------- */
  function yardWide(par, defs, o = {}) {
    const lw = o.lw || 2.6, g = mk('g', {}, par), r = rng(11);
    const sky = linear(defs, [[0, C.SKY0], [0.6, C.SKY1], [1, C.SKY2]]);
    R(g, -60, -60, 1200, 1160, `url(#${sky})`);
    // луна и дальние дома
    E(g, 905, 215, 36, 36, C.MOON, null, 0); glow(g, defs, {x: 905, y: 215, r: 170, color: '#C9C7F0', op: 0.35});
    const fx = [[790, 470, 120], [905, 540, 90], [990, 430, 130]];
    fx.forEach(([x, top, w], i) => { R(g, x, top, w, 1000 - top, i % 2 ? C.FAR2 : C.FAR, C.OUT, lw * 0.6);
      for (let yy = top + 28; yy < 960; yy += 46) for (let xx = x + 14; xx < x + w - 16; xx += 30) if (r() < 0.32) R(g, xx, yy, 13, 18, C.WLIT, null, 0, 0, {opacity: 0.85}); });
    // дом
    const X0 = -40, X1 = 800, TOP = 214, BASE = 1004, FH = (BASE - TOP - 18) / 5;
    R(g, X0, TOP, X1 - X0, BASE - TOP, C.PANEL, C.OUT, lw);
    for (let i = 0; i < 6; i++) R(g, X0 + i * 140, TOP + 18, 140, BASE - TOP - 18, i % 2 ? C.PANEL2 : C.PANEL, null, 0, 0, {opacity: 0.9});
    let seams = ''; for (let f = 0; f <= 5; f++) seams += `M${X0} ${(TOP + 18 + f * FH).toFixed(1)}H${X1}`; for (let i = 1; i < 6; i++) seams += `M${X0 + i * 140} ${TOP + 18}V${BASE}`;
    P(g, seams, null, C.SEAM, lw * 0.6, {opacity: 0.9});
    R(g, X0 - 10, TOP - 4, X1 - X0 + 20, 22, C.BASE, C.OUT, lw); P(g, capS(X0 - 10, X1 + 10, TOP - 4, 12, 4), C.SNOWHI, C.OUT, lw * 0.6);
    P(g, `M640 ${TOP - 4}V${TOP - 70}M622 ${TOP - 52}H658M628 ${TOP - 36}H652`, null, C.OUT, lw);   // антенна
    // окна: колонки, этажи; подъезд — колонка 2
    const cols = [16, 156, 296, 436, 576, 716], lit = o.lit || {};
    const wins = [];
    for (let f = 0; f < 5; f++) for (let c = 0; c < 6; c++) {
      if (c === 2) continue;
      const x = cols[c] + 22, y = TOP + 18 + (4 - f) * FH + 26, key = `${f}_${c}`;
      const isLit = key in lit ? lit[key] : r() < 0.55;
      if (f === 0 && c < 2) continue;              // за баками — без окон первого этажа слева
      wins.push({x, y, w: 92, h: 104, lit: isLit, key}); win(g, x, y, 92, 104, isLit, lw, defs);
    }
    // лестничные окна над подъездом
    for (let f = 1; f < 5; f++) win(g, cols[2] + 40, TOP + 18 + (4 - f) * FH + 70, 56, 76, f % 2 === 1, lw, defs, {cur: false});
    // подъезд
    const dx = cols[2] + 28, dy = BASE - 132;
    R(g, dx, dy, 84, 132, C.DOOR, C.OUT, lw); R(g, dx + 8, dy + 10, 30, 50, C.DOOR2, C.OUT, lw * 0.6); R(g, dx + 46, dy + 10, 30, 50, C.DOOR2, C.OUT, lw * 0.6);
    E(g, dx + 70, dy + 74, 4, 4, '#D9C08A', C.OUT, lw * 0.5);
    R(g, dx - 26, dy - 22, 136, 16, C.CANOPY, C.OUT, lw); P(g, capS(dx - 26, dx + 110, dy - 22, 14, 9), C.SNOWHI, C.OUT, lw * 0.7);
    let ic = ''; for (let i = 0; i < 7; i++) { const x = dx - 18 + i * 19, h = 8 + ((i * 37) % 14); ic += `M${x} ${dy - 6}L${x + 4} ${dy - 6 + h}L${x + 8} ${dy - 6}`; }
    P(g, ic, '#E6F0FA', C.OUT, lw * 0.5);
    E(g, dx + 42, dy - 2, 10, 6, '#FFE7B0', C.OUT, lw * 0.6);
    // баки
    [[22, 0], [128, 1]].forEach(([x, k]) => { R(g, x, BASE - 74, 96, 74, k ? C.BIN2 : C.BIN, C.OUT, lw, 4); R(g, x - 4, BASE - 84, 104, 14, k ? C.BIN : C.BIN2, C.OUT, lw, 3);
      P(g, capS(x - 4, x + 100, BASE - 84, 12, 20 + k), C.SNOWHI, C.OUT, lw * 0.6); P(g, `M${x + 20} ${BASE - 60}V${BASE - 12}M${x + 48} ${BASE - 60}V${BASE - 12}M${x + 76} ${BASE - 60}V${BASE - 12}`, null, C.OUT, lw * 0.5, {opacity: 0.5}); });
    // земля
    const gr = linear(defs, [[0, '#ABAFCB'], [0.25, C.SNOW], [1, '#DADCEB']]);
    R(g, -60, BASE - 2, 1200, 1000, `url(#${gr})`);
    P(g, `M-60 ${BASE}H1140`, null, C.OUT, lw * 0.7, {opacity: 0.8});
    P(g, capS(-60, 1140, BASE + 6, 16, 31), '#C3C6DC', null, 0);
    // тропинка к подъезду и вдоль двора
    P(g, `M${dx + 20} ${BASE}Q${dx - 10} 1200 140 1500Q40 1640 -60 1720L-60 1800Q120 1720 260 1650Q400 1600 620 1640L640 1690Q400 1660 250 1720Q100 1790 -60 1860Z`, '#BCC0D8', null, 0, {opacity: 0.85});
    let fp = ''; for (let i = 0; i < 11; i++) { const x = -40 + i * 56, y = 1700 - i * 6 + (i % 2) * 18; fp += circ(x, y, 9); } P(g, fp, '#A9AECB', null, 0, {opacity: 0.8});
    // лавочка у подъезда
    const bx = 470, by = 1080; P(g, `M${bx} ${by}h150M${bx + 6} ${by}v38M${bx + 144} ${by}v38`, null, C.OUT, lw * 1.0);
    R(g, bx - 6, by - 12, 162, 12, C.BENCH, C.OUT, lw); R(g, bx - 6, by - 40, 162, 10, C.BENCH, C.OUT, lw); P(g, capS(bx - 6, bx + 156, by - 12, 8, 41), C.SNOWHI, C.OUT, lw * 0.6);
    // горка слева
    const sx = 60, sy = 1290;
    P(g, `M${sx} ${sy}V${sy - 170}M${sx + 50} ${sy}V${sy - 170}`, null, C.SLIDE2, 9, {}); P(g, `M${sx} ${sy}V${sy - 170}M${sx + 50} ${sy}V${sy - 170}`, null, C.OUT, lw);
    let rungs = ''; for (let i = 1; i < 6; i++) rungs += `M${sx} ${sy - i * 30}H${sx + 50}`; P(g, rungs, null, C.OUT, lw * 0.9);
    R(g, sx - 6, sy - 182, 62, 14, C.SLIDE, C.OUT, lw, 3);
    P(g, `M${sx + 50} ${sy - 176}Q${sx + 120} ${sy - 150} ${sx + 160} ${sy - 30}L${sx + 210} ${sy}L${sx + 214} ${sy - 18}L${sx + 176} ${sy - 44}Q${sx + 138} ${sy - 160} ${sx + 54} ${sy - 192}Z`, C.SLIDE, C.OUT, lw);
    P(g, capS(sx - 6, sx + 56, sy - 182, 8, 51), C.SNOWHI, C.OUT, lw * 0.6);
    // снеговик справа за качелями
    const nx = 905, ny = 1330;
    E(g, nx, ny - 48, 62, 52, C.SNOWHI, C.OUT, lw); E(g, nx, ny - 130, 44, 38, C.SNOWHI, C.OUT, lw); E(g, nx, ny - 196, 32, 30, C.SNOWHI, C.OUT, lw);
    P(g, `M${nx - 26} ${ny - 222}L${nx - 20} ${ny - 252}L${nx + 24} ${ny - 252}L${nx + 30} ${ny - 222}Z`, C.BUCKET, C.OUT, lw);
    P(g, `M${nx + 4} ${ny - 192}L${nx + 46} ${ny - 186}L${nx + 4} ${ny - 182}Z`, C.CARROT, C.OUT, lw * 0.7);
    P(g, `${circ(nx - 12, ny - 204, 3.5)}${circ(nx + 12, ny - 204, 3.5)}${circ(nx, ny - 140, 4)}${circ(nx, ny - 116, 4)}`, C.OUT);
    P(g, `M${nx - 40} ${ny - 132}L${nx - 92} ${ny - 168}M${nx - 74} ${ny - 156}L${nx - 82} ${ny - 178}M${nx + 40} ${ny - 132}L${nx + 88} ${ny - 160}`, null, '#5a4434', lw * 1.1);
    E(g, nx, ny - 4, 76, 10, C.SNOW2, null, 0, {opacity: 0.7});
    // фонарь справа
    const lx = 1000, ly = 1470;
    P(g, `M${lx} ${ly}V600Q${lx} 560 ${lx - 40} 560L${lx - 92} 560`, null, C.POLE, 12); P(g, `M${lx} ${ly}V600Q${lx} 560 ${lx - 40} 560L${lx - 92} 560`, null, C.OUT, lw * 0.9, {opacity: 0.8});
    P(g, `M${lx - 130} 556Q${lx - 102} 536 ${lx - 74} 556L${lx - 80} 572L${lx - 124} 572Z`, C.POLE, C.OUT, lw);
    E(g, lx - 102, 576, 20, 7, C.LAMP, C.OUT, lw * 0.6);
    R(g, lx - 14, ly - 40, 28, 40, C.POLE, C.OUT, lw);
    E(g, lx - 30, ly + 4, 120, 16, C.SNOW2, null, 0, {opacity: 0.6});
    return {g, wins, BASE, cols, TOP, FH, lamp: [lx - 102, 582], door: [dx + 42, dy - 2]};
  }

  /* ---------------- качели (вид спереди) ---------------- */
  // cx — центр, gy — земля, s — пикселей на метр. Подвесы — жёсткие трубы. Возвращает координаты подвесов.
  function swing(par, defs, o) {
    const lw = o.lw || 2.6, s = o.s, g = mk('g', {}, par), cx = o.cx, gy = o.gy;
    const span = 2.0 * s, top = gy - 2.3 * s, seatY = gy - 0.45 * s, rodW = Math.max(5, 0.035 * s), half = 0.25 * s, postW = Math.max(8, 0.06 * s);
    const L = cx - span / 2, Rr = cx + span / 2, spread = 0.13 * s;
    const post = (x) => { const d = `M${x} ${top}L${x - spread} ${gy}M${x} ${top}L${x + spread} ${gy}`; P(g, d, null, C.OUT, postW + lw * 2); P(g, d, null, C.PAINT, postW);
      P(g, `M${x - spread * 0.55} ${lerp(top, gy, 0.55)}H${x + spread * 0.55}`, null, C.OUT, postW * 0.6 + lw * 2); P(g, `M${x - spread * 0.55} ${lerp(top, gy, 0.55)}H${x + spread * 0.55}`, null, C.PAINT2, postW * 0.6);
      E(g, x, gy + 2, spread * 1.5, 0.03 * s + 4, C.SNOW2, null, 0, {opacity: 0.6}); };
    post(L); post(Rr);
    R(g, L - postW, top - postW * 0.7, span + postW * 2, postW * 1.4, C.PAINT, C.OUT, lw, postW * 0.5);
    P(g, capS(L - postW, Rr + postW, top - postW * 0.7, postW * 0.9, 61), C.SNOWHI, C.OUT, lw * 0.6);
    const rods = [cx - half, cx + half];
    const rodG = mk('g', {}, g);
    const rid = linear(defs, [[0, '#4A5268'], [0.3, '#7F889C'], [0.55, '#A9B1C2'], [0.78, '#EBD5B4'], [0.9, '#9AA2B4'], [1, '#596175']], 0, 0, 1, 0);
    rods.forEach((x) => { R(rodG, x - rodW / 2, top, rodW, seatY - top, `url(#${rid})`, C.OUT, lw * 0.8);
      R(rodG, x - rodW * 1.2, top + postW * 0.4, rodW * 2.4, rodW * 2, C.PAINT2, C.OUT, lw * 0.7, 2); });
    // сиденье
    R(g, cx - half - rodW * 2, seatY - rodW * 0.8, half * 2 + rodW * 4, rodW * 2.2, C.WOOD, C.OUT, lw, 2);
    P(g, capS(cx - half - rodW * 2, cx + half + rodW * 2, seatY - rodW * 0.8, rodW * 1.3, 71), C.SNOWHI, C.OUT, lw * 0.6);
    // иней на подвесах — точки
    const fr = rng(5); let dd = ''; rods.forEach((x) => { for (let y = top + 10; y < seatY - 6; y += 7) if (fr() < 0.7) dd += circ(x - rodW * 0.5 + fr() * rodW * 0.7, y + fr() * 5, 0.8 + fr() * 1.2); });
    P(g, dd, '#F4F7FD', null, 0, {opacity: 0.85});
    return {g, rods, top, seatY, rodW};
  }

  /* ---------------- труба в инее (крупно) ---------------- */
  // вертикальная труба x — центр, w — толщина; иней полосами (для таяния у точки контакта)
  function rod(par, defs, o) {
    const g = mk('g', {}, par), x = o.x, w = o.w, y0 = o.y0, y1 = o.y1, lw = o.lw || 3;
    const rid = linear(defs, [[0, '#373E52'], [0.16, '#4F586E'], [0.4, '#717B91'], [0.6, '#848EA3'], [0.7, '#C9B596'], [0.76, '#E6CFA9'], [0.84, '#7F889C'], [1, '#3A4155']], 0, 0, 1, 0);
    R(g, x - w / 2, y0, w, y1 - y0, `url(#${rid})`);
    const fz = linear(defs, [[0, '#FFFFFF', 0.34], [0.35, '#FFFFFF', 0.12], [0.6, '#FFFFFF', 0]], 0, 0, 1, 0);
    R(g, x - w / 2, y0, w, y1 - y0, `url(#${fz})`);
    P(g, `M${x - w / 2} ${y0}V${y1}M${x + w / 2} ${y0}V${y1}`, null, C.OUT, lw);
    // иней: полосы по высоте; в каждой — кристаллы-иглы по левому краю (с веточками) и редкие крапинки
    const r = rng(o.seed || 17), bands = [], bh = o.band || 26, gap = o.gap || Math.max(6, w * 0.11), sc = o.fs || 1;
    for (let y = y0; y < y1; y += bh) {
      let needles = '', dots = '', spark = '';
      for (let yy = y + r() * gap; yy < y + bh; yy += gap * (0.7 + r() * 0.8)) {
        const L = w * (0.06 + r() * 0.12) * sc, a = (-25 + r() * 50) * Math.PI / 180, bx = x - w / 2 + 1, ex = bx - L * Math.cos(a), ey = yy - L * Math.sin(a) - L * 0.25;
        needles += `M${bx.toFixed(1)} ${yy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
        if (L > w * 0.1) { const mx = (bx + ex) / 2, my = (yy + ey) / 2, b = L * 0.32; needles += `M${mx.toFixed(1)} ${my.toFixed(1)}l${(-b * 0.7).toFixed(1)} ${(-b).toFixed(1)}M${mx.toFixed(1)} ${my.toFixed(1)}l${(-b * 0.9).toFixed(1)} ${(b * 0.5).toFixed(1)}`; }
        if (r() < 0.35) { const L2 = w * (0.03 + r() * 0.05) * sc, bx2 = x + w / 2 - 1; needles += `M${bx2.toFixed(1)} ${(yy + 3).toFixed(1)}l${L2.toFixed(1)} ${(-L2 * 0.5).toFixed(1)}`; }
      }
      const nd = Math.round((bh / 40) * (o.dots || 6));
      for (let i = 0; i < nd; i++) { const xx = x - w / 2 + Math.pow(r(), 1.8) * w * 0.8, yy = y + r() * bh, rr = Math.max(0.9, w * (0.008 + r() * 0.018)); dots += circ(xx, yy, rr); }
      if (r() < 0.28) { const xx = x - w / 2 + r() * w * 0.5, yy = y + r() * bh, k = Math.max(3, w * 0.05); spark = `M${xx - k} ${yy}H${xx + k}M${xx} ${yy - k}V${yy + k}`; }
      const bg = mk('g', {}, g);
      P(bg, needles, null, '#EEF3FB', Math.max(1.1, w * 0.016), {opacity: 0.92});
      P(bg, dots, '#F7FAFF', null, 0, {opacity: 0.85});
      if (spark) P(bg, spark, null, '#FFFFFF', Math.max(1, w * 0.012), {opacity: 0.9});
      bands.push({g: bg, y: y + bh / 2});
    }
    // мокрый след после таяния — тёмная полоска, проявляется
    const wet = R(g, x - w / 2 + 2, 0, w * 0.5, 0, '#3E4660', null, 0, w * 0.2, {opacity: 0});
    return {g, bands, wet, melt(cy, rad, k) { // k 0..1 — степень таяния в радиусе rad от cy
      for (const b of bands) { const d = Math.abs(b.y - cy), m = clamp(k * (1.3 - d / rad)); b.g.setAttribute('opacity', (1 - m).toFixed(3)); }
      wet.setAttribute('y', (cy - rad * 0.45 * k).toFixed(1)); wet.setAttribute('height', (rad * 1.1 * k).toFixed(1)); wet.setAttribute('opacity', (0.35 * k).toFixed(3));
    }};
  }

  /* ---------------- фон крупного плана: размытый двор ---------------- */
  function bokehBg(par, defs, o) {
    const g = mk('g', {}, par), r = rng(o.seed || 23);
    const sky = linear(defs, [[0, '#262A52'], [0.55, '#3C3F6C'], [1, '#55567F']]);
    R(g, -80, -80, 1240, 2080, `url(#${sky})`);
    // стена дома далеко — мягкий прямоугольник
    const wt = o.wallTop || 300, wg = linear(defs, [[0, '#4C5077', 0], [0.12, '#4C5077', 0.85], [1, '#4C5077', 0.85]]);
    R(g, -80, wt - 120, o.wallR || 760, (o.ground || 1500) - wt + 120, `url(#${wg})`);
    // окна — тёплые пятна
    const id = radial(defs, [[0, '#FFD592', 0.95], [0.45, '#F1A85A', 0.6], [1, '#F1A85A', 0]]);
    const idc = radial(defs, [[0, '#A9B3E6', 0.7], [1, '#A9B3E6', 0]]);
    (o.spots || []).forEach(([x, y, rr, warm]) => E(g, x, y, rr, rr * (warm === 2 ? 1.2 : 1), `url(#${warm ? id : idc})`, null, 0));
    for (let i = 0; i < (o.n || 0); i++) { const x = r() * 1080, y = (o.wallTop || 300) + r() * ((o.ground || 1500) - (o.wallTop || 300) - 100), rr = 30 + r() * 60; E(g, x, y, rr, rr, `url(#${r() < 0.7 ? id : idc})`, null, 0, {opacity: 0.5 + r() * 0.5}); }
    const gr = linear(defs, [[0, '#A6AAC8', 0], [0.08, '#A6AAC8', 1], [1, '#CDD0E3', 1]]);
    R(g, -80, (o.ground || 1500) - 40, 1240, 640, `url(#${gr})`);
    return g;
  }

  /* ---------------- комната (cold open) ---------------- */
  function room(par, defs, o = {}) {
    const lw = o.lw || 2.8, g = mk('g', {}, par);
    const wall = linear(defs, [[0, '#5F6386'], [1, '#6E7192']], 0, 0, 1, 0);
    R(g, -80, -80, 1240, 1400, `url(#${wall})`);
    // пол
    const fl = linear(defs, [[0, '#6C6A86'], [1, '#8A8299']]);
    R(g, -80, 1240, 1240, 800, `url(#${fl})`);
    let boards = ''; for (let i = 0; i < 12; i++) boards += `M${-80 + i * 110} 1240L${-80 + i * 110 - (i - 6) * 40} 2000`; P(g, boards + 'M-80 1330H1160M-80 1460H1160M-80 1640H1160', null, '#5A5873', lw * 0.6, {opacity: 0.5});
    P(g, 'M-80 1240H1160', null, C.OUT, lw * 0.8); R(g, -80, 1222, 1240, 18, '#57597A', C.OUT, lw * 0.7);
    // окно слева: вид на двор с качелями
    const wx = 70, wy = 330, ww = 330, wh = 560;
    const wg = mk('g', {}, g), cid = 'wcl' + Math.random().toString(36).slice(2, 7), cp = mk('clipPath', {id: cid}, defs); R(cp, wx, wy, ww, wh);
    const view = mk('g', {'clip-path': `url(#${cid})`}, wg);
    const sky = linear(defs, [[0, '#2A2E58'], [1, '#4C4D7C']]); R(view, wx, wy, ww, wh, `url(#${sky})`);
    E(view, wx + 250, wy + 80, 20, 20, C.MOON); glow(view, defs, {x: wx + 250, y: wy + 80, r: 90, color: '#C9C7F0', op: 0.3});
    R(view, wx + 10, wy + 250, 110, 300, '#383B60'); R(view, wx + 150, wy + 300, 90, 260, '#33365A');
    [[wx + 24, wy + 280], [wx + 64, wy + 330], [wx + 30, wy + 400], [wx + 170, wy + 340], [wx + 200, wy + 420], [wx + 90, wy + 450]].forEach(([x, y]) => R(view, x, y, 12, 16, C.WLIT, null, 0, 0, {opacity: 0.9}));
    R(view, wx, wy + 470, ww, 120, '#B9BCD6');
    // качели за окном
    const sx = wx + 210, sy = wy + 540; P(view, `M${sx - 60} ${sy}L${sx - 50} ${sy - 80}L${sx - 40} ${sy}M${sx + 40} ${sy}L${sx + 50} ${sy - 80}L${sx + 60} ${sy}M${sx - 54} ${sy - 80}H${sx + 54}M${sx - 12} ${sy - 80}V${sy - 24}M${sx + 12} ${sy - 80}V${sy - 24}M${sx - 18} ${sy - 24}H${sx + 18}`, null, '#2B3046', 3.2);
    glow(view, defs, {x: wx + 300, y: wy + 430, r: 120, color: '#FFC77A', op: 0.35});
    R(wg, wx, wy, ww, wh, null, '#D9D6DD', 14); R(wg, wx - 7, wy - 7, ww + 14, wh + 14, null, C.OUT, lw); R(wg, wx + 7, wy + 7, ww - 14, wh - 14, null, C.OUT, lw * 0.7);
    P(wg, `M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh * 0.42}H${wx + ww}`, null, '#D9D6DD', 10); P(wg, `M${wx + ww / 2 - 5} ${wy}V${wy + wh}M${wx + ww / 2 + 5} ${wy}V${wy + wh}M${wx} ${wy + wh * 0.42 - 5}H${wx + ww}M${wx} ${wy + wh * 0.42 + 5}H${wx + ww}`, null, C.OUT, lw * 0.5);
    R(wg, wx - 24, wy + wh + 6, ww + 48, 16, '#D9D6DD', C.OUT, lw);
    // шторы
    [[wx - 70, 110], [wx + ww - 30, 110]].forEach(([x, w]) => { P(g, `M${x} ${wy - 40}H${x + w}Q${x + w - 10} ${wy + 300} ${x + w + 8} ${wy + wh + 130}H${x - 6}Q${x + 8} ${wy + 300} ${x} ${wy - 40}Z`, '#6D6A8C', C.OUT, lw);
      P(g, `M${x + w * 0.35} ${wy - 30}Q${x + w * 0.3} ${wy + 300} ${x + w * 0.36} ${wy + wh + 120}M${x + w * 0.7} ${wy - 30}Q${x + w * 0.64} ${wy + 300} ${x + w * 0.72} ${wy + wh + 120}`, null, C.OUT, lw * 0.5, {opacity: 0.6}); });
    P(g, `M${wx - 90} ${wy - 44}H${wx + ww + 100}`, null, C.OUT, lw * 1.4); for (let i = 0; i < 6; i++) E(g, wx - 70 + i * 22, wy - 44, 5, 5, '#8A87A6', C.OUT, lw * 0.5); for (let i = 0; i < 6; i++) E(g, wx + ww - 30 + i * 22, wy - 44, 5, 5, '#8A87A6', C.OUT, lw * 0.5);
    // картина «?»
    R(g, 480, 380, 170, 210, '#2B2733', C.OUT, lw); R(g, 494, 394, 142, 182, '#8B88A6', C.OUT, lw * 0.6);
    const q = mk('text', {x: 565, y: 528, 'font-family': 'PF', 'font-size': 130, fill: '#B65A33', 'text-anchor': 'middle', opacity: 0.9}, g); q.textContent = '?';
    // часы
    E(g, 800, 250, 62, 62, '#E9E4EA', C.OUT, lw); E(g, 800, 250, 52, 52, null, C.OUT, lw * 0.5, {opacity: 0.5});
    const hands = P(g, 'M800 250L800 210M800 250L828 266', null, C.OUT, lw * 1.2);
    // торшер справа
    const fx = 935; P(g, `M${fx} 640V1236`, null, '#3A3640', 6); P(g, `M${fx - 60} 1236Q${fx} 1214 ${fx + 60} 1236Z`, '#3A3640', C.OUT, lw * 0.8);
    P(g, `M${fx - 70} 640L${fx - 46} 520H${fx + 46}L${fx + 70} 640Z`, '#F3E6CC', C.OUT, lw);
    // диван
    const sofa = mk('g', {}, g);
    P(sofa, 'M110 1010Q110 960 160 960H920Q970 960 970 1010V1250H110Z', '#5E6283', C.OUT, lw);
    P(sofa, 'M130 1110H950V1262H130Z', '#6A6E90', C.OUT, lw);
    P(sofa, 'M60 1060Q60 1020 100 1020H170V1290H60Z', '#565A7B', C.OUT, lw); P(sofa, 'M910 1020H980Q1020 1020 1020 1060V1290H910Z', '#565A7B', C.OUT, lw);
    P(sofa, 'M540 975V1105', null, C.OUT, lw * 0.6, {opacity: 0.5});
    R(sofa, 80, 1290, 22, 20, '#2b2733'); R(sofa, 980, 1290, 22, 20, '#2b2733');
    return {g, clockHands: hands, lampAt: [fx, 590], sofaSeat: 1112};
  }
  function table(par, defs, o = {}) {
    const lw = o.lw || 2.8, g = mk('g', {}, par);
    const top = linear(defs, [[0, '#B57E58'], [1, '#9E6A48']]);
    P(g, 'M110 1450L970 1450L1050 1640L30 1640Z', `url(#${top})`, C.OUT, lw);
    R(g, 30, 1640, 1020, 28, '#8A5A3C', C.OUT, lw);
    R(g, 60, 1668, 26, 220, '#7A4E34', C.OUT, lw); R(g, 994, 1668, 26, 220, '#7A4E34', C.OUT, lw);
    P(g, 'M300 1450L250 1640M540 1450V1640M780 1450L830 1640', null, '#80543a', lw * 0.5, {opacity: 0.6});
    return g;
  }
  G.YARD2 = {C, yardWide, swing, rod, bokehBg, room, table, win, P, R, E, circ, capS};
})(window);
