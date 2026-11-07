// Быстрый покадровый рендер страницы «тушь и глина» в MP4: несколько вкладок параллельно, кадры в JPEG.
//   node tools/prender.cjs <page.html> <out.mp4> [--fps 30] [--workers 6] [--q 95]
// Страница рисует себя через window.__seek(t), длина — window.__duration, звук SFX — window.__audioWav().
// Замер (31.10.2026): PNG-скриншот 1080×1920 ≈ 720 мс, JPEG ≈ 72 мс — в этом и был час рендера.
// Звук здесь не мастерится: громкость и голос сводит tools/finish_mix.py.
const http = require('http'), fs = require('fs'), path = require('path'), {execFileSync} = require('child_process');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const [page, out] = a, fps = +opt('fps', 30), workers = +opt('workers', 6), q = +opt('q', 95);
const root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png'};
const srv = http.createServer((qq, r) => { const f = path.join(root, decodeURIComponent(qq.url.split('?')[0])); fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}), r.end(d)))); });

srv.listen(0, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${srv.address().port}/${page}?t=0&render=1${process.env.Q || ""}`;  // Q: доп. параметры, напр. &look=chan
  const frames = path.join(root, '_pframes'); fs.rmSync(frames, {recursive: true, force: true}); fs.mkdirSync(frames);
  const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM || undefined, args: ['--mute-audio', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']});
  const open = async () => { const p = await b.newPage({viewport: {width: 1080, height: 1920}}); await p.goto(url, {waitUntil: 'load'}); await p.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; }); return p; };
  const first = await open();
  const dur = await first.evaluate(() => window.__duration), n = Math.round(dur * fps);
  const pages = [first, ...(await Promise.all(Array.from({length: workers - 1}, open)))];
  const t0 = Date.now(), errs = [];
  pages.forEach((p) => p.on('pageerror', (e) => errs.push(String(e))));
  // кадры делятся на сплошные куски — каждая вкладка идёт вперёд по своему куску
  const chunk = Math.ceil(n / workers);
  await Promise.all(pages.map(async (p, w) => {
    for (let i = w * chunk; i < Math.min(n, (w + 1) * chunk); i++) {
      await p.evaluate(async (t) => { window.__seek(t); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); }, i / fps);
      await p.screenshot({path: path.join(frames, `f${String(i).padStart(6, '0')}.jpg`), type: 'jpeg', quality: q});
    }
  }));
  const secs = (Date.now() - t0) / 1000;
  const wav = path.join(root, '_pframes', 'sfx.wav');
  const b64 = await first.evaluate(async () => (window.__audioWav ? await window.__audioWav() : null));
  if (b64) fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  await b.close(); srv.close();
  const inAudio = b64 ? ['-i', wav] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'];
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(frames, 'f%06d.jpg'), ...inAudio, '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.resolve(out)]);
  fs.rmSync(frames, {recursive: true, force: true});
  console.log(JSON.stringify({out: path.resolve(out), frames: n, workers, render_s: Math.round(secs), ms_per_frame: Math.round((secs * 1000) / n), errors: errs.slice(0, 3)}));
});
