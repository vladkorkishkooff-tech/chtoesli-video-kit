/* inkclay.js — набор «Тушь и глина» поверх движка «одна линия» (E) и кисти (BRUSH).
 * Сцена — место в мире со своим сдвигом по Y и временем жизни; всё внутри рисуется в её координатах.
 *
 *   const K = INKCLAY(E, B);
 *   const sc = K.place(Y0, from, until)        → место в мире: свои слои глины и туши
 *   K.ink(sc, d, t0, dur, w, o)                 → штрих кистью
 *   K.clay(sc, d, t0, color, dx, dy, o)         → глиняный блок: впечатывается пружиной, может мерцать (o.flick) и бледнеть (o.fade)
 *   K.hatch(sc, d, t0, t1, o)                   → штриховка тени
 *   K.note(sc, x, y, text, t0, o)               → живая рукописная пометка: пишется слева направо, буквы подрагивают
 *
 * Опции стиля (по умолчанию — прежний вид, страницы без опций не меняются):
 *   INKCLAY(E, B, {inkK: 0.55, sketch: 0.4, sketchMin: 2, wash: 'url(#wash)', bleed: true, card: {fill, stroke, w, rx, filter}})
 *   inkK — множитель толщины туши; sketch — прозрачность второго, смещённого прохода линии (0 — без него);
 *   wash — фильтр заливки; bleed — заливка проступает акварелью (без пружины); safe — границы кадра для текста пометок (экран, px)
 */
