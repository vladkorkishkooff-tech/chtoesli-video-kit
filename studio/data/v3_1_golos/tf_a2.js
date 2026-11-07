/* tf_a2.js — s04 окно с котом; s05–s07 средний план: хват, стоп-кадр, заметка про свиные языки, лупа. */
(function (G) {
  const {mk} = G.GEOM2, L2 = G.LOOK2, Y = G.YARD2, TF = G.TF;
  const {kf, ss, win, lerp, clamp, eio, eo} = L2;
  const S2 = G.SOSED2(), K = G.CAT2(), C = Y.C;
  const amb = (par, op, col) => mk('rect', {x: -100, y: -100, width: 1280, height: 2120, fill: col || '#8E95CC', opacity: op, style: 'mix-blend-mode:multiply'}, par);
  const rot = (p, a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  function tipLocal(q) {
    const lean = q.lean || 0, hip = [q.hipX || 0, -410 + (q.hipY || 0)], nk = [hip[0] + rot([2, -380], lean)[0], hip[1] + rot([2, -380], lean)[1]];
    const tilt = (q.tilt || 0) + lean * 0.35, tg = (q.face && q.face.tongue) || 0, p = rot([75 + 24 * tg, -43], tilt);
    return [nk[0] + p[0], nk[1] + p[1]];
  }

  /* ================= s04: окно, кот в шоке ================= */
  TF.shot({id: 's04', t0: 6.3, t1: 7.5, build(g, cam) {
    const D = TF.D, lw = 3.2;
    // стена дома
    Y.R(cam, -100, -100, 1280, 2120, C.PANEL);
    Y.P(cam, 'M-100 300H1180M-100 1420H1180M120 -100V2020M960 -100V2020', null, C.SEAM, 3, {opacity: 0.9});
    // проём
    const x0 = 180, y0 = 430, x1 = 900, y1 = 1250;
    const ig = L2.radial(D, [[0, '#FFE3A8'], [0.5, '#F4B868'], [1, '#D98848']]);
    Y.R(cam, x0, y0, x1 - x0, y1 - y0, `url(#${ig})`);
    // комната внутри: штора справа, торшер-пятно, горшок
    Y.P(cam, `M${x1 - 170} ${y0}H${x1}V${y1}H${x1 - 150}Q${x1 - 190} ${y0 + 400} ${x1 - 170} ${y0}Z`, '#C9743F', C.OUT, lw * 0.7, {opacity: 0.95});
    Y.P(cam, `M${x1 - 120} ${y0 + 20}Q${x1 - 140} ${y0 + 400} ${x1 - 110} ${y1}M${x1 - 60} ${y0 + 20}Q${x1 - 80} ${y0 + 400} ${x1 - 50} ${y1}`, null, '#9c5630', 2, {opacity: 0.6});
    Y.P(cam, `M${x0 + 40} ${y1 - 150}H${x0 + 120}L${x0 + 108} ${y1 - 72}H${x0 + 52}Z`, '#B65A33', C.OUT, lw * 0.7);
    Y.P(cam, `M${x0 + 80} ${y1 - 150}Q${x0 + 60} ${y1 - 230} ${x0 + 30} ${y1 - 250}M${x0 + 80} ${y1 - 150}Q${x0 + 96} ${y1 - 240} ${x0 + 130} ${y1 - 262}M${x0 + 80} ${y1 - 150}Q${x0 + 80} ${y1 - 220} ${x0 + 84} ${y1 - 280}`, null, '#5E7A4A', 9);
    Y.R(cam, x0, y1 - 74, x1 - x0, 30, '#EFE4D6', C.OUT, lw * 0.7);   // подоконник внутри
    this.cat = K.sit(cam, {s: 1.5, lw: 3.4}); this.catAt = [560, y1 - 70];
    // стекло: блики и иней по углам
    Y.P(cam, `M${x0 + 60} ${y1}L${x0 + 330} ${y0}L${x0 + 400} ${y0}L${x0 + 130} ${y1}Z`, '#ffffff', null, 0, {opacity: 0.08});
    Y.P(cam, `M${x0 + 470} ${y1}L${x0 + 640} ${y0}L${x0 + 670} ${y0}L${x0 + 500} ${y1}Z`, '#ffffff', null, 0, {opacity: 0.06});
    const fr = L2.rng(9); let fd = '';
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([cx, cy, sx, sy]) => { for (let i = 0; i < 26; i++) { const a = fr() * Math.PI / 2, L = 30 + fr() * 110, bx = cx + sx * fr() * 40, by = cy + sy * fr() * 40;
      const ex = bx + sx * Math.cos(a) * L, ey = by + sy * Math.sin(a) * L; fd += `M${bx.toFixed(1)} ${by.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const mx = (bx + ex) / 2, my = (by + ey) / 2; fd += `M${mx.toFixed(1)} ${my.toFixed(1)}l${(sx * 14).toFixed(1)} ${(-sy * 8).toFixed(1)}M${mx.toFixed(1)} ${my.toFixed(1)}l${(-sx * 6).toFixed(1)} ${(sy * 14).toFixed(1)}`; } });
    Y.P(cam, fd, null, '#F4F8FF', 2.2, {opacity: 0.7});
    // рама
    const fw = 34; Y.P(cam, `M${x0 - fw} ${y0 - fw}H${x1 + fw}V${y1 + fw}H${x0 - fw}Z M${x0} ${y0}V${y1}H${x1}V${y0}Z`, '#DAD7DF', C.OUT, lw, {'fill-rule': 'evenodd'});
    Y.R(cam, x0 - fw, y0 + 190, x1 - x0 + fw * 2, 26, '#DAD7DF', C.OUT, lw);
    Y.P(cam, `M${x0 + 12} ${y0 + 12}H${x1 - 12}M${x0 + 12} ${y0 + 12}V${y0 + 180}`, null, '#ffffff', 2, {opacity: 0.6});
    // отлив со снегом
    Y.R(cam, x0 - 70, y1 + fw, x1 - x0 + 140, 24, '#8D96AA', C.OUT, lw); Y.P(cam, Y.capS(x0 - 70, x1 + 70, y1 + fw, 26, 91), C.SNOWHI, C.OUT, lw * 0.7);
    this.sn = [L2.snow(cam, {n: 60, seed: 71, size: [2.4, 4.4], speed: [70, 120], sway: 16, opacity: 0.8}), L2.snow(cam, {n: 12, seed: 72, size: [9, 14], speed: [180, 240], sway: 30, opacity: 0.45})];
    amb(cam, 0.16);
    L2.glow(cam, D, {x: 540, y: 840, r: 700, ry: 760, color: '#FFB060', op: 0.45});
  }, update(t) {
    this.cam.setAttribute('transform', TF.camT(kf([[6.3, 1.0], [7.5, 1.06]], t), 540, 860));
    this.sn.forEach((s) => s.set(TF.ts(t)));
    const paw = kf([[6.3, 0.15], [6.42, 1]], t, eo);
    this.cat.set({x: this.catAt[0], y: this.catAt[1], eye: 'shock', look: [-0.6, 0.6], paw, pawTo: [-104, -224], mouth: t > 6.45 && t < 6.85 ? 'o' : 'flat', tail: TF.T * 0.6, hy: kf([[6.3, 6], [6.4, -4]], t)});
  }});
  TF.inits.push(() => { TF.cap({lines: [[['−1000', {fill: '#B83A26', font: 'PFX'}], [' ауры', {mark: true}]]], x: 540, y: 330, size: 70}, 6.5, 7.5); });
  TF.sound('meow', 6.45, {gain: -12, lp: 2200});

  /* ================= s05–s07: средний план, стоп-кадр ================= */
  const MG = 1960, MS = 0.95, MROD = 560, MRW = 18.6, MCX = MROD - MRW / 2 + 2.5;
  const FZ = TF.FZ0;
  TF.shot({id: 's05', t0: 7.5, t1: 15.3, build(g, cam) {
    const D = TF.D;
    const bg = mk('g', {class: 'ns', transform: 'translate(693 1960) scale(2.28) translate(-600 -1660)'}, cam);
    const yard = Y.yardWide(bg, D, {lit: {'1_4': true, '0_3': true, '0_4': false, '0_5': true}});
    this.sw = Y.swing(cam, D, {cx: 693, gy: MG, s: 531, lw: 3});
    this.hero = S2.side(cam, {s: MS, lw: 3.2, off: 2.5});
    this.sn = [L2.snow(cam, {n: 70, seed: 81, size: [2, 3.6], speed: [60, 100], sway: 14, opacity: 0.75}), L2.snow(cam, {n: 26, seed: 82, size: [5, 8], speed: [130, 190], sway: 22, opacity: 0.8})];
    amb(cam, 0.2);
    L2.glow(cam, D, {x: 1200, y: 200, r: 900, color: '#FFB866', op: 0.5});
    L2.glow(cam, D, {x: 190, y: 360, r: 260, color: '#FFC57A', op: 0.5});
  }, update(t) {
    const z = kf([[7.5, 1.0], [FZ, 1.0], [12.7, 1.12], [15.3, 1.15]], t, (k) => k);
    this.cam.setAttribute('transform', TF.camT(z, 553, 1100));
    this.sn.forEach((s) => s.set(TF.ts(t)));
    const tp = Math.min(t, FZ);                          // в стоп-кадре поза замирает
    const grab = ss(7.5, 7.66, tp), brace = ss(7.68, FZ, tp);
    const q = {y: MG, lean: 3 + brace * 5, hipX: -brace * 34, tilt: 2, face: {mouth: 'tongue', tongue: 1, eye: 'open', worry: 0.4 * (1 - brace), brow: -0.3 * brace, look: [0.5, 0.4]}};
    const tl = tipLocal(q); q.x = MCX - MS * tl[0];
    const cy = MG + MS * tl[1];
    // кулаки обхватывают трубу: центр кулака (30 ед. от запястья) — на оси трубы
    const FX = MROD - 30 * MS;
    q.armF = grab > 0.01 ? {to: [lerp(q.x + 40, FX, grab), lerp(cy + 380, cy + 110, grab)], handA: grab > 0.5 ? -90 : null} : {sh: -6, el: -12};
    q.armN = grab > 0.01 ? {to: [lerp(q.x + 50, FX, grab), lerp(cy + 400, cy + 235, grab)], handA: grab > 0.5 ? -90 : null} : {sh: 6, el: -10};
    q.handF = grab > 0.5 ? 'grip' : 'relax'; q.handN = grab > 0.5 ? 'grip' : 'relax';
    q.legN = {foot: [q.x + 40 * (1 - 0) + 20, MG - 14]}; q.legF = {foot: [q.x - 40, MG - 14]};
    this.hero.set(q);
    this.contact = [MCX, cy]; this.z = z;
  }});
  TF.inits.push(() => {
    TF.cap({lines: [[['СТОП.', {fill: '#B83A26', font: 'PFX'}], [' Не дёргай.', {mark: true}]]], x: 540, y: 400, size: 66}, 8.15, 9.45);
  });
  TF.sound('creak', 7.62, {gain: -12});

  // заметка: свиные языки
  TF.inits.push(() => {
    const g = mk('g', {}, TF.U), x = 90, y = 290, w = 900, h = 430;
    mk('rect', {x: x + 4, y: y + 10, width: w, height: h, rx: 8, fill: '#14111e', opacity: 0.25}, g);
    mk('rect', {x, y, width: w, height: h, rx: 8, fill: '#F6EFE0'}, g);
    let lines = ''; for (let i = 1; i < 8; i++) lines += `M${x + 24} ${y + 40 + i * 52}H${x + w - 24}`;
    mk('path', {d: lines, stroke: '#B9C6DA', 'stroke-width': 1.6, opacity: 0.7}, g);
    mk('rect', {x: x + w / 2 - 80, y: y - 22, width: 160, height: 46, fill: '#E9DDB0', opacity: 0.85, transform: `rotate(-3 ${x + w / 2} ${y})`}, g);
    const T = (tx, ty, s, txt, fill, wgt) => { const n = mk('text', {x: tx, y: ty, 'font-family': 'CV', 'font-size': s, 'font-weight': wgt || 700, fill: fill || '#2B2836'}, g); n.textContent = txt; return n; };
    T(x + 44, y + 96, 60, 'Учёные проверили');
    T(x + 44, y + 166, 60, 'на свиных языках:');
    T(x + 44, y + 246, 60, 'рывок рвал их в');
    const t54 = T(x + 44, y + 356, 118, '54%', '#C7532A');
    T(x + 250, y + 352, 60, 'опытов');
    // свинка-рисунок справа
    const pg = mk('g', {transform: `translate(${x + 700} ${y + 270})`}, g), ink = {stroke: '#2B2836', 'stroke-width': 3.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
    mk('path', Object.assign({d: 'M-70 -60L-58 -112L-26 -78Z M70 -60L58 -112L26 -78Z', fill: '#F2B6AE'}, ink), pg);
    mk('ellipse', Object.assign({cx: 0, cy: -10, rx: 92, ry: 80, fill: '#F6C4BC'}, ink), pg);
    mk('ellipse', Object.assign({cx: 0, cy: 18, rx: 38, ry: 26, fill: '#EFA39A'}, ink), pg);
    mk('path', {d: 'M-12 18a5 7 0 1 0 0.1 0Z M12 18a5 7 0 1 0 0.1 0Z', fill: '#2B2836'}, pg);
    mk('path', {d: 'M-34 -34a6 6 0 1 0 0.1 0Z M34 -34a6 6 0 1 0 0.1 0Z', fill: '#2B2836'}, pg);
    mk('path', Object.assign({d: 'M-14 52Q0 60 14 52Q18 82 0 90Q-18 82 -14 52Z', fill: '#E0736F'}, ink), pg);
    mk('path', {d: 'M0 58V84', stroke: '#2B2836', 'stroke-width': 2, opacity: 0.6}, pg);
    mk('path', {d: 'M-96 108H96', stroke: '#2B2836', 'stroke-width': 2.4, 'stroke-dasharray': '10 8', opacity: 0.6}, pg);
    const und = mk('path', {d: L2.squig(x + 44, x + 236, y + 376, 3.4, 40), fill: 'none', stroke: '#C7532A', 'stroke-width': 6, 'stroke-linecap': 'round'}, g);
    const C2 = {g, build() {}, set(k) { g.setAttribute('opacity', clamp(k * 1.4).toFixed(3)); g.setAttribute('transform', `translate(0 ${((1 - eo(clamp(k))) * 30).toFixed(1)})`); }};
    TF.ui.push({c: C2, t0: 9.6, t1: 12.6, fin: 0.3, fout: 0.2});
  });

  // лупа: разрез «язык — слюна — металл»
  TF.inits.push(() => {
    const D = TF.UD, g = mk('g', {}, TF.U), cx = 540, cy = 590, r = 270;
    const link = mk('path', {fill: 'none', stroke: '#F4EFE6', 'stroke-width': 4, opacity: 0.9}, g);
    const small = mk('circle', {r: 34, fill: 'none', stroke: '#F4EFE6', 'stroke-width': 4}, g);
    const cid = 'loupeClip'; const cp = mk('clipPath', {id: cid}, D); mk('circle', {cx, cy, r}, cp);
    mk('circle', {cx: cx + 4, cy: cy + 10, r: r + 16, fill: '#14111e', opacity: 0.3}, g);
    const inG = mk('g', {'clip-path': `url(#${cid})`}, g);
    mk('rect', {x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill: '#F2E9E4'}, inG);
    // язык слева
    const xs = cx - 40;
    let bumps = `M${cx - r} ${cy - r}H${xs}`; for (let i = 0; i < 9; i++) { const y = cy - r + (i + 0.5) * (2 * r / 9); bumps += `Q${xs + 34} ${(y - 18).toFixed(1)} ${xs + 30} ${y.toFixed(1)}Q${xs + 34} ${(y + 18).toFixed(1)} ${xs} ${(y + r / 9).toFixed(1)}`; }
    bumps += `V${cy + r}H${cx - r}Z`;
    mk('path', {d: bumps, fill: '#E8857E', stroke: '#2a221e', 'stroke-width': 3}, inG);
    let dots = ''; const rr = L2.rng(3); for (let i = 0; i < 40; i++) { const x = cx - r + rr() * (r - 60), y = cy - r + rr() * 2 * r; dots += `M${x} ${y}a3 3 0 1 0 0.1 0Z`; }
    mk('path', {d: dots, fill: '#C9625C', opacity: 0.6}, inG);
    // слюна
    const film = mk('rect', {x: xs + 30, y: cy - r, width: 46, height: 2 * r, fill: '#BFE6F7'}, inG);
    // металл
    const mg = L2.linear(D, [[0, '#8C96AA'], [0.5, '#737D92'], [1, '#5A6377']], 0, 0, 1, 0);
    mk('rect', {x: xs + 76, y: cy - r, width: r + 80, height: 2 * r, fill: `url(#${mg})`, stroke: '#2a221e', 'stroke-width': 3}, inG);
    // кристаллы льда: растут от металла к языку
    const crys = []; const cr = L2.rng(8);
    for (let i = 0; i < 16; i++) { const y = cy - r + 30 + i * ((2 * r - 60) / 15) + (cr() - 0.5) * 10, x = xs + 70 - cr() * 38, s = 7 + cr() * 6;
      let d = ''; for (let a = 0; a < 3; a++) { const an = (a * Math.PI) / 3; d += `M${(x - Math.cos(an) * s).toFixed(1)} ${(y - Math.sin(an) * s).toFixed(1)}L${(x + Math.cos(an) * s).toFixed(1)} ${(y + Math.sin(an) * s).toFixed(1)}`; }
      crys.push({el: mk('path', {d, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0}, inG), k: (xs + 76 - x) / 46}); }
    // стрелки тепла: из языка в металл
    const arrows = [];
    [-112, 0, 112].forEach((dy, i) => { const y = cy + dy, d = `M${cx - 200} ${y}Q${cx - 150} ${y - 16} ${cx - 100} ${y}T${cx} ${y}T${cx + 100} ${y}T${cx + 182} ${y}`;
      const a = mk('path', {d, fill: 'none', stroke: '#E0622C', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '34 26'}, inG);
      const h = mk('path', {d: `M${cx + 170} ${y - 20}L${cx + 204} ${y}L${cx + 170} ${y + 20}`, fill: 'none', stroke: '#E0622C', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, inG);
      arrows.push(a); });
    const lab = (x, y, txt, fill) => { const n = mk('text', {x, y, 'font-family': 'CV', 'font-size': 50, 'font-weight': 700, fill, 'text-anchor': 'middle'}, inG); n.textContent = txt; const b = mk('rect', {fill: '#F4EFE6', opacity: 0.9, rx: 10}, inG); inG.insertBefore(b, n); n.__bg = b; return n; };
    // подписи: «тепло» — сверху над стрелками, «язык»/«металл» — в широкой части круга между 1-й и 2-й стрелкой
    const l1 = lab(cx - 120, cy - 42, 'язык', '#7d2b25'), l2 = lab(cx + 140, cy - 42, 'металл', '#2f3445'), l3 = lab(cx + 0, cy + 194, 'слюна → лёд', '#2B5C88'), l4 = lab(cx + 13, cy - 148, 'тепло', '#B5481F');
    mk('circle', {cx, cy, r, fill: 'none', stroke: '#2a221e', 'stroke-width': 10}, g);
    mk('circle', {cx, cy, r: r - 6, fill: 'none', stroke: '#F4EFE6', 'stroke-width': 3, opacity: 0.8}, g);
    const C3 = {g, build() { [l1, l2, l3, l4].forEach((n) => { const b = n.getBBox(); n.__bg.setAttribute('x', b.x - 10); n.__bg.setAttribute('y', b.y + 4); n.__bg.setAttribute('width', b.width + 20); n.__bg.setAttribute('height', b.height - 6); }); },
      set(k) { const t = TF.t, s = TF.shots.find((q) => q.id === 's05');
        g.setAttribute('opacity', clamp(k * 1.3).toFixed(3));
        const sc = 0.85 + 0.15 * eo(clamp(k)); inG.parentNode.setAttribute('transform', `translate(${cx} ${cy}) scale(${sc.toFixed(3)}) translate(${-cx} ${-cy})`);
        const p = s.contact ? TF.toScreen(s.contact, s.z, 553, 1100) : [553, 1178];
        small.setAttribute('cx', p[0].toFixed(1)); small.setAttribute('cy', p[1].toFixed(1));
        // касательные от малого круга к лупе
        const dx = cx - p[0], dy = cy - p[1], dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl;
        link.setAttribute('d', `M${(p[0] + nx * 34).toFixed(1)} ${(p[1] + ny * 34).toFixed(1)}L${(cx + nx * r).toFixed(1)} ${(cy + ny * r).toFixed(1)}M${(p[0] - nx * 34).toFixed(1)} ${(p[1] - ny * 34).toFixed(1)}L${(cx - nx * r).toFixed(1)} ${(cy - ny * r).toFixed(1)}`);
        arrows.forEach((a, i) => a.setAttribute('stroke-dashoffset', (-TF.T * 160 - i * 20).toFixed(1)));
        const ice = ss(13.3, 14.7, t); crys.forEach((c) => c.el.setAttribute('opacity', clamp((ice - c.k * 0.7) * 3).toFixed(3)));
        film.setAttribute('fill', ice > 0.5 ? '#D8EEF8' : '#BFE6F7');
      }};
    TF.ui.push({c: C3, t0: 12.75, t1: 15.25, fin: 0.3, fout: 0.15});
    TF.cap({lines: ['Металл мигом забирает тепло —', [['и слюна ', {}], ['замерзает.', {mark: true}]]], x: 540, y: 1330, size: 54}, 12.8, 15.25);
  });
})(window);
