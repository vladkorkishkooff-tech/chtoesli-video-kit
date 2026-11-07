// кадры + кропы вокруг героя (bbox you.g на экране); Q — доп. параметры URL. node hero_shots.cjs <out_prefix> t1 t2 ...
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [pref, ...ts] = process.argv.slice(2), root = '/data/chtoesli/studio';
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.wav': 'audio/wav'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', (e) => console.log('ERR', String(e)));
  p.on('console', (m) => { if (!/favicon|404/.test(m.text())) console.log(m.type(), m.text()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1${process.env.Q || ''}`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  for (const t of ts) {
    const bb = await p.evaluate(async (tt) => { window.__seek(+tt); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); const r = you.g.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }, t);
    const m = 40, x = Math.max(0, Math.floor(bb[0] - m)), y = Math.max(0, Math.floor(bb[1] - m)), w = Math.min(1080 - x, Math.ceil(bb[2] + 2 * m)), h = Math.min(1920 - y, Math.ceil(bb[3] + 2 * m));
    if (w > 10 && h > 10) await p.screenshot({path: `${pref}_${t}.png`, clip: {x, y, width: w, height: h}});
    else console.log('нет героя в кадре', t);
  }
  await b.close(); srv.close(); process.exit(0);
});
