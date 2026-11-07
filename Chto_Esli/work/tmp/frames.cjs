// кадры эпизода в одной сессии браузера. node frames.cjs <out_prefix> t1 t2 ...
//   CROP='x,y,w,h' — вырез; HERO=1 — вырез вокруг героя; EVAL='js' — напечатать значение выражения (после загрузки); Q — доп. параметры URL
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [pref, ...ts] = process.argv.slice(2), root = '/data/chtoesli/studio';
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--mute-audio']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', (e) => console.log('PAGEERR', String(e)));
  p.on('console', (m) => { if (!/favicon/.test(m.text())) console.log('console.' + m.type(), m.text()); });
  p.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) console.log('HTTP', r.status(), r.url()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1${process.env.Q || ''}`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  if (process.env.EVAL) console.log(JSON.stringify(await p.evaluate((s) => eval(s), process.env.EVAL)));
  for (const t of ts) {
    const bb = await p.evaluate(async (tt) => { window.__seek(+tt); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); const r = you.g.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }, t);
    let clip;
    if (process.env.CROP) { const [x, y, w, h] = process.env.CROP.split(',').map(Number); clip = {x, y, width: w, height: h}; }
    else if (process.env.HERO) { const m = 60, x = Math.max(0, Math.floor(bb[0] - m)), y = Math.max(0, Math.floor(bb[1] - m)); clip = {x, y, width: Math.min(1080 - x, Math.ceil(bb[2] + 2 * m)), height: Math.min(1920 - y, Math.ceil(bb[3] + 2 * m))}; if (clip.width < 20 || clip.height < 20) { console.log('нет героя', t); continue; } }
    await p.screenshot({path: `${pref}_${t}.jpg`, type: 'jpeg', quality: 90, ...(clip ? {clip} : {})});
  }
  await b.close(); srv.close(); process.exit(0);
});
