// Turns the generated character art in art-src/ into animation strips the game plays.
//
//   URL=about:blank node tools/cdp.mjs tools/build-frames.mjs
//   (env ONLY=hasina,quader to limit ids; SIZE=256 frame size in px)
//
// Sources per character (art-src/enemies/<id>/, git-ignored):
//   <anim>.mp4        video clip (Hasina + seniors, Google Flow, 16:9, flat green)
//   <anim>-sheet.jpg  sprite sheet (small leaders): walk 3×2, struggle 2×2, jailed 2×2
// Output: assets/enemies/<id>/<anim>-strip.webp (+ walk.png, the 384 px still = first walk frame)
// Each strip is one row of square frames, feet on a
// ground line at 96% height (same layout as the single walk.png). The frame count is
// width / height, so the game needs no metadata. Run node tools/build-assets.mjs after.
//
// ffmpeg pulls frames out of the clips; the keying, trimming and packing run in the
// headless Chromium that tools/cdp.mjs starts (no npm dependencies).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(root, 'art-src', 'enemies');
const OUT = path.join(root, 'assets', 'enemies');
const SIZE = Number(process.env.SIZE || 256);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

// Per animation: frames to take from a clip (time window in s) and the sheet grid.
// `ground: 'fixed'` keeps the clip's floor line (natural hops); sheets align feet per cell.
const ANIMS = {
  walk: { n: 8, from: 0.4, to: 2.6, cols: 3, rows: 2 },
  struggle: { n: 6, from: 0.6, to: 2.6, cols: 2, rows: 2 },
  jailed: { n: 6, from: 0.6, to: 2.8, cols: 2, rows: 2, portrait: true },
  emerge: { n: 8, from: 0.0, to: 2.4, cols: 3, rows: 2 },
  kicked: { n: 8, from: 0.3, to: 2.6, cols: 2, rows: 2 },
};

const dataUrl = (file) => {
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
};

// ffmpeg: N evenly spaced frames from [from, to] of the clip, as JPEGs.
function clipFrames(file, a) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kto-frames-'));
  const dur = a.to - a.from;
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(a.from), '-t', String(dur), '-i', file,
    '-vf', `fps=${a.n / dur}`, '-frames:v', String(a.n), '-q:v', '2', path.join(dir, 'f%02d.jpg')]);
  const files = fs.readdirSync(dir).sort().map((f) => path.join(dir, f));
  const urls = files.map(dataUrl);
  fs.rmSync(dir, { recursive: true, force: true });
  return urls;
}

