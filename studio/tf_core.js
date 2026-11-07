/* tf_core.js — движок шортса «язык и качели»: кадры-планы, камера, подписи по времени, стоп-кадр, зерно, список звуков. */
(function (G) {
  const {mk} = G.GEOM2, L2 = G.LOOK2;
  const TF = {DUR: 41.3, FPS: 30, shots: [], ui: [], sfx: [], inits: []};
  TF.D = document.querySelector('#sv defs'); TF.W = document.getElementById('world');
  TF.UD = document.querySelector('#ui defs'); TF.U = document.getElementById('uiw');
  TF.shot = (o) => TF.shots.push(o);
  TF.cap = (o, t0, t1) => { const c = L2.caption(TF.U, o); TF.ui.push({c, t0, t1, fin: o.fin, fout: o.fout}); return c; };
  TF.bub = (o, t0, t1) => { const c = L2.bubble(TF.U, o); TF.ui.push({c, t0, t1, fin: o.fin || 0.16, fout: o.fout || 0.14}); return c; };
  TF.sound = (id, t, o = {}) => TF.sfx.push(Object.assign({id, t}, o));
  // стоп-кадр 8.05 … 15.3: цвет уходит в сепию, снег замирает
  TF.FZ0 = 8.05; TF.FZ1 = 15.3;
  TF.freezeK = (t) => L2.ss(TF.FZ0, TF.FZ0 + 0.22, t) * (1 - L2.ss(TF.FZ1, TF.FZ1 + 0.35, t));
  // голос Сергея: ролик идёт в новом времени T (data/tongue_frost.warp.js — tools/voice_tongue.py), картинка написана в старом t.
  // TF.old(T) — кусочно-линейная карта; фон (снег, зерно, хвосты, пар, пылинки, часы, дрожь телефона) живёт по TF.T.
  const WP = G.TF_WARP && !/[?&]nowarp=1/.test(location.search) ? G.TF_WARP : null, KN = WP ? WP.knots : [[0, 0], [TF.DUR, TF.DUR]];
  const lerpK = (x, a, b) => { for (let i = 0; i < KN.length - 1; i++) if (x <= KN[i + 1][a] || i === KN.length - 2) return KN[i][b] + ((x - KN[i][a]) * (KN[i + 1][b] - KN[i][b])) / (KN[i + 1][a] - KN[i][a]); };
  TF.old = (T) => lerpK(T, 1, 0); TF.nw = (t) => lerpK(t, 0, 1);
  TF.DURN = WP ? WP.dur : TF.DUR; TF.T = 0;
  const NZ0 = TF.nw(TF.FZ0), NZ1 = TF.nw(TF.FZ1);
  TF.ts = () => { const T = TF.T; return T < NZ0 ? T : T < NZ1 ? NZ0 : T - (NZ1 - NZ0); }; // снег стоит только на стоп-кадре
  TF.camT = (z, fx, fy, px = 0, py = 0) => `translate(${(fx + px).toFixed(2)} ${(fy + py).toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-fy).toFixed(2)})`;
  // перевод точки мира плана в экран (для выносок интерфейса)
  TF.toScreen = (p, z, fx, fy, px = 0, py = 0) => [fx + px + (p[0] - fx) * z, fy + py + (p[1] - fy) * z];
  const grains = [...document.querySelectorAll('.gr')], sv = document.getElementById('sv');
  let cur = null;
  TF.seek = (t) => {
    t = Math.max(0, Math.min(TF.DUR - 1e-4, t)); TF.t = t; // до обновления UI: карточки читают TF.t
    const s = TF.shots.find((q) => t >= q.t0 && t < q.t1) || TF.shots[TF.shots.length - 1];
    if (cur !== s) { TF.shots.forEach((q) => q.g.setAttribute('display', q === s ? 'inline' : 'none')); cur = s; }
    s.update(t, t - s.t0);
    for (const u of TF.ui) { const k = u.k ? u.k(t) : L2.win(t, u.t0, u.t1, u.fin, u.fout); u.c.g.setAttribute('display', k > 0.001 ? 'inline' : 'none'); if (k > 0.001) u.c.set(k, u.extra ? u.extra(t) : {}); }
    const fz = TF.freezeK(t);
    sv.style.filter = fz > 0.001 ? `saturate(${(1 - 0.85 * fz).toFixed(3)}) sepia(${(0.42 * fz).toFixed(3)}) contrast(${(1 - 0.06 * fz).toFixed(3)}) brightness(${(1 - 0.04 * fz).toFixed(3)})` : 'none';
    const gi = Math.floor(TF.T * 12) % grains.length; grains.forEach((g, i) => (g.style.display = i === gi ? 'block' : 'none'));
  };
  TF.seekT = (T) => { T = Math.max(0, Math.min(TF.DURN - 1e-4, T)); TF.T = T; TF.seek(TF.old(T)); };
  TF.start = () => {
    TF.shots.forEach((s) => { s.g = mk('g', {display: 'none'}, TF.W); s.cam = mk('g', {}, s.g); s.build(s.g, s.cam); });
    G.__duration = TF.DURN; G.__seek = TF.seekT; G.__sfx = TF.sfx;
    G.__ready = (async () => {
      await Promise.all(['56px PF', '56px PFX', '56px CV', '700 56px CV', '56px MS', '700 56px MS', '600 56px MS'].map((f) => document.fonts.load(f)));
      await document.fonts.ready;
      for (const f of TF.inits) await f();
      TF.ui.forEach((u) => u.c.build && u.c.build());
      const q = new URLSearchParams(location.search); TF.seekT(+q.get('t') || 0);
    })();
  };
  G.TF = TF;
})(window);