(function (G) {
  G.INKCLAY = function (E, B, OPT = {}) {
    const IK = OPT.inkK || 1, SK = OPT.sketch || 0, SKMIN = OPT.sketchMin || 2, WF = OPT.wash || 'url(#clayTex)', BLEED = !!OPT.bleed;
    const CARD = {fill: '#F4F2EB', stroke: '#141413', w: 4, rx: 14, ...(OPT.card || {})}, SAFE = {l: 60, r: 1020, t: 280, b: 1320, ...(OPT.safe || {})};
    const {EASE, prog, clamp, el, on, sfx} = E;
    const clayRoot = el('g', {}, E.sceneLayer);
    const stamps = [], notes = [], places = [];
    const hh = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5; return x - Math.floor(x); };

    function place(Y0, from, until) {
      const sc = {Y0, from, until, clay: el('g', {transform: `translate(0 ${Y0})`}, clayRoot), ink: el('g', {transform: `translate(0 ${Y0})`}, E.lineLayer), top: el('g', {transform: `translate(0 ${Y0})`}, E.topLayer)};
      places.push(sc); return sc;
    }
    const ink = (sc, d, t0, dur, w = 6, o = {}) => {
      const ww = w * IK, par = o.parent || sc.ink, r = B.stroke(d, t0, t0 + dur, {parent: par, until: sc.until, ...o, w: ww});
      // второй проход пера: тоньше, бледнее, чуть смещён — линия «живая», как в набросках канала
      if (SK && ww >= SKMIN && !o.noSketch) B.stroke(d, t0 + dur * 0.3, t0 + dur * 1.2, {parent: par, until: sc.until, ...o, w: ww * 0.62, taper: [0.3, 0.35]}).forEach((s2) => {
        const a = s2.seed * 2.399; s2.minor = true; s2.el.setAttribute('fill-opacity', SK);
        s2.el.setAttribute('transform', `translate(${(Math.cos(a) * 1.6).toFixed(2)} ${(Math.sin(a) * 1.6).toFixed(2)})`); });
      return r;
    };
    const hatch = (sc, d, t0, t1, o = {}) => B.hatch(d, t0, t1, {parent: o.parent || sc.ink, until: sc.until, ...o});
    function clay(sc, d, t0, color, dx = 9, dy = 7, o = {}) {
      if (typeof t0 === 'string') [t0, color] = [color, t0]; // допускаем порядок (цвет, время)
      const p = el('path', {d, fill: color, filter: o.filter || WF}, o.parent || sc.clay);
      const s = {p, t0, dx, dy, op: o.op == null ? 1 : o.op, flick: o.flick, fade: o.fade, until: sc.until, out: o.out};
      stamps.push(s);  return s;
    }
    function note(sc, x, y, text, t0, o = {}) {
      // бумажная карточка под пометкой — текст читается на любом фоне, в том числе в темноте
      const card = el('rect', {rx: CARD.rx, fill: CARD.fill, stroke: CARD.stroke, 'stroke-width': CARD.w, ...(CARD.filter ? {filter: CARD.filter} : {}), style: o.card === false ? 'visibility:hidden' : ''}, o.parent || sc.top);
      const n = el('text', {x, y, 'font-family': 'Hand', 'font-weight': 700, 'font-size': o.size || 60, fill: o.color || '#141413', 'text-anchor': o.anchor || 'start'}, o.parent || sc.top);
      n.textContent = text;
      const id = 'nc' + notes.length, cp = el('clipPath', {id}, E.defs), r = el('rect', {x: -9999, y: -9999, width: 0, height: 20000}, cp);
      n.setAttribute('clip-path', `url(#${id})`);
      notes.push({n, card, r, t0, dur: o.dur || 0.35, until: o.until == null ? sc.until : o.until, li: notes.length, sc});
      return n;
    }

    on((t) => {
      for (const sc of places) {
        const vis = t >= sc.from - 0.8 && t <= sc.until + 0.05;
        for (const g of [sc.clay, sc.ink, sc.top]) g.style.display = vis ? '' : 'none';
      }
      for (const s of stamps) {
        const q = clamp(prog(t, s.t0, s.t0 + (BLEED ? 0.42 : 0.32))), k = BLEED ? EASE.o(q) : EASE.back(q);
        if (q <= 0 || t > s.until) { s.p.style.display = 'none'; continue; }
        s.p.style.display = '';
        const bb = s.p.__bb || (s.p.__bb = s.p.getBBox()), cx = bb.x + bb.width / 2, by = s.flick ? bb.y + bb.height : bb.y + bb.height / 2;
        const fy = s.flick ? 1 + Math.sin(Math.floor(t * 12) * 1.7 + s.flick) * 0.06 : 1, sc0 = BLEED ? 0.96 + 0.04 * k : 0.55 + 0.45 * k;
        s.p.setAttribute('transform', `translate(${s.dx} ${s.dy}) translate(${cx} ${by}) scale(${sc0.toFixed(3)} ${(sc0 * fy).toFixed(3)}) translate(${-cx} ${-by})`);
        const out = s.out ? 1 - EASE.io2(prog(t, s.out, s.out + 0.3)) : 1;
        s.p.style.opacity = (BLEED ? k : Math.min(1, q * 3)) * s.op * (s.fade ? s.fade(t) : 1) * out;
      }
      const b = Math.floor(t * 8);
      for (const N of notes) {
        if (t < N.t0 - 0.01 || t > N.until) { N.n.style.display = N.card.style.display = 'none'; continue; }
        N.n.style.display = N.card.style.display = '';
        const bb = N.n.__bb || (N.n.__bb = N.n.getBBox());
        N.r.setAttribute('x', bb.x - 20); N.r.setAttribute('width', (bb.width + 40) * EASE.io2(prog(t, N.t0, N.t0 + N.dur)));
        const ck = EASE.back(clamp(prog(t, N.t0, N.t0 + 0.2))), pad = bb.height * 0.22;
        N.card.setAttribute('x', bb.x - pad * 1.4); N.card.setAttribute('y', bb.y - pad * 0.6); N.card.setAttribute('width', bb.width + pad * 2.8); N.card.setAttribute('height', bb.height + pad * 1.2);
        N.card.style.transformBox = 'fill-box'; N.card.style.transformOrigin = '50% 50%'; N.card.style.scale = ck.toFixed(3); N.card.style.rotate = ((N.li % 2 ? 1 : -1) * 1.5).toFixed(1) + 'deg';
        const len = N.n.textContent.length; let prev = 0; const dy = [], rot = [];
        for (let i = 0; i < len; i++) { const o = (hh(i + N.li * 13, b) - 0.5) * 3.2; dy.push((o - prev).toFixed(2)); prev = o; rot.push(((hh(i + N.li * 7, b + 99) - 0.5) * 7).toFixed(1)); }
        N.n.setAttribute('dy', dy.join(' ')); N.n.setAttribute('rotate', rot.join(' '));
        N.n.style.transformBox = 'fill-box'; N.n.style.transformOrigin = '0% 50%';
        N.n.style.rotate = (Math.sin(t * 1.6 + N.li * 0.8) * 1.2).toFixed(2) + 'deg';
        // пометка всегда целиком в кадре: если камера её обрезает — сдвигаем внутрь (в мировых единицах)
        const bob = Math.sin(t * 2.1 + N.li) * 2, s = E.camAt(t).s;
        N.n.style.translate = N.card.style.translate = `0 ${bob.toFixed(1)}px`;
        const C = E.camAt(t), Y0 = N.sc.Y0;
        const L = (bb.x - C.x) * s + 540, Rr = (bb.x + bb.width - C.x) * s + 540, Tp = (bb.y + Y0 - C.y) * s + 960, Bt = (bb.y + bb.height + Y0 - C.y) * s + 960;
        const fx = Math.max(0, SAFE.l - L) - Math.max(0, Rr - SAFE.r), fy = Math.max(0, SAFE.t - Tp) - Math.max(0, Bt - SAFE.b);
        if (fx || fy) N.n.style.translate = N.card.style.translate = `${(fx / s).toFixed(1)}px ${(bob + fy / s).toFixed(1)}px`;
      }
    });
    return {place, ink, clay, hatch, note, stamps};
  };
})(window);
