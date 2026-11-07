/* core.js — «Ink & Clay» engine for the WWII film. One world SVG, one camera, one line.
 * Everything is a pure function of t (seek-safe): window.__seek(t) → same frame, forward or backward.
 *
 *   E.seg(d, t0, t1, {w, color, ease, cls, fade:[t,dur]})  → a line piece that draws itself between t0..t1
 *   E.cam(t, x, y, s) / E.cam(t, 'tip', null, s, {lead})   → camera keys (world centre + zoom; 'tip' follows the pen)
 *   E.scene(t0, t1, build(g, S))                            → group visible only in its window (+margin)
 *   E.txt / E.img / E.evidence / E.on(fn)                   → elements + per-frame updaters
 *   E.sfx(t, name, opts)                                    → one EVENTS list for picture and sound (sfx.js)
 */
(function (G) {
  const NS = "http://www.w3.org/2000/svg", W = 1080, H = 1920; // вертикаль Shorts (копия oneline/core.js из скилла)
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (t, t0, t1) => clamp((t - t0) / Math.max(1e-6, t1 - t0));
  const EASE = {
    lin: p => p,
    io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    io2: p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
    o: p => 1 - Math.pow(1 - p, 3),
    o5: p => 1 - Math.pow(1 - p, 5),
    i: p => p * p * p,
    // handwriting: quick attack, steady middle, soft landing
    ink: p => { const a = 0.12, b = 0.85; if (p < a) return 0.5 * (p / a) * (p / a) * a * 1.0 / 0.5 * 0.5; if (p > b) { const q = (p - b) / (1 - b); return b + (1 - b) * (1 - (1 - q) * (1 - q)); } return p; },
    back: p => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const E = { W, H, NS, clamp, prog, EASE, mul, segs: [], cams: [], scenes: [], ups: [], EVENTS: [], dur: 10, t: 0, lw: () => 6 };

  E.el = function (tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) { if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); }
    (parent || E.world).appendChild(n); return n;
  };
  E.on = fn => E.ups.push(fn);
  E.sfx = (t, name, o) => E.EVENTS.push([+t.toFixed(3), name, o || {}]);

  // ---------- the line ----------
  E.seg = function (d, t0, t1, o) {
    o = o || {};
    const p = E.el("path", { d, fill: "none", stroke: o.color || "var(--clay)", "stroke-width": o.w === "auto" ? 6 : (o.w || 7), "stroke-linecap": "round", "stroke-linejoin": "round", class: "ink " + (o.cls || "") }, o.parent || E.lineLayer);
    const L = p.getTotalLength(); p.style.strokeDasharray = L + " " + (L + 10);
    const s = { p, d, t0, t1, L, ease: EASE[o.ease || "io2"] || o.ease, o, main: o.main !== false };
    s.at = t => s.ease(prog(t, t0, t1));
    s.pt = q => { const P = p.getPointAtLength(clamp(q) * L), P2 = p.getPointAtLength(clamp(q + 0.002) * L); return { x: P.x, y: P.y, a: Math.atan2(P2.y - P.y, P2.x - P.x) }; };
    E.segs.push(s); return s;
  };
  E.tip = function (t) { // pen tip of the main line at time t (latest segment that has started)
    let cur = null; for (const s of E.segs) if (s.main && t >= s.t0 - 1e-6) { if (!cur || s.t0 >= cur.t0) cur = s; }
    if (!cur) cur = E.segs.find(s => s.main) || null; if (!cur) return { x: 0, y: 0, a: 0 };
    return cur.pt(cur.at(t));
  };

  // ---------- camera ----------
  // key: [t, x|'tip', y, s, {lead}] — between keys: eased (io2) position, log-space zoom
  E.cam = (t, x, y, s, o) => E.cams.push({ t, x, y, s, o: o || {} });
  function keyPos(k, t) {
    if (typeof k.x === "function") { let ax = 0, ay = 0; const lag = k.o.lag == null ? 0.5 : k.o.lag; for (let i = 0; i <= 8; i++) { const p = k.x(t - lag * i / 8); ax += p[0]; ay += p[1]; } return [ax / 9 + (k.o.dx || 0), ay / 9 + (k.o.dy || 0)]; }
    if (k.x !== "tip") return [k.x, k.y];
    let ax = 0, ay = 0, n = 0; const lead = k.o.lead || 0, lag = k.o.lag == null ? 0.5 : k.o.lag;
    for (let i = 0; i <= 8; i++) { const P = E.tip(t + lead - lag * i / 8); ax += P.x; ay += P.y; n++; }
    return [ax / n + (k.o.dx || 0), ay / n + (k.o.dy || 0)];
  }
  E.camAt = function (t) {
    const K = E.cams; if (!K.length) return { x: W / 2, y: H / 2, s: 1 };
    if (t <= K[0].t) { const p = keyPos(K[0], t); return { x: p[0], y: p[1], s: K[0].s }; }
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (t <= b.t) {
        const q = (b.o.ease ? EASE[b.o.ease] : EASE.io2)(prog(t, a.t, b.t)), pa = keyPos(a, t), pb = keyPos(b, t);
        return { x: pa[0] + (pb[0] - pa[0]) * q, y: pa[1] + (pb[1] - pa[1]) * q, s: a.s * Math.pow(b.s / a.s, q) };
      }
    }
    const L = K[K.length - 1], p = keyPos(L, t); return { x: p[0], y: p[1], s: L.s };
  };

  // ---------- scenes ----------
  E.scene = function (t0, t1, build, o) {
    const g = E.el("g", { class: "scene" }, (o && o.parent) || E.sceneLayer);
    const S = { t0, t1, g, ups: [], margin: (o && o.margin) != null ? o.margin : 1.5 };
    S.on = fn => S.ups.push(fn);
    build(g, S); E.scenes.push(S); return S;
  };

  // ---------- text ----------
  // anim: 'write' (left→right reveal), 'rise' (fade-up), 'words' (stagger), 'none'
  E.txt = function (g, x, y, str, o) {
    o = o || {};
    const n = E.el("text", { x, y, "font-size": o.size || 64, "font-family": o.font || "var(--serif)", fill: o.color || "var(--ink)", "text-anchor": o.anchor || "start", "font-weight": o.weight || 400, "letter-spacing": o.ls || 0, class: "t " + (o.cls || "") }, g);
    if (o.words) {
      str.split(" ").forEach((w, i) => { const ts = E.el("tspan", { text: (i ? " " : "") + w }, n); ts.dataset.i = i; });
    } else n.textContent = str;
    const t0 = o.t0 == null ? 0 : o.t0, t1 = o.t1 == null ? 1e9 : o.t1, an = o.anim || "rise", dur = o.dur || 0.6, out = o.out || 0.4;
    let clipRect = null;
    if (an === "write") {
      const id = "c" + Math.random().toString(36).slice(2, 9), cp = E.el("clipPath", { id }, E.defs);
      clipRect = E.el("rect", { x: 0, y: -2000, width: 0, height: 4000 }, cp); n.setAttribute("clip-path", `url(#${id})`);
    }
    const up = t => {
      const pin = prog(t, t0, t0 + dur), pout = prog(t, t1 - out, t1);
      const vis = t >= t0 - 0.01 && t <= t1 + 0.01;
      n.style.display = vis ? "" : "none"; if (!vis) return;
      if (an === "write") {
        const bb = n.getBBox(); clipRect.setAttribute("x", bb.x - 20); clipRect.setAttribute("width", (bb.width + 40) * EASE.io2(pin));
        n.style.opacity = 1 - EASE.io2(pout);
      } else if (o.words) {
        const sp = [...n.children], k = o.stagger || 0.12;
        sp.forEach((s, i) => { const q = EASE.o(prog(t, t0 + i * k, t0 + i * k + dur)); s.style.opacity = q * (1 - EASE.io2(pout)); });
      } else {
        const q = EASE.o(pin); n.style.opacity = q * (1 - EASE.io2(pout));
        n.setAttribute("transform", `translate(0 ${((1 - q) * 18 + EASE.io2(pout) * -10).toFixed(2)})`);
      }
    };
    E.on(up); return n;
  };

  // ---------- images & evidence ----------
  E.img = function (g, href, x, y, w, h, o) {
    o = o || {};
    const n = E.el("image", { href, x, y, width: w, height: h, preserveAspectRatio: o.par || "xMidYMid meet" }, g);
    if (o.t0 != null) E.on(t => { const q = EASE.o(prog(t, o.t0, o.t0 + (o.dur || .6))), z = 1 - EASE.io2(prog(t, (o.t1 || 1e9) - .5, o.t1 || 1e9)); n.style.opacity = q * z; n.style.display = (t < o.t0 - .01 || t > (o.t1 || 1e9) + .01) ? "none" : ""; });
    return n;
  };
  // a real document/photo pinned on the paper: card + tape + caption + source line
  E.evidence = function (g, href, x, y, w, h, o) {
    o = o || {}; const rot = o.rot == null ? -2 : o.rot;
    const c = E.el("g", { class: "evi" }, g);
    E.el("rect", { x: x - 18, y: y - 18, width: w + 36, height: h + 36 + (o.caption ? 70 : 0), fill: "#FBFAF6", filter: "url(#cardShadow)" }, c);
    E.el("image", { href, x, y, width: w, height: h, preserveAspectRatio: "xMidYMid slice", class: "evimg" }, c);
    E.el("rect", { x, y, width: w, height: h, fill: "none", stroke: "#14141322", "stroke-width": 1.5 }, c);
    if (o.caption) E.el("text", { x: x, y: y + h + 46, "font-size": 30, "font-family": "var(--sans)", fill: "var(--ink)", text: o.caption }, c);
    if (o.src) E.el("text", { x: x + w, y: y + h + 46, "font-size": 20, "font-family": "var(--sans)", fill: "#141413aa", "text-anchor": "end", text: o.src }, c);
    for (const [tx, ty, tr] of [[x + w * 0.5 - 70, y - 34, 3], [x + w - 60, y + h - 10, -38]].slice(0, o.tape === 1 ? 1 : 2))
      E.el("rect", { x: tx, y: ty, width: 140, height: 40, fill: "#E3DACCcc", transform: `rotate(${tr} ${tx + 70} ${ty + 20})` }, c);
    const cx = x + w / 2, cy = y + h / 2, t0 = o.t0 || 0, t1 = o.t1 || 1e9;
    E.on(t => {
      const vis = t >= t0 - .01 && t <= t1 + .01; c.style.display = vis ? "" : "none"; if (!vis) return;
      const q = EASE.back(clamp(prog(t, t0, t0 + .7))), z = EASE.io2(prog(t, t1 - .6, t1));
      const dy = (1 - q) * 160 + z * -120, r = rot + (1 - q) * 9 + z * -6, s = 0.92 + 0.08 * q;
      c.setAttribute("transform", `translate(0 ${dy.toFixed(1)}) rotate(${r.toFixed(2)} ${cx} ${cy}) translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})`);
      c.style.opacity = clamp(prog(t, t0, t0 + .25)) * (1 - z);
    });
    if (o.sfx !== false) { E.sfx(t0 + 0.05, "paper", { dur: 0.35, gain: 0.7 }); E.sfx(t0 + 0.55, "thud", { gain: 0.35 }); }
    return c;
  };

  // ---------- dots (one path per batch: fast) ----------
  E.dots = function (g, pts, r, o) {
    o = o || {}; const B = o.batches || 40, paths = [];
    for (let b = 0; b < B; b++) {
      let d = ""; for (let i = b; i < pts.length; i += B) { const [x, y] = pts[i]; d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; }
      paths.push(E.el("path", { d, fill: o.color || "var(--ink)" }, g));
    }
    return paths;
  };

  // ---------- frame ----------
  E.render = function (t) {
    E.t = t;
    for (const s of E.segs) {
      const q = s.at(t); s.p.style.strokeDashoffset = (s.L * (1 - q)).toFixed(2);
      if (s.o.w === "auto") s.p.setAttribute("stroke-width", E.lw(t).toFixed(2));
      let op = q > 0 ? 1 : 0;
      if (s.o.fade) op *= 1 - EASE.io2(prog(t, s.o.fade[0], s.o.fade[0] + (s.o.fade[1] || .8)));
      s.p.style.opacity = op; s.p.style.display = op <= 0.001 ? "none" : "";
    }
    for (const S of E.scenes) {
      const vis = t >= S.t0 - S.margin && t <= S.t1 + S.margin; S.g.style.display = vis ? "" : "none";
      if (vis) for (const f of S.ups) f(t, prog(t, S.t0, S.t1));
    }
    for (const f of E.ups) f(t);
    const C = E.camAt(t);
    E.world.setAttribute("transform", `translate(${W / 2} ${H / 2}) scale(${C.s.toFixed(5)}) translate(${(-C.x).toFixed(2)} ${(-C.y).toFixed(2)})`);
    E.paper.setAttribute("x", (C.x - W / 2 / C.s) - 4000); // paper is world-space; keep pattern covering the view
    E.paper.setAttribute("y", (C.y - H / 2 / C.s) - 4000);
    if (E.life) E.life(t);
    if (E.after) E.after(t, C);
  };

  E.init = function (o) {
    E.svg = document.getElementById("svg"); E.defs = E.svg.querySelector("defs");
    E.world = document.getElementById("world");
    E.paper = E.el("rect", { x: -4000, y: -4000, width: 60000, height: 60000, fill: "url(#paperPat)" }, E.world);
    E.sceneLayer = E.el("g", { id: "scenes" }, E.world);
    E.lineLayer = E.el("g", { id: "line", filter: "url(#inkRough)" }, E.world);
    E.topLayer = E.el("g", { id: "top" }, E.world);
    E.dur = o.dur;
  };
  E.start = function () {
    if (G.CAMLIFE) E.life = G.CAMLIFE.attach(document.getElementById("stage"), { drift: { x: 5, y: 3.5, rot: 0.18, seed: 11 }, push: 0.012, period: 9 });
    G.__duration = E.dur;
    G.__seek = t => { E.render(t); return 0; };
    G.__audioWav = async () => G.SFX.toWavBase64(await G.SFX.render(E.EVENTS.slice().sort((a, b) => a[0] - b[0]), E.dur, {}));
    G.__events = () => E.EVENTS.slice().sort((a, b) => a[0] - b[0]);
    const q = /[?&]t=([\d.]+)/.exec(location.search);
    if (q) E.render(+q[1]);
    else { const st = performance.now(), from = +(/[?&]from=([\d.]+)/.exec(location.search) || [0, 0])[1]; const loop = () => { const t = from + (performance.now() - st) / 1000; E.render(t % E.dur); requestAnimationFrame(loop); }; loop(); }
  };
  G.E = E;
})(window);