// ---- page side (serialized; no Node-scope references) ----------------------------
const PAGE = String.raw`
window.ktoLoad = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });

// Key flat green out of a canvas region; returns ImageData with alpha.
window.ktoKey = (img, sx, sy, sw, sh) => {
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const ctx = c.getContext('2d'); ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const d = ctx.getImageData(0, 0, sw, sh), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2], gp = g - Math.max(r, b);
    const a = gp > 60 ? 0 : gp < 20 ? 255 : Math.round(255 * (60 - gp) / 40);
    p[i + 3] = a;
    if (a < 255 || gp > 0) p[i + 1] = Math.min(g, Math.max(r, b)); // despill
  }
  for (let i = 3; i < p.length; i += 4) if (p[i] < 40) p[i] = 0;
  return d;
};

// Bounding box of the character, ignoring sparse rows/cols (sparkles, sweat drops),
// plus the head centre x (median of solid pixels in the top quarter) as the anchor.
window.ktoBox = (d) => {
  const { width: w, height: h, data: p } = d;
  const rows = new Array(h).fill(0), cols = new Array(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 128) { rows[y]++; cols[x]++; }
  const min = Math.max(3, Math.round(Math.min(w, h) * 0.01));
  let y0 = rows.findIndex((v) => v >= min), y1 = h - 1 - [...rows].reverse().findIndex((v) => v >= min);
  if (y0 < 0) return null;
  const band = y0 + Math.max(4, Math.round((y1 - y0) * 0.25));
  const xs = [];
  for (let y = y0; y < band; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 128) xs.push(x);
  xs.sort((a, b) => a - b);
  const head = xs.length ? xs[xs.length >> 1] : w / 2;
  let x0 = cols.findIndex((v) => v >= min), x1 = w - 1 - [...cols].reverse().findIndex((v) => v >= min);
  return { x0, x1, y0, y1, head };
};

// Pack keyed frames into one strip. opts: { size, fixedGround, portrait }.
window.ktoStrip = (frames, opts) => {
  const S = opts.size;
  const boxes = frames.map(ktoBox);
  const ok = boxes.filter(Boolean);
  const out = document.createElement('canvas'); out.width = S * frames.length; out.height = S;
  const octx = out.getContext('2d'); octx.imageSmoothingQuality = 'high';
  const tmp = document.createElement('canvas');
  let scale, ground;
  if (opts.portrait) {
    // Head and shoulders: the top part of the figure, at most ~1.1 × its width tall.
    const regH = Math.max(...ok.map((b) => Math.min(b.y1 - b.y0, (b.x1 - b.x0) * 1.1)));
    scale = (S * 0.9) / regH;
  } else {
    const maxH = Math.max(...ok.map((b) => b.y1 - b.y0));
    scale = (S * 0.88) / maxH;
    ground = Math.max(...ok.map((b) => b.y1));
  }
  frames.forEach((d, i) => {
    const b = boxes[i]; if (!b) return;
    tmp.width = d.width; tmp.height = d.height; tmp.getContext('2d').putImageData(d, 0, 0);
    const dx = i * S + S / 2 - b.head * scale;
    let dy;
    if (opts.portrait) dy = S * 0.06 - b.y0 * scale;
    else dy = S * 0.96 - (opts.fixedGround ? ground : b.y1) * scale;
    octx.save(); octx.beginPath(); octx.rect(i * S, 0, S, S); octx.clip();
    octx.drawImage(tmp, dx, dy, d.width * scale, d.height * scale);
    octx.restore();
  });
  return out.toDataURL(opts.png ? 'image/png' : 'image/webp', 0.82);
};

window.ktoFromClip = async (urls, opts) => {
  if (opts.first) urls = urls.slice(0, 1);
  const frames = [];
  for (const u of urls) { const img = await ktoLoad(u); frames.push(ktoKey(img, 0, 0, img.naturalWidth, img.naturalHeight)); }
  return ktoStrip(frames, { ...opts, fixedGround: true });
};

window.ktoFromSheet = async (url, cols, rows, opts) => {
  const img = await ktoLoad(url);
  const cw = Math.floor(img.naturalWidth / cols), ch = Math.floor(img.naturalHeight / rows);
  const frames = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) frames.push(ktoKey(img, c * cw, r * ch, cw, ch));
  if (opts.first) frames.length = 1;
  return ktoStrip(frames, { ...opts, fixedGround: false });
};
'ready';
`;

export default async ({ ev }) => {
  await ev(PAGE);
  const ids = fs.readdirSync(SRC).filter((d) => fs.existsSync(path.join(SRC, d, 'master.jpg')))
    .filter((d) => !ONLY || ONLY.includes(d)).sort();
  for (const id of ids) {
    const made = [];
    for (const [anim, a] of Object.entries(ANIMS)) {
      const clip = path.join(SRC, id, `${anim}.mp4`);
      const sheet = path.join(SRC, id, `${anim}-sheet.jpg`);
      const opts = JSON.stringify({ size: SIZE, portrait: !!a.portrait });
      let url;
      if (fs.existsSync(clip)) url = await ev(`await ktoFromClip(${JSON.stringify(clipFrames(clip, a))}, ${opts})`);
      else if (fs.existsSync(sheet)) url = await ev(`await ktoFromSheet(${JSON.stringify(dataUrl(sheet))}, ${a.cols}, ${a.rows}, ${opts})`);
      else continue;
      fs.mkdirSync(path.join(OUT, id), { recursive: true });
      const file = path.join(OUT, id, `${anim}-strip.webp`);
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      made.push(`${anim} ${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
      if (anim === 'walk') {
        // The single still (walk.png, 384 px) used by the how-to roster, share cards and
        // every fallback: first walk frame, so the old art never mixes with the new.
        const o1 = JSON.stringify({ size: 384, png: true, first: true });
        const still = fs.existsSync(clip)
          ? await ev(`await ktoFromClip(${JSON.stringify(clipFrames(clip, a))}, ${o1})`)
          : await ev(`await ktoFromSheet(${JSON.stringify(dataUrl(sheet))}, ${a.cols}, ${a.rows}, ${o1})`);
        fs.writeFileSync(path.join(OUT, id, 'walk.png'), Buffer.from(still.split(',')[1], 'base64'));
      }
    }
    console.log(`${id}: ${made.join(', ') || 'no sources'}`);
  }
};
