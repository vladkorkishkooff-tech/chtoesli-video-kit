// Список звуков страницы: node tools/sfx_dump.cjs <page.html> <out.json>
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, out] = process.argv.slice(2), root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  const d = await p.evaluate(() => ({dur: window.__duration, sfx: window.__sfx}));
  fs.writeFileSync(out, JSON.stringify(d, null, 1)); console.log(d.sfx.length, 'sounds, dur', d.dur);
  await b.close(); srv.close(); process.exit(0);
});
