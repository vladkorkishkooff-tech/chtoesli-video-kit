// подбор поз: node tune.cjs <spec.js> <out_dir>; spec.js: module.exports = [{name, t, js, crop?: 'hero'|'full'|[x,y,w,h]}]
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const [specF, outD] = process.argv.slice(2), root = '/data/chtoesli/studio', spec = require(path.resolve(specF));
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--mute-audio']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', (e) => console.log('PAGEERR', String(e)));
  p.on('console', (m) => { if (!/favicon|status of 404/.test(m.text())) console.log('console.' + m.type(), m.text()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1${process.env.Q || ''}`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  fs.mkdirSync(outD, {recursive: true});
  for (const s of spec) {
    const r = await p.evaluate(async ([js, t]) => { let out = null; if (js) out = eval(js); window.__seek(+t); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      const bb = you.g.getBoundingClientRect(); return {bb: [bb.x, bb.y, bb.width, bb.height], out}; }, [s.js || '', s.t]);
    if (r.out != null) console.log(s.name, JSON.stringify(r.out));
    let clip;
    if (Array.isArray(s.crop)) clip = {x: s.crop[0], y: s.crop[1], width: s.crop[2], height: s.crop[3]};
    else if (s.crop !== 'full') { const m = 50, [x0, y0, w0, h0] = r.bb, x = Math.max(0, Math.floor(x0 - m)), y = Math.max(0, Math.floor(y0 - m)); clip = {x, y, width: Math.max(20, Math.min(1080 - x, Math.ceil(w0 + 2 * m))), height: Math.max(20, Math.min(1920 - y, Math.ceil(h0 + 2 * m)))}; }
    await p.screenshot({path: path.join(outD, s.name + '.png'), ...(clip ? {clip} : {})});
  }
  await b.close(); srv.close(); process.exit(0);
});
