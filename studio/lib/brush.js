/* brush.js — кисть тушью для движка «одна линия» (E из oneline.js).
 * Штрих — залитый контур с нажимом: тонкий вход, полное тело, сужение к концу, лёгкая неровность.
 * Рисуется за время t0..t1 (перо идёт по пути), кипение контура — смена зерна 12 раз в секунду.
 *
 *   const B = BRUSH(E);
 *   B.stroke(d, t0, t1, {w, color, parent, ease, taper:[вход, выход]})   → штрих(и); d из нескольких M делится по длине
 *   B.hatch(clipD, t0, t1, {angle, gap, w, parent})                       → штриховка тени внутри контура
 *   B.tip(t)                                                              → точка пера активного штриха (для камеры)
 */
(function (G) {
  const NS = 'http://www.w3.org/2000/svg';
  G.BRUSH = function (E) {
    const {EASE, prog, clamp} = E;
    const strokes = [];
    const probe = document.createElementNS(NS, 'path');
    E.defs.appendChild(probe);
    const hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

    function one(d, t0, t1, o) {
      probe.setAttribute('d', d);
      const L = probe.getTotalLength();
      const N = Math.max(10, Math.ceil(L / 5));
      const pts = [];
      for (let i = 0; i <= N; i++) pts.push(probe.getPointAtLength((i / N) * L));
      const nrm = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        return [-dy / l, dx / l];
      });
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('fill', o.color || '#141413');
      (o.parent || E.lineLayer).appendChild(el);
      const s = {el, pts, nrm, N, L, t0, t1, until: o.until == null ? Infinity : o.until, w: o.w || 6, taper: o.taper || [0.12, 0.22], ease: EASE[o.ease || 'o'] || o.ease, seed: strokes.length + 1, fade: o.fade};
      strokes.push(s);
      return s;
    }

    function stroke(d, t0, t1, o = {}) {
      const parts = d.split(/(?=M)/).map((x) => x.trim()).filter(Boolean);
      if (parts.length === 1) return [one(d, t0, t1, o)];
      const lens = parts.map((p) => { probe.setAttribute('d', p); return probe.getTotalLength(); });
      const tot = lens.reduce((a, b) => a + b, 0);
      let acc = 0;
      return parts.map((p, i) => { const a = t0 + ((t1 - t0) * acc) / tot; acc += lens[i]; return one(p, a, t0 + ((t1 - t0) * acc) / tot, o); });
    }

    function draw(s, t, boil) {
      const q = s.ease(prog(t, s.t0, s.t1));
      if (q <= 0 || t > s.until) { s.el.style.display = 'none'; return; }
      s.el.style.display = '';
      // дорисованный мазок меняется только со сменой фазы кипения — иначе путь прежний
      if (q >= 1 && s.done === boil) { s.el.style.opacity = s.fade ? s.fade(t) : 1; return; }
      s.done = q >= 1 ? boil : -1;
      const n = q * s.N, last = Math.floor(n);
      const L = [], R = [];
      for (let i = 0; i <= Math.min(last + 1, s.N); i++) {
        const u = i / s.N, k = Math.min(1, i <= last ? 1 : n - last);
        const p = s.pts[i], prev = s.pts[Math.max(0, i - 1)];
        const x = i <= last ? p.x : prev.x + (p.x - prev.x) * k, y = i <= last ? p.y : prev.y + (p.y - prev.y) * k;
        // нажим: вход и выход сужены, по телу — неровность кисти; на живом кончике пера — капля
        const [ta, tb] = s.taper;
        let pr = Math.min(1, u / ta, (1 - u) / tb);
        pr = Math.pow(Math.max(0.08, pr), 0.55) * (0.86 + 0.28 * hash(i, s.seed));
        if (q < 1 && i >= last - 2) pr = Math.max(pr, 0.75);
        const w = (s.w / 2) * pr, j = (hash(i, s.seed + boil * 17) - 0.5) * 0.45;
        L.push([x + s.nrm[i][0] * (w + j), y + s.nrm[i][1] * (w + j)]);
        R.push([x - s.nrm[i][0] * (w - j), y - s.nrm[i][1] * (w - j)]);
      }
      const f = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      s.el.setAttribute('d', 'M' + L.map(f).join('L') + 'L' + R.reverse().map(f).join('L') + 'Z');
      s.el.style.opacity = s.fade ? s.fade(t) : 1;
    }

    /** Штриховка тени: параллельные штрихи внутри контура, появляются по очереди. */
    function hatch(clipD, t0, t1, o = {}) {
      const id = 'h' + Math.random().toString(36).slice(2, 8);
      const cp = document.createElementNS(NS, 'clipPath'); cp.id = id;
      const cpp = document.createElementNS(NS, 'path'); cpp.setAttribute('d', clipD); cp.appendChild(cpp); E.defs.appendChild(cp);
      const g = document.createElementNS(NS, 'g'); g.setAttribute('clip-path', `url(#${id})`); (o.parent || E.lineLayer).appendChild(g);
      probe.setAttribute('d', clipD);
      const bb = probe.getBBox(), a = ((o.angle == null ? -35 : o.angle) * Math.PI) / 180, gap = o.gap || 11;
      const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, R = Math.hypot(bb.width, bb.height) / 2 + 10;
      const lines = [];
      for (let k = -R; k <= R; k += gap) {
        const ox = cx + Math.cos(a + Math.PI / 2) * k, oy = cy + Math.sin(a + Math.PI / 2) * k;
        lines.push(`M${(ox - Math.cos(a) * R).toFixed(1)} ${(oy - Math.sin(a) * R).toFixed(1)} L${(ox + Math.cos(a) * R).toFixed(1)} ${(oy + Math.sin(a) * R).toFixed(1)}`);
      }
      const dt = (t1 - t0) / lines.length;
      lines.forEach((d, i) => stroke(d, t0 + i * dt * 0.6, t0 + i * dt * 0.6 + dt * 4, {w: o.w || 2.6, color: o.color, parent: g, taper: [0.3, 0.3], until: o.until}));
      return g;
    }

    function tip(t) {
      let cur = null;
      for (const s of strokes) if (!s.minor && t >= s.t0 && t <= s.t1 + 0.05) cur = s;
      if (!cur) return null;
      const q = cur.ease(prog(t, cur.t0, cur.t1)), p = cur.pts[Math.round(q * cur.N)];
      return [p.x, p.y];
    }

    const boilSeed = E.defs.querySelector('#inkRough feTurbulence');
    E.on((t) => {
      const boil = Math.floor(t * 12); // кипение контура на «двойках»
      if (boilSeed) boilSeed.setAttribute('seed', 3 + (boil % 3));
      for (const s of strokes) draw(s, t, boil % 3);
    });
    return {stroke, hatch, tip, strokes};
  };
})(window);
