// Лист кадров: node tools/sheet.cjs <page.html> <outdir> <t1,t2,...>  — один заход в страницу, много seek
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [page, outdir, list] = process.argv.slice(2), root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png'};
fs.mkdirSync(outdir, {recursive: true});
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1`, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
  for (const ts of list.split(',')) { const t = +ts; await p.evaluate((tt) => window.__seek(tt), t); await p.waitForTimeout(60);
    await p.screenshot({path: path.join(outdir, `f_${t.toFixed(2).padStart(5, '0')}.png`)}); }
  if (errs.length) console.log('PAGE ERRORS:\n' + errs.join('\n'));
  await b.close(); srv.close(); process.exit(0);
});
