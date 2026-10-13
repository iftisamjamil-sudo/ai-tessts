// Headless check of the app: compare shots per photo plus feature checks. Usage (from the project root): node tools/shoot.mjs [outDir]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'shoot-')));
fs.mkdirSync(out, { recursive: true });
console.log('out dir:', out);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  fs.readFile(file.startsWith(root + path.sep) ? file : '', (err, data) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(err ? undefined : data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const checks = [], problems = [];
const check = async (name, fn) => {
  try { checks.push({ name, ...await fn() }); }
  catch (e) { checks.push({ name, pass: false, detail: e.message.split('\n')[0] }); }
};
const py = (code, ...args) => execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image, ImageStat\n' + code, ...args]).toString();
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const fmt = a => a.map(v => v.toFixed(2)).join(', ');

let browser;
try {
  browser = await chromium.launch({ args: ['--proxy-server=' + process.env.HTTPS_PROXY, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
  page.setDefaultTimeout(120000);
  page.on('console', m => ['error', 'warning'].includes(m.type()) && problems.push(`console.${m.type()}: ${m.text()}`));
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => problems.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));

  const frames = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const blur = () => page.evaluate(() => document.activeElement?.blur()); // a focused #time slider would eat arrow keys
  const press = async key => { await blur(); await page.keyboard.press(key); await frames(); };
  const wait = async ms => { await page.waitForTimeout(ms); await frames(); }; // software GL can take seconds per frame: make sure the app really ran
  const hold = async (key, ms) => { await blur(); await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key); };
  const cam = () => page.evaluate(() => app.camera.position.toArray());
  const shot = (name, opts) => page.screenshot({ path: path.join(out, name), ...opts });
  const UI = () => { const el = document.querySelector('#ui'), s = getComputedStyle(el); return el.getClientRects().length > 0 && s.visibility !== 'hidden' && +s.opacity > 0; };
  const until = fn => page.waitForFunction(fn, null, { timeout: 20000 }).catch(() => {}); // the state is then read and judged by the caller

  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.app?.ready, null, { timeout: 120000 });
  const PHOTOS = await page.evaluate(async () => (await import(new URL('js/layout.js', location.href).href)).PHOTOS);

  for (let i = 0; i < PHOTOS.length; i++) await check(`compare-shot-${i}`, async () => {
    await page.evaluate(() => app.setMode('compare'));
    for (let k = 0; k < PHOTOS.length && await page.evaluate(() => app.photoIndex) !== i; k++) await press('ArrowRight');
    await page.waitForFunction(src => { const p = document.querySelector('#photo'); return p.complete && p.naturalWidth > 0 && p.src.endsWith(src); }, PHOTOS[i].src);
    await frames();
    const idx = await page.evaluate(() => app.photoIndex), W = page.viewportSize().width;
    const b = await page.$eval('#photo', el => { // the picture inside #photo's box, as object-fit: contain lays it out
      const r = el.getBoundingClientRect(), s = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight), w = el.naturalWidth * s, h = el.naturalHeight * s;
      return { x: r.x + (r.width - w) / 2, y: r.y + (r.height - h) / 2, width: w, height: h };
    });
    const f = n => path.join(out, `${n}_${i}.png`);
    await page.evaluate(() => document.querySelector('#ui').style.visibility = 'hidden'); // the toolbar straddles the seam and would cover both crops
    await shot(`compare_${i}.png`, { fullPage: true });
    await page.evaluate(() => document.querySelector('#ui').style.visibility = '');
    // Crop both from that one frame (another 3000 px software-GL screenshot costs ~a minute); the 3D view mirrors the photo's box into the right half.
    py(`c = Image.open(sys.argv[1]).convert("RGB"); x0, y0, x1, y1, dx = map(int, sys.argv[5:])
p, r = c.crop((x0, y0, x1, y1)), c.crop((x0 + dx, y0, x1 + dx, y1))
p.save(sys.argv[2]); r.save(sys.argv[3]); Image.blend(p, r, 0.5).save(sys.argv[4])`, f('compare'), f('photo'), f('render'), f('blend'), ...[b.x, b.y, b.x + b.width, b.y + b.height, W / 2].map(v => String(Math.round(v))));
    return { pass: idx === i && b.x + b.width <= W / 2 + 1, detail: `photoIndex=${idx}, #photo box ${fmt([b.x, b.y, b.width, b.height])}` };
  });

  await page.setViewportSize({ width: 1200, height: 800 }); // smaller frames render faster in software GL

  await check('walk-move', async () => {
    await page.evaluate(() => app.setMode('walk'));
    await frames();
    const a = await cam();
    await hold('w', 800);
    const d = dist(a, await cam());
    return { pass: d > 0.3, detail: `moved ${d.toFixed(2)} m in 800 ms of 'w'` };
  });

  await check('walk-look', async () => { // real click -> pointer lock, then real mouse motion turns the view
    const yaw = () => page.evaluate(() => app.camera.rotation.y);
    await page.mouse.click(600, 400);
    const locked = await page.waitForFunction(() => document.pointerLockElement === app.renderer.domElement, null, { timeout: 10000 }).then(() => true, () => false);
    const y0 = await yaw();
    await page.mouse.move(600, 400); await page.mouse.move(800, 400, { steps: 5 });
    await frames();
    const turned = Math.abs((await yaw()) - y0);
    await page.keyboard.press('Escape');
    return { pass: locked && turned > 0.05, detail: `pointer locked=${locked}, mouse moved 200 px, yaw changed ${turned.toFixed(3)} rad` };
  });

  await check('walk-collision', async () => {
    const box = await page.evaluate(() => {
      const near = b => Math.hypot((b.min.x + b.max.x) / 2 - 3.9, (b.min.z + b.max.z) / 2 - 2.85);
      const b = [...app.colliders].sort((p, q) => near(p) - near(q))[0];
      app.camera.position.set(b.min.x - 0.6, app.camera.position.y, (b.min.z + b.max.z) / 2);
      app.camera.rotation.set(0, -Math.PI / 2, 0, 'YXZ'); // looking down +x, at the bed
      return [b.min.x, b.min.z, b.max.x, b.max.z];
    });
    await frames();
    // Pick whichever WASD key moves toward +x given the camera's actual heading, in case the app keeps its own yaw.
    const [fx, , fz] = await page.evaluate(() => app.camera.getWorldDirection(app.camera.position.clone()).toArray());
    const key = Object.entries({ w: fx, s: -fx, a: fz, d: -fz }).sort((p, q) => q[1] - p[1])[0][0];
    const gap = ([x, , z]) => Math.max(box[0] - x, x - box[2], box[1] - z, z - box[3]); // xz distance outside the box (Chebyshev)
    const start = gap(await cam());
    await page.evaluate(() => { window.__trail = []; const f = () => window.__trail && (window.__trail.push(app.camera.position.toArray()), requestAnimationFrame(f)); f(); });
    await hold(key, 1500);
    const trail = await page.evaluate(() => { const t = window.__trail; window.__trail = null; return t; });
    const closest = Math.min(...trail.map(gap));
    return { pass: Math.abs(start - 0.6) < 0.01 && closest >= 0.2 - 1e-3, detail: `held '${key}' from ${start.toFixed(2)} m off the bed box; closest ${closest.toFixed(3)} m over ${trail.length} frames` };
  });

  await check('dollhouse', async () => {
    await press('2');
    await until(() => app.mode === 'dollhouse' && !app.ceiling.visible && app.camera.position.y > app.ROOM.H);
    const s = await page.evaluate(() => ({ mode: app.mode, ceiling: app.ceiling.visible, y: app.camera.position.y, H: app.ROOM.H }));
    const a = await cam();
    await wait(1000);
    const d = dist(a, await cam());
    await shot('dollhouse.png');
    return { pass: s.mode === 'dollhouse' && s.ceiling === false && s.y > s.H && d > 1e-3, detail: `mode=${s.mode} ceiling.visible=${s.ceiling} camera y=${s.y.toFixed(2)} moved ${d.toFixed(3)} m in 1 s` };
  });

  await check('lamp', async () => {
    const n = await page.evaluate(() => app.lamps.length), missed = [];
    const click = async i => {
      const p = await page.evaluate(async i => {
        const { Box3, Vector3 } = await import('three');
        const c = new Box3().setFromObject(app.lamps[i].root).getCenter(new Vector3()).project(app.camera);
        const r = app.renderer.domElement.getBoundingClientRect();
        return { x: r.left + (c.x + 1) / 2 * r.width, y: r.top + (1 - c.y) / 2 * r.height, on: app.lamps[i].on };
      }, i);
      await page.mouse.click(p.x, p.y);
      return page.waitForFunction(([i, on]) => app.lamps[i].on !== on, [i, p.on], { timeout: 10000 }).then(() => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`, () => null);
    };
    for (let i = 0; i < n; i++) {
      const off = await click(i), back = off && await click(i);
      if (back) return { pass: true, detail: `lamp ${i} flipped at ${off} and back at ${back}` + (missed.length ? `; missed lamps ${missed}` : '') };
      missed.push(off ? `${i} (flipped once only)` : i);
    }
    return { pass: false, detail: `no lamp toggled by clicking; tried ${missed.join(', ') || 'none (app.lamps is empty)'}` };
  });

  await check('time', async () => {
    const { position, yaw, roll } = PHOTOS[0];
    await page.evaluate(([p, yaw, roll]) => { app.setMode('walk'); app.camera.position.fromArray(p); app.camera.rotation.set(0, yaw, roll, 'YXZ'); }, [position, yaw, roll]);
    const lum = {}, bad = [];
    for (const h of [8, 13, 21]) {
      await page.fill('#time', String(h));
      await frames();
      const t = await page.evaluate(() => app.time);
      if (Math.abs(t - h) > 0.01) bad.push(`#time=${h} gave app.time=${t}`);
      await shot(`time_${h}.png`);
      lum[h] = +py('print(ImageStat.Stat(Image.open(sys.argv[1]).convert("L")).mean[0])', path.join(out, `time_${h}.png`));
    }
    if (!(lum[21] < lum[13])) bad.push('21:00 is not darker than 13:00');
    return { pass: !bad.length, detail: [...bad, `mean luminance 8h ${lum[8].toFixed(1)}, 13h ${lum[13].toFixed(1)}, 21h ${lum[21].toFixed(1)}`].join('; ') };
  });

  await check('cinematic', async () => {
    const prev = await page.evaluate(() => app.mode);
    await press('c');
    await until(`app.mode === 'cinematic' && !(${UI})()`);
    const [mode, shown] = [await page.evaluate(() => app.mode), await page.evaluate(UI)];
    const a = await cam();
    await wait(1500);
    const d = dist(a, await cam());
    await shot('cinematic.png');
    await press('c');
    await until(`app.mode === ${JSON.stringify(prev)} && (${UI})()`);
    const [mode2, shown2] = [await page.evaluate(() => app.mode), await page.evaluate(UI)];
    return { pass: mode === 'cinematic' && !shown && d > 1e-3 && mode2 === prev && shown2, detail: `c: mode=${mode} #ui shown=${shown} moved ${d.toFixed(3)} m in 1.5 s; c again: mode=${mode2} (was ${prev}) #ui shown=${shown2}` };
  });

  await check('compare-cycle', async () => {
    await press('3');
    const [mode, a] = await page.evaluate(() => [app.mode, app.photoIndex]);
    await press('ArrowRight');
    const b = await page.evaluate(() => app.photoIndex), want = (a + 1) % PHOTOS.length;
    return { pass: mode === 'compare' && b === want, detail: `mode=${mode} photoIndex ${a} -> ${b} (want ${want})` };
  });
} catch (e) {
  checks.push({ name: 'run', pass: false, detail: e.message.split('\n')[0] });
} finally {
  await browser?.close();
  server.close();
}

const report = { out, checks, problems };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(problems.length || checks.some(c => !c.pass) ? 1 : 0);
