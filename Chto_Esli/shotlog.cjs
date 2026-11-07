// как shot.cjs, но печатает console.log страницы; ждёт window.__ready (текстуры); Q — доп. параметры URL
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [page, out, ...ts] = process.argv.slice(2);
const root = '/data/chtoesli/studio';
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.wav': 'audio/wav'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', (e) => console.log('ERR', String(e)));
  p.on('console', (m) => console.log(m.type(), m.text()));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1${process.env.Q || ''}`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  for (const t of ts) { await p.evaluate((tt) => window.__seek(+tt), t); await p.screenshot({path: out.replace('%', t)}); }
  await b.close(); srv.close(); process.exit(0);
});
