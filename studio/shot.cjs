// Кадр страницы стиль-лаборатории в PNG: node shot.cjs <page.html> <out.png> [t]
// Страница отдаётся локальным сервером (ES-модули не грузятся с file://), рисует себя через window.__seek(t).
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, out, t = '0'] = process.argv.slice(2);
const root = __dirname;
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json'};
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d))));
});
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']});
  const p = await b.newPage({viewport: {width: +(process.env.SHOT_W || 1080), height: +(process.env.SHOT_H || 1920)}});
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=${t}&render=1`, {waitUntil: 'load'});
  await p.evaluate(async (tt) => { await document.fonts.ready; if (window.__ready) await window.__ready; if (window.__seek) window.__seek(+tt); }, t);
  await p.screenshot({path: out});
  if (errs.length) console.error(errs.join('\n'));
  await b.close();
  srv.close();
});
