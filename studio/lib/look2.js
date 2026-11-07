/* look2.js — «Свет» для шортсов: время/кривые, снег, свечения, подписи на светлых плашках с оранжевой волной,
 * пузыри реплик и мыслей, бумажные заметки. Всё — функции времени (детерминированный рендер).
 */
(function (G) {
  const {mk} = G.GEOM2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const eio = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const eo = (k) => 1 - Math.pow(1 - k, 3);
  const ei = (k) => k * k * k;
  // ключи: [[t, v], ...] → значение (v — число или массив), сглаживание eio между ключами
  function kf(keys, t, ease = eio) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = ease((t - t0) / (t1 - t0 || 1));
      return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
    }
    return keys[keys.length - 1][1];
  }
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  // окно видимости [t0, t1] с плавным входом/выходом → 0..1
  const win = (t, t0, t1, fin = 0.18, fout = 0.16) => (t < t0 || t > t1 ? 0 : Math.min(ss(t0, t0 + fin, t), 1 - ss(t1 - fout, t1, t)));

  /* ---------- снег: один path на слой ---------- */
  function snow(parent, o) {
    const r = rng(o.seed || 1), A = o.area || [0, 0, 1080, 1920], n = o.n || 60, fl = [];
    for (let i = 0; i < n; i++) fl.push({x: A[0] + r() * (A[2] - A[0]), y: A[1] + r() * (A[3] - A[1]), s: lerp(o.size[0], o.size[1], r()), v: lerp(o.speed[0], o.speed[1], r()), a: (o.sway || 14) * (0.5 + r()), f: 0.6 + r() * 1.1, p: r() * 6.28});
    const p = mk('path', {fill: o.color || '#F3F4FA', opacity: o.opacity == null ? 0.85 : o.opacity}, parent);
    const H = A[3] - A[1] + 40, Wd = A[2] - A[0] + 40;
    return {el: p, set(ts) {
      let d = '';
      for (const q of fl) {
        const y = A[1] - 20 + ((((q.y - A[1] + q.v * ts) % H) + H) % H);
        const x = A[0] - 20 + ((((q.x - A[0] + (o.drift || 0) * ts + Math.sin(q.f * ts + q.p) * q.a) % Wd) + Wd) % Wd);
        const s = q.s;
        d += `M${(x - s).toFixed(1)} ${y.toFixed(1)}a${s.toFixed(1)} ${s.toFixed(1)} 0 1 0 ${(2 * s).toFixed(1)} 0a${s.toFixed(1)} ${s.toFixed(1)} 0 1 0 ${(-2 * s).toFixed(1)} 0Z`;
      }
      p.setAttribute('d', d);
    }};
  }
  /* ---------- свечение: радиальный градиент ---------- */
  let gid = 0;
  function radial(defs, stops, id) {
    id = id || 'rg' + (++gid);
    const g = mk('radialGradient', {id, cx: 0.5, cy: 0.5, r: 0.5}, defs);
    stops.forEach(([of, c, op]) => mk('stop', {offset: of, 'stop-color': c, 'stop-opacity': op == null ? 1 : op}, g));
    return id;
  }
  function linear(defs, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, id) {
    id = id || 'lg' + (++gid);
    const g = mk('linearGradient', {id, x1, y1, x2, y2}, defs);
    stops.forEach(([of, c, op]) => mk('stop', {offset: of, 'stop-color': c, 'stop-opacity': op == null ? 1 : op}, g));
    return id;
  }
  function glow(parent, defs, o) {
    const id = radial(defs, [[0, o.color, 1], [0.35, o.color, 0.55], [0.7, o.color, 0.16], [1, o.color, 0]]);
    const e = mk('ellipse', {cx: o.x, cy: o.y, rx: o.r, ry: o.ry || o.r, fill: `url(#${id})`, opacity: o.op == null ? 0.6 : o.op, style: `mix-blend-mode:${o.blend || 'screen'}`}, parent);
    return e;
  }

  /* ---------- подписи ---------- */
  const INK = '#2A2421', PLATE = '#F4EFE6', ORANGE = '#D2692F';
  function squig(x0, x1, y, amp, wl) {
    let d = `M${x0.toFixed(1)} ${y.toFixed(1)}`; const n = Math.max(2, Math.round((x1 - x0) / (wl / 2)));
    for (let i = 1; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, cx = x0 + ((x1 - x0) * (i - 0.5)) / n, cy = y + (i % 2 ? -amp : amp) * 2; d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; }
    return d;
  }
  // lines: массив строк; каждая строка — строка или массив кусков [текст, {fill, font, mark:true}]
  function caption(parent, o) {
    const g = mk('g', {opacity: 0}, parent), size = o.size || 56, lh = o.lh || size * 1.22, font = o.font || 'PF', anchor = 'middle';
    const sh = mk('rect', {fill: '#14111e', opacity: 0.2}, g), plate = mk('rect', {fill: o.plate || PLATE, opacity: o.plateOp == null ? 0.96 : o.plateOp}, g);
    const tg = mk('g', {}, g), marks = [];
    const lines = o.lines.map((ln) => (typeof ln === 'string' ? [[ln, {}]] : ln));
    const texts = lines.map((parts, i) => {
      const t = mk('text', {x: 0, y: i * lh, 'font-family': font, 'font-size': size, fill: o.color || INK, 'text-anchor': 'start', style: 'font-variant-numeric: lining-nums'}, tg);
      parts.forEach(([s, st]) => { const sp = mk('tspan', {fill: st.fill || null, 'font-family': st.font || null, 'font-size': st.size || null}, t); sp.textContent = s; sp.__mark = st.mark; });
      return t;
    });
    let built = false, W = 0, Hh = 0;
    function build() {
      // ширина строк, центрирование, волна под отмеченными кусками
      const ws = texts.map((t) => t.getComputedTextLength()); W = Math.max(...ws);
      texts.forEach((t, i) => { const x0 = -ws[i] / 2; t.setAttribute('x', x0.toFixed(1));
        let ci = 0; [...t.childNodes].forEach((sp) => { const len = sp.textContent.length;
          if (sp.__mark) { const a = t.getStartPositionOfChar(ci).x, e = t.getEndPositionOfChar(ci + len - 1).x;
            const p = mk('path', {d: squig(a, e, i * lh + size * 0.2, size * 0.035, size * 0.42), fill: 'none', stroke: o.mcol || ORANGE, 'stroke-width': size * 0.075, 'stroke-linecap': 'round', opacity: 0.95}, tg);
            const L = p.getTotalLength(); p.setAttribute('stroke-dasharray', `${L} ${L}`); marks.push({p, L}); }
          ci += len; }); });
      Hh = (texts.length - 1) * lh + size;
      const pad = o.pad || [size * 0.6, size * 0.42], x = -W / 2 - pad[0], y = -size * 0.86 - pad[1], w = W + pad[0] * 2, h = Hh + pad[1] * 2 - size * 0.05;
      [plate, sh].forEach((r, j) => { r.setAttribute('x', x); r.setAttribute('y', y + (j ? 6 : 0)); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('rx', o.rx || 16); });
      if (o.noPlate) { plate.setAttribute('opacity', 0); sh.setAttribute('opacity', 0); }
      built = true; C.w = w; C.h = h; C.top = y; 
    }
    const C = {g, build, set(k, extra = {}) {
      if (!built) build();
      g.setAttribute('opacity', k.toFixed(3));
      const dy = (1 - eo(clamp(k))) * 14;
      g.setAttribute('transform', `translate(${(o.x || 540).toFixed(1)} ${((o.y || 400) + dy + (extra.dy || 0)).toFixed(1)})`);
      const mk2 = clamp(extra.mark == null ? k * 1.6 - 0.4 : extra.mark);
      marks.forEach(({p, L}) => p.setAttribute('stroke-dashoffset', (L * (1 - mk2)).toFixed(1)));
    }};
    return C;
  }
  /* ---------- пузыри ---------- */
  function bubble(parent, o) {
    const g = mk('g', {opacity: 0}, parent), size = o.size || 50, font = o.font || 'PF', lw = o.lw || 3.2;
    const sh = mk('path', {fill: '#14111e', opacity: 0.18}, g), body = mk('path', {fill: o.fill || '#FBF8F2', stroke: '#211c1a', 'stroke-width': lw, 'stroke-linejoin': 'round'}, g);
    const dots = mk('path', {fill: o.fill || '#FBF8F2', stroke: '#211c1a', 'stroke-width': lw * 0.9}, g);
    const lines = Array.isArray(o.text) ? o.text : [o.text];
    const ts = lines.map((s, i) => { const t = mk('text', {'font-family': font, 'font-size': size, fill: INK, 'text-anchor': 'middle', x: 0, y: i * size * 1.15, style: 'font-variant-numeric: lining-nums', 'font-weight': o.weight || null}, g); t.textContent = s; return t; });
    let built = false;
    function build() {
      const W = Math.max(...ts.map((t) => t.getComputedTextLength())), H = (lines.length - 1) * size * 1.15 + size;
      const px = o.kind === 'thought' ? size * 0.9 : size * 0.6, py = o.kind === 'thought' ? size * 0.62 : size * 0.42;
      const x0 = -W / 2 - px, x1 = W / 2 + px, y0 = -size * 0.82 - py, y1 = -size * 0.82 + H + py;
      let d = '';
      if (o.kind === 'thought') { // облако: дуги по контуру скруглённого прямоугольника
        const pts = [], cw = x1 - x0, ch = y1 - y0, nx = Math.max(3, Math.round(cw / (size * 1.1))), ny = Math.max(1, Math.round(ch / (size * 1.1)));
        for (let i = 0; i < nx; i++) pts.push([x0 + (cw * i) / nx, y0]);
        for (let i = 0; i < ny; i++) pts.push([x1, y0 + (ch * i) / ny]);
        for (let i = 0; i < nx; i++) pts.push([x1 - (cw * i) / nx, y1]);
        for (let i = 0; i < ny; i++) pts.push([x0, y1 - (ch * i) / ny]);
        d = `M${pts[0][0]} ${pts[0][1]}`;
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.62; d += `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
        d += 'Z';
        const T = o.tail || [x0, y1 + 60]; let dd = '';
        [[0.35, 0.16], [0.68, 0.11], [0.92, 0.07]].forEach(([k, rr]) => { const cx = lerp((x0 + x1) / 2 + (T[0] > 0 ? 1 : -1) * W * 0.25, T[0], k), cy = lerp(y1, T[1], k), r = size * rr * 2.2; dd += `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`; });
        dots.setAttribute('d', dd);
      } else {
        const r = Math.min(26, (y1 - y0) / 2), T = o.tail || [x0 + 40, y1 + 50];
        const bx = clamp(T[0] * 0.55, x0 + r + 20, x1 - r - 50);
        const tailOnBottom = T[1] > y1;
        if (tailOnBottom) d = `M${x0 + r} ${y0}H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}H${bx + 34}L${T[0]} ${T[1]}L${bx} ${y1}H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
        else d = `M${x0 + r} ${y0}H${bx}L${T[0]} ${T[1]}L${bx + 34} ${y0}H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
        dots.setAttribute('d', '');
      }
      body.setAttribute('d', d); sh.setAttribute('d', d); sh.setAttribute('transform', 'translate(0 6)');
      built = true; B.box = [x0, y0, x1, y1];
    }
    const B = {g, build, set(k) { if (!built) build(); g.setAttribute('opacity', clamp(k * 1.4).toFixed(3));
      const sc = 0.9 + 0.1 * eo(clamp(k)); const [ox, oy] = o.at || [0, 0];
      g.setAttribute('transform', `translate(${o.x} ${o.y}) translate(${ox} ${oy}) scale(${sc.toFixed(3)}) translate(${-ox} ${-oy})`); }};
    return B;
  }
  G.LOOK2 = {clamp, lerp, ss, eio, eo, ei, kf, rng, win, snow, radial, linear, glow, caption, bubble, squig, INK, PLATE, ORANGE};
})(window);
