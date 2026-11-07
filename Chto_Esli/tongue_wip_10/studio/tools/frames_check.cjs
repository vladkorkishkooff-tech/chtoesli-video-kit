// Ищет элементы, вылезающие из своих «рамок»: для каждой видимой залитой плашки (rect/circle) берёт
// элементы, нарисованные после неё в той же группе, центр которых внутри плашки, и сравнивает габариты.
// node tools/frames_check.cjs <page.html> <t0> <t1> <шаг> > out.json   (из studio/; много ложных срабатываний у мира «W» — окна, клавиши, скотч)
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, a, b, st] = process.argv.slice(2), root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const br = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined});
  const p = await br.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  const out = [];
  for (let t = +a; t <= +b + 1e-9; t += +st) {
    await p.evaluate((tt) => window.__seek(tt), t);
    const res = await p.evaluate(() => {
      const op = (el) => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentNode) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; const ao = e.getAttribute && e.getAttribute('opacity'); if (ao != null && cs.opacity === '1') o *= +ao; const fo = e.getAttribute && e.getAttribute('fill-opacity'); if (fo != null && e === el) o *= +fo; } return o; };
      const filled = (el) => { const f = getComputedStyle(el).fill; return f && f !== 'none' && !/rgba\(.*,\s*0\)/.test(f); };
      const R = (el) => { const r = el.getBoundingClientRect(); return {x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, w: r.width, h: r.height}; };
      const desc = (el) => { const tg = el.tagName; const sv = el.closest('#ui') ? 'UI ' : 'W '; if (tg === 'text') return sv + 'text «' + el.textContent.slice(0, 40) + '»'; if (tg === 'path') return sv + 'path ' + (el.getAttribute('d') || '').slice(0, 50); return sv + tg + ' ' + ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'fill'].map((k) => el.getAttribute(k) != null ? k + '=' + el.getAttribute(k) : '').filter(Boolean).join(' '); };
      const all = [...document.querySelectorAll('#sv *, #ui *')].filter((e) => ['rect', 'circle', 'ellipse', 'path', 'text', 'line', 'polyline', 'polygon', 'image'].includes(e.tagName) && !e.closest('defs, clipPath, mask'));
      const vis = all.map((e) => ({e, o: op(e)})).filter((v) => v.o > 0.5).map((v) => ({...v, r: R(v.e)})).filter((v) => v.r.w > 0 && v.r.h > 0 && v.r.x1 > 0 && v.r.x0 < 1080 && v.r.y1 > 0 && v.r.y0 < 1920);
      const cont = vis.filter((v) => (v.e.tagName === 'rect' || v.e.tagName === 'circle') && filled(v.e) && v.r.w >= 40 && v.r.h >= 30 && !(v.r.w > 1000 && v.r.h > 1700) && !/url\(/.test(v.e.getAttribute('fill') || ''));
      const rep = [];
      for (const c of cont) {
        const par = c.e.parentNode;
        for (const v of vis) {
          if (v === c || !par.contains(v.e) || !(c.e.compareDocumentPosition(v.e) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
          const cx = (v.r.x0 + v.r.x1) / 2, cy = (v.r.y0 + v.r.y1) / 2;
          if (cx < c.r.x0 || cx > c.r.x1 || cy < c.r.y0 || cy > c.r.y1) continue;
          if (v.r.w > c.r.w * 1.02 && v.r.h > c.r.h * 1.02) continue; // больше самой плашки — это не содержимое
          let ov;
          if (c.e.tagName === 'circle') { const cr = c.r.w / 2, ccx = (c.r.x0 + c.r.x1) / 2, ccy = (c.r.y0 + c.r.y1) / 2;
            const far = Math.max(...[[v.r.x0, v.r.y0], [v.r.x1, v.r.y0], [v.r.x0, v.r.y1], [v.r.x1, v.r.y1]].map(([x, y]) => Math.hypot(x - ccx, y - ccy)));
            ov = {circle: +(far - cr).toFixed(1)}; if (far - cr < (v.e.tagName === 'text' ? -4 : 1)) continue; }
          else { const m = {l: c.r.x0 - v.r.x0, r: v.r.x1 - c.r.x1, t: c.r.y0 - v.r.y0, b: v.r.y1 - c.r.y1};
            const isT = v.e.tagName === 'text', mx = Math.max(m.l, m.r, m.t, m.b);
            // текст: ближе 12 px к краю; рисунок: вылез > 0,5 px или прижат к краю (< 4 px), когда с другой стороны втрое больше места
            const pressed = !isT && ((-m.r < 4 && -m.l > 3 * Math.max(4, -m.r)) || (-m.l < 4 && -m.r > 3 * Math.max(4, -m.l)) || (-m.t < 4 && -m.b > 3 * Math.max(4, -m.t)) || (-m.b < 4 && -m.t > 3 * Math.max(4, -m.b)));
            if (!(isT ? mx > -12 : (mx > 0.5 || pressed))) continue; ov = Object.fromEntries(Object.entries(m).map(([k, x]) => [k, +x.toFixed(1)])); if (pressed && mx <= 0.5) ov.pressed = 1; }
          rep.push({c: desc(c.e), cr: [c.r.x0, c.r.y0, c.r.x1, c.r.y1].map(Math.round), e: desc(v.e), er: [v.r.x0, v.r.y0, v.r.x1, v.r.y1].map(Math.round), ov});
        }
      }
      return rep;
    });
    out.push({t: +t.toFixed(2), rep: res});
  }
  console.log(JSON.stringify(out));
  await br.close(); srv.close(); process.exit(0);
});
