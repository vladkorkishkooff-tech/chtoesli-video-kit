const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const root = '/data/chtoesli/studio';
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM});
  for (const q of ['', '&look=light']) {
    const p = await b.newPage({viewport: {width: 1080, height: 1920}});
    p.on('response', (r) => { if (r.status() >= 400) console.log(q || 'chan', r.status(), r.url().replace(/^http:\/\/[^/]+/, '')); });
    p.on('pageerror', (e) => console.log('ERR', String(e)));
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(q || 'chan', m.type(), m.text()); });
    await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1${q}`, {waitUntil: 'load'});
    await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
    for (const t of [0, 10, 20, 30, 40, 47, 55]) await p.evaluate((tt) => window.__seek(tt), t);
    await p.close();
  }
  await b.close(); srv.close(); process.exit(0);
});
