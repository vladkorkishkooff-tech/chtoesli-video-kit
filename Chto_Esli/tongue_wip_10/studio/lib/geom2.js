/* geom2.js — геометрия для героев стиля «Свет»: сглаженные контуры, трубки-рукава с локтем, IK на два звена.
 * Углы звеньев — градусы от вертикали вниз, плюс — назад (против взгляда), минус — вперёд (как в CRAFT §0).
 */
(function (G) {
  const NS = 'http://www.w3.org/2000/svg';
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const dirA = (a) => [-Math.sin(rad(a)), Math.cos(rad(a))];            // направление звена по углу
  const angOf = (v) => deg(Math.atan2(-v[0], v[1]));                     // угол вектора
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (v) => Math.hypot(v[0], v[1]), norm = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
  const f2 = (n) => (Math.round(n * 10) / 10).toString();
  const P = (p) => f2(p[0]) + ' ' + f2(p[1]);
  const wrap = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };

  // замкнутый сглаженный контур (Catmull-Rom → кубические Безье); corners — индексы острых углов
  function smooth(pts, closed = true, corners = [], k = 1) {
    const n = pts.length, C = new Set(corners);
    if (n < 2) return '';
    const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = 'M' + P(pts[0]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const t1 = C.has(i % n) ? [0, 0] : mul(sub(p2, p0), k / 6), t2 = C.has((i + 1) % n) ? [0, 0] : mul(sub(p3, p1), k / 6);
      d += 'C' + P(add(p1, t1)) + ' ' + P(sub(p2, t2)) + ' ' + P(p2);
    }
    return d + (closed ? 'Z' : '');
  }
  // контур трубки по ломаной pts с толщинами ws (полная ширина в каждой точке); caps: [начало, конец] — глубина скругления 0..1
  function tube(pts, ws, caps = [1, 1]) {
    const n = pts.length, L = [], R = [];
    const segN = [];
    for (let i = 0; i < n - 1; i++) { const d = norm(sub(pts[i + 1], pts[i])); segN.push([-d[1], d[0]]); }
    const offs = (i, s, side) => add(pts[i], mul(segN[s], (side * ws[i]) / 2));
    L.push(offs(0, 0, 1)); R.push(offs(0, 0, -1));
    for (let i = 1; i < n - 1; i++) {
      const a = segN[i - 1], b = segN[i];
      const d0 = norm(sub(pts[i], pts[i - 1])), d1 = norm(sub(pts[i + 1], pts[i]));
      const cr = d0[0] * d1[1] - d0[1] * d1[0];                      // >0 — поворот к «левой» стороне (+нормаль)
      const w = ws[i] / 2;
      const inter = (side) => { // пересечение смещённых прямых
        const p1 = add(pts[i - 1], mul(a, (side * ws[i - 1]) / 2)), q1 = add(pts[i], mul(a, side * w));
        const p2 = add(pts[i], mul(b, side * w)), q2 = add(pts[i + 1], mul(b, (side * ws[i + 1]) / 2));
        const r = sub(q1, p1), s = sub(q2, p2), den = r[0] * s[1] - r[1] * s[0];
        if (Math.abs(den) < 1e-6) return q1;
        const t = ((p2[0] - p1[0]) * s[1] - (p2[1] - p1[1]) * s[0]) / den;
        return add(p1, mul(r, t));
      };
      const arc = (side) => { const out = [], a0 = Math.atan2(a[1] * side, a[0] * side), a1 = Math.atan2(b[1] * side, b[0] * side);
        let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const m = Math.max(2, Math.ceil(Math.abs(da) / 0.25));
        for (let j = 0; j <= m; j++) { const t = a0 + (da * j) / m; out.push([pts[i][0] + Math.cos(t) * w, pts[i][1] + Math.sin(t) * w]); }
        return out; };
      if (Math.abs(cr) < 1e-4) { L.push(add(pts[i], mul(a, w))); R.push(add(pts[i], mul(a, -w))); }
      else if (cr > 0) { L.push(inter(1)); R.push(...arc(-1)); }
      else { R.push(inter(-1)); L.push(...arc(1)); }
    }
    L.push(offs(n - 1, n - 2, 1)); R.push(offs(n - 1, n - 2, -1));
    const cap = (c, p, nn, w, depth, fwd) => { // полуэллипс от одной стороны к другой
      const out = [], m = 8, dir = [nn[1] * -fwd, -nn[0] * -fwd];
      for (let j = 1; j < m; j++) { const t = Math.PI * (j / m); const x = Math.cos(t), y = Math.sin(t);
        out.push(add(add(p, mul(nn, x * w * (c ? 1 : 1))), mul(dir, y * w * depth))); }
      return out; };
    const nEnd = segN[n - 2], nSt = segN[0];
    let d = 'M' + P(L[0]);
    for (let i = 1; i < L.length; i++) d += 'L' + P(L[i]);
    const capE = cap(1, pts[n - 1], nEnd, ws[n - 1] / 2, caps[1], -1);
    for (const q of capE) d += 'L' + P(q);
    for (let i = R.length - 1; i >= 0; i--) d += 'L' + P(R[i]);
    const capS = cap(1, pts[0], mul(nSt, -1), ws[0] / 2, caps[0], -1);
    for (const q of capS) d += 'L' + P(q);
    return d + 'Z';
  }
  // IK на два звена: из A к цели T (длины l1, l2); bend = +1 — сустав «назад/вниз» (локоть), −1 — «вперёд» (колено)
  function ik2(A, T, l1, l2, bend) {
    const v = sub(T, A); let d = len(v);
    d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.5, d));
    const base = angOf(v), al = deg(Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))));
    const a1 = base + bend * al, J = add(A, mul(dirA(a1), l1));
    const a2 = angOf(sub(T, J));
    return {a1, a2, J, E: add(J, mul(dirA(a2), l2)), rel: wrap(a2 - a1)};
  }
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  G.GEOM2 = {rad, deg, dirA, angOf, add, sub, mul, len, norm, smooth, tube, ik2, mk, P, f2, wrap, NS};
})(window);
