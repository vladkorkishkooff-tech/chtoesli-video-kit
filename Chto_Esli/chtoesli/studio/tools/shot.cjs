// Снимает один кадр страницы «тушь и глина» в указанный момент времени.
//   node tools/shot.cjs <page.html> <out.png> <time_sec>
// Пример: node tools/shot.cjs ep_blackout_calm_paper.html hook.png 0.8
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, out, tStr] = process.argv.slice(2);
const t = +tStr;
const root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav'};
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${srv.address().port}/${page}?t=${t}&render=1`;
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--mute-audio']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto(url, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  await p.evaluate((tt) => { window.__seek(tt); }, t);
  await p.waitForTimeout(200);
  await p.screenshot({path: path.resolve(out), type: 'png'});
  await b.close(); srv.close();
  console.log(`Shot at t=${t}s → ${path.resolve(out)}`);
});
