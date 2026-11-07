/* folk.js — рисованные человечки «тушь и глина» на суставах (по rigs.md скилла).
 * Конечности — трубки: снизу контур тушью, сверху глиняная заливка; голова — круг с лицом и причёской.
 * Позы — углы суставов; между ключами — плавная интерполяция, ходьба — процедурный цикл ног.
 * Всё считается из t (детерминировано): F.update(t) перерисовывает каждого.
 *
 *   const F = FOLK(E);
 *   const dad = F.person(parent, {h: 520, top: '#788C5D', hair: 'short'});
 *   dad.keys([[t, {x, y, pose: 'stand', look: 1, ...}], ...]);   // поза — имя из POSES или объект углов
 */
(function (G) {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#141413', SKIN = '#EFC9A8', PANTS = '#3E4A5E';
  // углы в градусах: 0 — вниз; плечо/бедро считаются от вертикали, локоть/колено — сгиб относительно сегмента
  const POSES = {
    stand: {lean: 0, sh: [8, -8], el: [6, -6], hp: [3, -3], kn: [0, 0]},
    reach: {lean: 4, sh: [8, -80], el: [6, -10], hp: [3, -3], kn: [0, 0]},
    stop: {lean: -3, sh: [8, -88], el: [6, -85], hp: [3, -3], kn: [0, 0]},
    kneel: {lean: 18, sh: [-30, -70], el: [-10, -20], hp: [-80, 20], kn: [100, 90], drop: 0.2},
    armsUp: {lean: 0, sh: [160, -160], el: [10, -10], hp: [4, -4], kn: [0, 0]},
    hug: {lean: 6, sh: [-40, -50], el: [-80, -80], hp: [3, -3], kn: [0, 0]},
    warm: {lean: 10, sh: [-55, -70], el: [-25, -20], hp: [3, -3], kn: [0, 0]},
    sit: {lean: 4, sh: [-20, -25], el: [-60, -60], hp: [-85, -80], kn: [85, 80], drop: 0.24},
    carry: {lean: 2, sh: [-35, -35], el: [-60, -60], hp: [3, -3], kn: [0, 0]},
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const rad = (d) => (d * Math.PI) / 180;
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
  const mixPose = (a, b, u) => {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const va = a[k] ?? (Array.isArray(b[k]) ? [0, 0] : 0), vb = b[k] ?? (Array.isArray(a[k]) ? [0, 0] : 0);
      o[k] = Array.isArray(va) ? [lerp(va[0], vb[0], u), lerp(va[1], vb[1], u)] : lerp(va, vb, u);
    }
    return o;
  };

  G.FOLK = function (E) {
    const people = [];

    function person(parent, o) {
      // style 'line' — рисовка как в эталоне «тушь и глина»: тонкий контур тушью, ноги и руки одной линией, глина со сдвигом
      const LINE = o.style === 'line';
      const H = o.h || 500, g = el('g', LINE ? {filter: 'url(#inkRough)'} : {}, parent), tube = H * 0.07, out = 5;
      // слои: дальние конечности → тело → ближние → голова
      const L = (cls) => ({ink: el('path', {fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, g), fill: el('path', {fill: 'none', stroke: cls, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#clayTex)'}, g)});
      const legB = L(o.pants || PANTS), legF = L(o.pants || PANTS), armB = L(o.top);
      const feetG = el('g', {}, g);
      const body = {ink: el('path', {fill: INK}, g), fill: el('path', {fill: o.top, filter: 'url(#clayTex)'}, g), seam: el('path', {fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}, g)};
      const armF = L(o.top);
      const hands = [0, 1].map(() => el('circle', {fill: SKIN, stroke: INK, 'stroke-width': 4}, g));
      const feet = [0, 1].map(() => el('ellipse', {fill: INK}, feetG));
      const hood = el('path', {fill: o.top, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', filter: 'url(#clayTex)', style: LINE ? '' : 'display:none'}, g); // капюшон за шеей
      const head = el('g', {}, g);
      const hairBack = el('path', {fill: o.hairColor || '#2A2420', stroke: INK, 'stroke-width': 4}, head);
      const faceClay = el('circle', {fill: SKIN, filter: 'url(#clayTex)', transform: 'translate(0 0)', style: LINE ? '' : 'display:none'}, head);
      const face = el('circle', LINE ? {fill: 'none', stroke: INK, 'stroke-width': 5.5} : {fill: SKIN, stroke: INK, 'stroke-width': 5, filter: 'url(#clayTex)'}, head);
      const hair = el('path', {fill: o.hairColor || '#2A2420', stroke: INK, 'stroke-width': LINE ? 4.5 : 4, 'stroke-linejoin': 'round'}, head);
      const strands = el('path', {fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round', style: LINE ? '' : 'display:none'}, head);
      const ear = el('circle', {style: 'display:none'}, head);
      const eyes = [0, 1].map(() => el('circle', {fill: INK}, head));
      const lids = el('path', {fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round'}, head);
      const mouth = el('path', {fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round'}, head);
      const extra = el('path', {fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round'}, head);
      const breath = el('path', {fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '2 9', opacity: 0}, g);
      const P = {g, H, o, keysList: [[0, {x: 0, y: 0, pose: 'stand'}]]};

      P.keys = (list) => { P.keysList = list.map(([t, k]) => [t, k]); return P; };
      function state(t) {
        const K = P.keysList;
        let a = K[0], b = K[0];
        for (let i = 0; i < K.length; i++) { if (K[i][0] <= t) a = K[i]; if (K[i][0] > t) { b = K[i]; break; } b = K[i]; }
        const u = a === b ? 1 : ease((t - a[0]) / (b[0] - a[0]));
        const pa = typeof a[1].pose === 'string' ? POSES[a[1].pose] : a[1].pose || POSES.stand;
        const pb = typeof b[1].pose === 'string' ? POSES[b[1].pose] : b[1].pose || POSES.stand;
        const num = (k, d) => lerp(a[1][k] ?? d, b[1][k] ?? a[1][k] ?? d, u);
        // ходьба: если x меняется между ключами — ноги шагают, тело подпрыгивает
        const walking = Math.abs((b[1].x ?? 0) - (a[1].x ?? 0)) > 1 && u > 0 && u < 1;
        return {x: num('x', 0), y: num('y', 0), pose: mixPose(pa, pb, u), look: num('look', 1), eyes: num('eyes', 1), mouth: num('mouth', 0), shiver: num('shiver', 0), breath: num('breath', 0), sweater: num('sweater', 0), fade: num('fade', 1), walking, wt: t};
      }

      P.draw = (t) => {
        const S = state(t), p = S.pose, f = S.look >= 0 ? 1 : -1;
        if (S.fade <= 0.001) { g.style.display = 'none'; return; }
        g.style.display = ''; g.style.opacity = S.fade;
        const hipY = -H * (0.47 - (p.drop || 0)), ph = S.x / (H * 0.14), wc = S.walking ? Math.sin(ph) : 0, bob = S.walking ? Math.abs(Math.cos(ph)) * H * 0.01 : 0; // фаза шага — от пройденного пути: стопы не скользят
        const sway = Math.sin(t * 1.7 + (o.seed || 0)) * 0.6 + S.shiver * Math.sin(t * 2.6 + (o.seed || 0)) * 1.4;
        g.setAttribute('transform', `translate(${S.x.toFixed(1)} ${(S.y - bob).toFixed(1)})`);
        const lean = rad(p.lean + sway) * f;
        const hip = [0, hipY], neck = [Math.sin(lean) * H * 0.3, hipY - Math.cos(lean) * H * 0.3];
        const seg = (o0, ang, len) => [o0[0] + Math.sin(ang) * len, o0[1] + Math.cos(ang) * len];
        const limb = (base, a1, a2, l1, l2) => { const j = seg(base, a1, l1), e = seg(j, a1 + a2, l2); return [base, j, e]; };
        const breathe = Math.sin(t * 2.2 + (o.seed || 0)) * 0.012;
        // ноги: бедро → колено → стопа
        const legs = [0, 1].map((i) => {
          const sw = S.walking ? (i ? -1 : 1) * wc * 28 : 0, kn = S.walking ? Math.max(0, (i ? -1 : 1) * wc) * 30 : 0;
          return limb([hip[0] + (i ? -1 : 1) * H * 0.035, hip[1]], rad((p.hp[i] + sw) * -f), rad((p.kn[i] + kn) * -f), H * 0.24, H * 0.23); // отрицательный угол — вперёд, туда, куда смотрит
        });
        const shY = neck[1] + H * 0.035;
        const arms = [0, 1].map((i) => limb([neck[0] + (i ? -1 : 1) * H * 0.075 * f, shY], rad((p.sh[i] + (S.walking ? (i ? 1 : -1) * wc * 18 : 0)) * -f), rad(p.el[i] * -f), H * 0.17, H * 0.16));
        const poly = (pts) => 'M' + pts.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
        const tubeSet = (T, pts, w) => { T.ink.setAttribute('d', poly(pts)); T.ink.setAttribute('stroke-width', w + out * 2); T.fill.setAttribute('d', poly(pts)); T.fill.setAttribute('stroke-width', w); };
        // дальние — сторона, отвёрнутая от зрителя
        tubeSet(legB, legs[1], tube); tubeSet(legF, legs[0], tube);
        tubeSet(armB, arms[1], tube * 0.85); tubeSet(armF, arms[0], tube * 0.85);
        const SW = LINE && S.sweater > 0.5, topC = SW ? o.sweaterColor || '#788C5D' : o.top; // свитер надет поверх худи — меняется весь верх
        armB.fill.setAttribute('stroke', topC); armF.fill.setAttribute('stroke', topC); body.fill.setAttribute('fill', topC); hood.setAttribute('fill', o.top); hood.style.display = 'none';
        if (LINE) for (const T of [legB, legF, armB, armF]) { const w = tube * (T === armB || T === armF ? 0.5 : 0.6); T.ink.setAttribute('stroke-width', w + 10); T.fill.setAttribute('stroke-width', w); } // чёткие рукава и джинсы: заливка внутри контура
        // тело: мягкая трапеция свитера, дышит
        const w0 = H * 0.11 * (1 + breathe), w1 = H * (o.wide || 0.13) * (1 + breathe);
        const nx = -Math.cos(lean), ny = -Math.sin(lean);
        const c = (q, k, wv) => [q[0] + nx * wv * k, q[1] + ny * wv * k];
        const A = c(neck, 1, w0), Bq = c(neck, -1, w0), C2 = c(hip, -1, w1), D = c(hip, 1, w1);
        const torso = `M${A[0]} ${A[1] + 6}Q${neck[0]} ${neck[1] - 10} ${Bq[0]} ${Bq[1] + 6}L${C2[0]} ${C2[1] + H * 0.04}Q${hip[0]} ${hip[1] + H * 0.07} ${D[0]} ${D[1] + H * 0.04}Z`;
        let torsoD = torso;
        if (LINE) { // худи как в эталоне: покатые плечи, подол чуть шире, капюшон у шеи, карман
          const len = Math.hypot(neck[0] - hip[0], neck[1] - hip[1]), ux = (neck[0] - hip[0]) / len, uy = (neck[1] - hip[1]) / len;
          const pt = (q, kn, ku) => [q[0] + nx * kn + ux * ku, q[1] + ny * kn + uy * ku], F2 = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
          const ws = H * 0.13, wh = H * (o.wide || 0.145);
          const SL = pt(neck, ws, -H * 0.04), SR = pt(neck, -ws, -H * 0.04), HL = pt(hip, wh, -H * 0.05), HR = pt(hip, -wh, -H * 0.05);
          torsoD = `M${F2(pt(neck, H * 0.05, 0))}C${F2(pt(neck, ws * 0.75, H * 0.005))} ${F2(pt(SL, 0, H * 0.035))} ${F2(SL)}L${F2(HL)}Q${F2(pt(hip, 0, -H * 0.075))} ${F2(HR)}L${F2(SR)}C${F2(pt(SR, 0, H * 0.035))} ${F2(pt(neck, -ws * 0.75, H * 0.005))} ${F2(pt(neck, -H * 0.05, 0))}Z`;
          body.seam.setAttribute('d', `M${F2(pt(neck, H * 0.07, -H * 0.005))}Q${F2(pt(neck, 0, -H * 0.06))} ${F2(pt(neck, -H * 0.07, -H * 0.005))}M${F2(pt(hip, H * 0.07, H * 0.11))}L${F2(pt(hip, -H * 0.07, H * 0.11))}L${F2(pt(hip, -H * 0.06, H * 0.01))}L${F2(pt(hip, H * 0.06, H * 0.01))}Z`);
          body.seam.setAttribute('stroke-width', 4);
          if (SW) { let k = `M${F2(pt(neck, H * 0.06, -H * 0.02))}L${F2(pt(neck, -H * 0.06, -H * 0.02))}`; // ворот и вязаные ряды
            for (const v of [0.08, 0.14, 0.2]) { k += 'M'; for (let j = 0; j <= 8; j++) k += (j ? 'L' : '') + F2(pt(hip, H * (0.12 - j * 0.03), len * v + (j % 2 ? H * 0.012 : 0))); }
            body.seam.setAttribute('d', k + `M${F2(pt(hip, H * 0.13, -H * 0.02))}L${F2(pt(hip, -H * 0.13, -H * 0.02))}`); body.seam.setAttribute('stroke-width', 3); }
          // капюшон: мягкий ком за затылком
          const bk = pt(neck, -H * 0.03 * f, H * 0.02);
          hood.setAttribute('d', `M${F2(pt(neck, H * 0.06 * -f, -H * 0.01))}C${F2(pt(bk, -H * 0.1 * f, H * 0.1))} ${F2(pt(bk, H * 0.04 * f, H * 0.16))} ${F2(pt(neck, H * 0.07 * f, H * 0.03))}Z`);
        }
        body.fill.setAttribute('d', torsoD); body.ink.setAttribute('d', torsoD);
        if (LINE) { body.fill.setAttribute('transform', 'translate(2 2)'); body.ink.style.fill = 'none'; body.ink.style.stroke = INK; body.ink.style.strokeWidth = 6; body.ink.style.strokeLinejoin = 'round'; }
        else { body.ink.style.stroke = INK; body.ink.style.strokeWidth = out * 2; body.ink.style.strokeLinejoin = 'round'; }
        if (!LINE) body.seam.setAttribute('d', `M${neck[0] - nx * 4} ${neck[1] + 14}L${hip[0] + (neck[0] - hip[0]) * 0.1} ${hip[1] - 8}`);
        // кисти и стопы
        arms.forEach((a, i) => { hands[i].setAttribute('cx', a[2][0].toFixed(1)); hands[i].setAttribute('cy', a[2][1].toFixed(1)); hands[i].setAttribute('r', (H * (LINE ? 0.03 : 0.034)).toFixed(1)); if (LINE) { hands[i].setAttribute('fill', SKIN); hands[i].setAttribute('stroke-width', 3.5); } });
        legs.forEach((l, i) => { feet[i].setAttribute('cx', (l[2][0] + f * H * 0.025).toFixed(1)); feet[i].setAttribute('cy', (l[2][1] - (LINE ? H * 0.008 : 0)).toFixed(1)); feet[i].setAttribute('rx', (H * (LINE ? 0.038 : 0.045)).toFixed(1)); feet[i].setAttribute('ry', (H * (LINE ? 0.014 : 0.022)).toFixed(1)); if (LINE) { feet[i].setAttribute('fill', '#2A2F3A'); feet[i].setAttribute('stroke', INK); feet[i].setAttribute('stroke-width', 4.5); } });
        // голова
        const R = H * (LINE ? 0.11 : 0.095), hc = [neck[0] + Math.sin(lean) * R * 1.15, neck[1] - R * 1.05];
        head.setAttribute('transform', `translate(${hc[0].toFixed(1)} ${hc[1].toFixed(1)}) rotate(${((p.headTilt || 0) * f + sway * 0.6).toFixed(2)})`);
        face.setAttribute('r', R.toFixed(1)); faceClay.setAttribute('r', R.toFixed(1));
        strands.setAttribute('d', false ? `M${-R * 0.5} ${-R * 0.95}C${-R * 0.35} ${-R * 1.1} ${-R * 0.1} ${-R * 1.1} ${R * 0.05} ${-R * 0.98}M${R * 0.25} ${-R * 1.02}C${R * 0.4} ${-R * 1.12} ${R * 0.62} ${-R * 1.05} ${R * 0.7} ${-R * 0.85}` : '');
        const hs = o.hair || 'short';
        const hairs = {
          short: `M${-R * 1.02} ${-R * 0.1}C${-R * 1.1} ${-R * 0.9} ${-R * 0.3} ${-R * 1.35} ${R * 0.35} ${-R * 1.12}C${R * 0.9} ${-R * 1.15} ${R * 1.15} ${-R * 0.6} ${R * 1.02} ${-R * 0.15}C${R * 0.7} ${-R * 0.55} ${R * 0.2} ${-R * 0.5} ${-R * 0.1} ${-R * 0.7}C${-R * 0.4} ${-R * 0.45} ${-R * 0.8} ${-R * 0.4} ${-R * 1.02} ${-R * 0.1}Z`,
          bob: `M${-R * 1.1} ${R * 0.35}C${-R * 1.25} ${-R * 1.1} ${R * 1.25} ${-R * 1.1} ${R * 1.1} ${R * 0.35}C${R * 0.9} ${-R * 0.35} ${R * 0.2} ${-R * 0.55} ${-R * 0.3} ${-R * 0.75}C${-R * 0.5} ${-R * 0.4} ${-R * 0.9} ${-R * 0.2} ${-R * 1.1} ${R * 0.35}Z`,
          pigtails: `M${-R * 1.0} ${-R * 0.1}C${-R * 1.05} ${-R * 1.1} ${R * 1.05} ${-R * 1.1} ${R * 1.0} ${-R * 0.1}C${R * 0.6} ${-R * 0.6} ${-R * 0.6} ${-R * 0.6} ${-R * 1.0} ${-R * 0.1}Z M${R * 0.95} ${-R * 0.2}C${R * 1.6} ${-R * 0.1} ${R * 1.6} ${R * 0.6} ${R * 1.25} ${R * 0.75}C${R * 1.3} ${R * 0.3} ${R * 1.1} ${R * 0.1} ${R * 0.95} ${-R * 0.2}Z M${-R * 0.95} ${-R * 0.2}C${-R * 1.6} ${-R * 0.1} ${-R * 1.6} ${R * 0.6} ${-R * 1.25} ${R * 0.75}C${-R * 1.3} ${R * 0.3} ${-R * 1.1} ${R * 0.1} ${-R * 0.95} ${-R * 0.2}Z`,
          bun: `M${-R * 1.0} ${-R * 0.05}C${-R * 1.05} ${-R * 1.0} ${R * 1.05} ${-R * 1.0} ${R * 1.0} ${-R * 0.05}C${R * 0.5} ${-R * 0.5} ${-R * 0.5} ${-R * 0.5} ${-R * 1.0} ${-R * 0.05}Z M${-R * 0.42} ${-R * 1.1}a${R * 0.42} ${R * 0.36} 0 1 0 ${R * 0.84} 0a${R * 0.42} ${R * 0.36} 0 1 0 ${-R * 0.84} 0`,
        };
        hair.setAttribute('d', hairs[hs]);
        hairBack.setAttribute('d', hs === 'bob' ? `M${-R * 1.1} ${-R * 0.3}C${-R * 1.25} ${R * 0.3} ${-R * 1.15} ${R * 0.75} ${-R * 0.8} ${R * 0.8}H${R * 0.8}C${R * 1.15} ${R * 0.75} ${R * 1.25} ${R * 0.3} ${R * 1.1} ${-R * 0.3}Z` : '');
        ear.setAttribute('cx', (-R * 0.55 * f).toFixed(1)); ear.setAttribute('cy', (R * 0.08).toFixed(1)); ear.setAttribute('r', (R * 0.17).toFixed(1));
        if (false) hair.setAttribute('d', `M${-R * 1.04} ${R * 0.05}L${-R * 1.18} ${-R * 0.35}L${-R * 0.95} ${-R * 0.5}L${-R * 1.05} ${-R * 0.9}L${-R * 0.6} ${-R * 0.95}L${-R * 0.5} ${-R * 1.3}L${-R * 0.1} ${-R * 1.08}L${R * 0.25} ${-R * 1.32}L${R * 0.45} ${-R * 1.02}L${R * 0.9} ${-R * 1.05}L${R * 0.82} ${-R * 0.7}L${R * 1.12} ${-R * 0.45}L${R * 0.75} ${-R * 0.42}C${R * 0.4} ${-R * 0.62} ${-R * 0.2} ${-R * 0.55} ${-R * 0.45} ${-R * 0.35}C${-R * 0.6} ${-R * 0.25} ${-R * 0.7} ${-R * 0.1} ${-R * 0.75} ${R * 0.05}Z`); // лохматые пряди, как на листе персонажа
        const ex = R * 0.32 * f + R * 0.18 * f, ey = -R * 0.02, open = S.eyes;
        eyes.forEach((e, i) => { e.setAttribute('cx', (ex + (i ? -1 : 1) * R * 0.36 - R * 0.18 * f).toFixed(1)); e.setAttribute('cy', ey.toFixed(1)); e.setAttribute('r', (R * 0.1 * Math.max(0.15, open)).toFixed(1)); e.style.opacity = open > 0.25 ? 1 : 0; });
        lids.setAttribute('d', open > 0.25 ? '' : eyes.map((e, i) => { const cx = +e.getAttribute('cx'); return `M${cx - R * 0.14} ${ey}Q${cx} ${ey + R * 0.12} ${cx + R * 0.14} ${ey}`; }).join(''));
        const mo = S.mouth;
        mouth.setAttribute('d', mo > 0.5 ? `M${ex - R * 0.12} ${R * 0.4}a${R * 0.12} ${R * 0.09} 0 1 0 ${R * 0.24} 0a${R * 0.12} ${R * 0.09} 0 1 0 ${-R * 0.24} 0` : `M${ex - R * 0.16} ${R * 0.42}Q${ex} ${R * (0.42 + 0.08 * (1 - 2 * Math.max(0, -mo)))} ${ex + R * 0.16} ${R * 0.42}`);
        extra.setAttribute('d', o.glasses ? `M${ex - R * 0.55} ${ey}a${R * 0.2} ${R * 0.2} 0 1 0 ${R * 0.4} 0a${R * 0.2} ${R * 0.2} 0 1 0 ${-R * 0.4} 0M${ex + R * 0.15} ${ey}a${R * 0.2} ${R * 0.2} 0 1 0 ${R * 0.4} 0a${R * 0.2} ${R * 0.2} 0 1 0 ${-R * 0.4} 0M${ex - R * 0.15} ${ey}H${ex + R * 0.15}` : o.beard ? `M${-R * 0.55 * f} ${R * 0.45}Q${ex} ${R * 1.05} ${R * 0.9 * f} ${R * 0.35}` : '');
        // пар изо рта на холоде
        const bph = ((t * 0.9 + (o.seed || 0) * 0.37) % 1);
        const bx = hc[0] + f * R * 1.1, by = hc[1] + R * 0.4;
        breath.setAttribute('d', `M${bx} ${by}c${f * 18} ${-10 - bph * 30} ${f * 40} ${-6 - bph * 40} ${f * (50 + bph * 30)} ${-24 - bph * 50}`);
        breath.style.opacity = S.breath * (1 - bph) * 0.9;
      };
      people.push(P);
      return P;
    }
    E.on((t) => people.forEach((p) => p.draw(t)));
    return {person, POSES};
  };
})(window);
