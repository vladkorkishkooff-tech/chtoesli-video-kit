// node shots.cjs <out_dir> <t1> <t2> ... ; env Q='&look=light'
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [out, ...ts] = process.argv.slice(2);
const root = '/data/chtoesli/studio';
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.jpg': 'image/jpeg'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--mute-audio', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', (e) => console.log('PAGEERR', String(e)));
  p.on('console', (m) => { if (!/favicon|status of 404/.test(m.text())) console.log('console.' + m.type(), m.text()); });
  p.on('response', (rs) => { if (rs.status() >= 400 && !/favicon/.test(rs.url())) console.log('HTTP', rs.status(), rs.url()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1${process.env.Q || ''}`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  for (const t of ts) {
    await p.evaluate(async (tt) => { window.__seek(tt); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); }, +t);
    await p.screenshot({path: path.join(out, `t${(+t).toFixed(2)}.png`), type: 'png'});
  }
  await b.close(); srv.close(); console.log('OK', ts.length);
});
