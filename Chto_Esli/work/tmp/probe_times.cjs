// печатает ключевые времена эпизода (глобальные const страницы)
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const root = '/data/chtoesli/studio';
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200), r.end(d)))); });
srv.listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto(`http://127.0.0.1:${srv.address().port}/ep_blackout_calm_paper.html?t=0&render=1`, {waitUntil: 'load'});
  const r = await p.evaluate(() => { const o = {}; for (const k of ['t2','t3','t4','t5','t6','t7','J3','J4','J5','J7','wNab','wBut','wNas','wRoz','wOst','wHol','wOtk','wKon','M_ON','KET_ON','WRM_ON','wNe','wUg','wZak','wShch','wZat','wOkno','wSvi','wChai','POWER2','wLuch','END','DUR','FL','SEAT']) { try { o[k] = +eval(k).toFixed(2); } catch (e) { o[k] = 'n/a'; } } return o; });
  console.log(JSON.stringify(r)); await b.close(); srv.close(); process.exit(0);
});
