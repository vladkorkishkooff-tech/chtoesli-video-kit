// Проверка: весь видимый текст целиком в кадре. node tools/text_check.cjs <page.html> [шаг_с]
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, step = '0.2'] = process.argv.slice(2), root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  const dur = await p.evaluate(() => window.__duration), bad = {};
  for (let t = 0; t < dur; t += +step) {
    const hits = await p.evaluate((tt) => { window.__seek(tt); const out = [];
      for (const n of document.querySelectorAll('text')) { if (!n.textContent.trim()) continue; const cs = getComputedStyle(n); let e = n, vis = true; while (e && e.nodeType === 1) { const st = getComputedStyle(e); if (st.display === 'none' || +st.opacity < 0.2) { vis = false; break; } e = e.parentNode; } if (!vis) continue;
        const r = n.getBoundingClientRect(); if (r.width < 2) continue; if (r.left < 0 || r.right > 1080 || r.top < 0 || r.bottom > 1920) out.push(n.textContent.trim().slice(0, 24)); }
      return out; }, t);
    hits.forEach((h) => (bad[h] = bad[h] || []).push(+t.toFixed(1)));
  }
  console.log(Object.keys(bad).length ? Object.entries(bad).map(([k, v]) => `${k}: ${v[0]}…${v[v.length - 1]} (${v.length})`).join('\n') : 'OK: весь текст в кадре');
  await b.close(); srv.close();
});
