#!/usr/bin/env node
// Chroma-key the raw character art from art-src/ into game sprites.
//
//   node tools/chroma-key.mjs [--only ids] [--size 384]
//
// Keys the green background out (with despill and fringe cleanup), trims to the
// character, and re-poses it on a square transparent canvas with its feet on a
// ground line at 96% height. Enemies → assets/enemies/<id>/walk.png,
// heroes → assets/heroes/<id>/ready.png. Also renders a contact sheet
// art-src/sheet.png so the whole batch can be checked at a glance.
//
// The pixel work happens inside a headless Chromium from the Playwright cache
// (~/.cache/ms-playwright/chromium_headless_shell-*), driven over CDP with the
// global WebSocket — no npm dependencies.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const artSrc = path.join(root, 'art-src');

const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
const USAGE = 'Usage: node tools/chroma-key.mjs [--only ids] [--size 384]';

// ---- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { only: null, size: 384 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') {
      // Plain ids; tolerate an optional "kind/" prefix on each entry.
      opts.only = (argv[++i] || '')
        .split(',')
        .map((s) => s.trim().split('/').pop())
        .filter(Boolean);
    } else if (a === '--size') {
      opts.size = Number.parseInt(argv[++i], 10);
    } else if (a === '--help' || a === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`unknown argument: ${a}\n${USAGE}`);
      process.exit(2);
    }
  }
  if (!Number.isInteger(opts.size) || opts.size < 32 || opts.size > 2048) {
    console.error(`--size must be an integer between 32 and 2048\n${USAGE}`);
    process.exit(2);
  }
  return opts;
}

// ---- input discovery ----------------------------------------------------------

function collectRaw(only) {
  const out = [];
  for (const kind of ['enemies', 'heroes']) {
    const dir = path.join(artSrc, kind);
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      const ext = path.extname(name).toLowerCase();
      if (!IMG_EXTS.includes(ext)) continue;
      const id = name.slice(0, name.length - ext.length);
      if (only && !only.includes(id)) continue;
      out.push({ kind, id, ext, src: path.join(dir, name) });
    }
  }
  return out;
}

// ---- page-side pixel work (serialized into Runtime.evaluate) ------------------
// These functions run inside the page: no references to Node-scope variables.

function processImage(dataUrl, size, key) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('could not decode image'));
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height);
        const p = d.data;

        // Key out green: excess green over the stronger of r/b decides alpha.
        for (let i = 0; i < p.length; i += 4) {
          const r = p[i];
          const g = p[i + 1];
          const b = p[i + 2];
          const gp = g - Math.max(r, b);
          let a;
          if (gp > 60) a = 0;
          else if (gp < 20) a = 255;
          else a = Math.round((255 * (60 - gp)) / 40);
          p[i + 3] = a;
          if (a < 255 || gp > 0) p[i + 1] = Math.min(g, Math.max(r, b)); // despill
        }
        // Stray 1-px fringe: kill faint semi-transparent pixels.
        for (let i = 3; i < p.length; i += 4) if (p[i] < 40) p[i] = 0;
        ctx.putImageData(d, 0, 0);

        // Trim to the bounding box of visible content.
        let minX = c.width;
        let minY = c.height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            if (p[(y * c.width + x) * 4 + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) throw new Error('nothing left after keying (no green background?)');
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;

        // Square transparent canvas: fit with 4% margin, centred horizontally,
        // bottom of the content on the 96% ground line (feet down).
        const out = document.createElement('canvas');
        out.width = size;
        out.height = size;
        const o = out.getContext('2d');
        const avail = size * 0.92;
        const s = Math.min(avail / bw, avail / bh);
        const dw = bw * s;
        const dh = bh * s;
        o.drawImage(c, minX, minY, bw, bh, (size - dw) / 2, size * 0.96 - dh, dw, dh);

        window.__art = window.__art || {};
        window.__art[key] = out; // kept for the contact sheet
        resolve({ png: out.toDataURL('image/png'), cw: bw, ch: bh });
      } catch (err) {
        reject(err);
      }
    };
    img.src = dataUrl;
  });
}

function contactSheet(keys, cols, cell) {
  const rows = Math.ceil(keys.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * cell;
  c.height = rows * cell;
  const x = c.getContext('2d');
  x.fillStyle = '#1d2a24';
  x.fillRect(0, 0, c.width, c.height);
  const labelH = Math.round(cell * 0.16);
  x.font = Math.max(10, Math.round(cell * 0.08)) + 'px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  keys.forEach((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ox = col * cell;
    const oy = row * cell;
    const art = window.__art && window.__art[key];
    if (art) {
      const pad = Math.round(cell * 0.05);
      const aw = cell - 2 * pad;
      const ah = cell - 2 * pad - labelH;
      const s = Math.min(aw / art.width, ah / art.height);
      const w = art.width * s;
      const h = art.height * s;
      x.drawImage(art, ox + (cell - w) / 2, oy + pad + (ah - h) / 2, w, h);
    }
    x.fillStyle = '#a8c0b4';
    x.fillText(key.split('/').pop(), ox + cell / 2, oy + cell - labelH / 2);
  });
  return c.toDataURL('image/png');
}

// ---- headless Chromium over CDP ------------------------------------------------

function findChromium() {
  const base = path.join(os.homedir(), '.cache', 'ms-playwright');
  let dirs;
  try {
    dirs = fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort();
  } catch {
    return null;
  }
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function launchChromium() {
  const exe = findChromium();
  if (!exe) {
    throw new Error(
      'no chromium_headless_shell-* found in ~/.cache/ms-playwright ' +
      '(install the Playwright headless shell first)',
    );
  }
  const port = await freePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chroma-key-'));
  const child = spawn(exe, [
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--headless',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  // Wait until the DevTools HTTP endpoint answers.
  const deadline = Date.now() + 20_000;
  for (;;) {
    if (Date.now() > deadline) {
      child.kill('SIGKILL');
      throw new Error(`DevTools endpoint never appeared on port ${port}`);
    }
    if (child.exitCode !== null) throw new Error(`chromium exited with code ${child.exitCode}`);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) break;
    } catch { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 150));
  }
  return { child, port, userDataDir };
}

// A page-level websocket URL: prefer a fresh target, fall back to the list.
async function pageWebSocketUrl(port) {
  const attempts = [
    () => fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }),
    () => fetch(`http://127.0.0.1:${port}/json/new?about:blank`),
  ];
  for (const attempt of attempts) {
    try {
      const r = await attempt();
      if (r.ok) {
        const target = await r.json();
        if (target.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
      }
    } catch { /* try the next approach */ }
  }
  const r = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = await r.json();
  const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('no page target available over CDP');
  return page.webSocketDebuggerUrl;
}

function makeCdp(ws) {
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8');
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  return {
    send(method, params = {}, timeoutMs = 180_000) {
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, timeoutMs);
        pending.set(id, (msg) => {
          clearTimeout(timer);
          resolve(msg);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    async evaluate(expression) {
      const msg = await this.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (msg.error) throw new Error(`CDP error: ${JSON.stringify(msg.error)}`);
      const res = msg.result;
      if (!res) throw new Error('empty Runtime.evaluate response');
      if (res.exceptionDetails) {
        const d = res.exceptionDetails;
        throw new Error(
          (d.exception && (d.exception.description || d.exception.value)) || d.text || 'page exception');
      }
      return res.result.value;
    },
  };
}

function pngBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('unexpected data URL from the page');
  return Buffer.from(dataUrl.slice(comma + 1), 'base64');
}

// ---- main --------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const files = collectRaw(opts.only);
  if (files.length === 0) {
    console.log('no raw art found under art-src/ — run node tools/gen-art.mjs first');
    return 0;
  }

  const browser = await launchChromium();
  let ws = null;
  const cleanup = () => {
    try { if (ws) ws.close(); } catch { /* already gone */ }
    try { browser.child.kill('SIGKILL'); } catch { /* already gone */ }
    try { fs.rmSync(browser.userDataDir, { recursive: true, force: true }); } catch { /* best effort */ }
  };
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });

  let ok = 0;
  let failed = 0;
  const keys = [];
  try {
    ws = new WebSocket(await pageWebSocketUrl(browser.port));
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('could not open CDP websocket')), { once: true });
    });
    const cdp = makeCdp(ws);

    for (const f of files) {
      const key = `${f.kind}/${f.id}`;
      const dest = path.join(
        root, 'assets', f.kind, f.id, f.kind === 'enemies' ? 'walk.png' : 'ready.png');
      try {
        const dataUrl = 'data:' + MIME[f.ext] + ';base64,' + fs.readFileSync(f.src).toString('base64');
        const expression = `(${processImage.toString()})(${JSON.stringify(dataUrl)}, ${opts.size}, ${JSON.stringify(key)})`;
        const r = await cdp.evaluate(expression);
        if (!r || !r.png) throw new Error('no PNG returned from the page');
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, pngBytes(r.png));
        keys.push(key);
        ok++;
        console.log(`ok ${key} -> ${path.relative(root, dest)} (${r.cw}x${r.ch} content in ${opts.size}x${opts.size})`);
      } catch (err) {
        failed++;
        console.log(`FAIL ${key}: ${err.message || err}`);
      }
    }

    if (keys.length > 0) {
      const sheet = await cdp.evaluate(`(${contactSheet.toString()})(${JSON.stringify(keys)}, 6, 160)`);
      fs.writeFileSync(path.join(artSrc, 'sheet.png'), pngBytes(sheet));
      console.log(`sheet -> art-src/sheet.png (${keys.length} images, 6 columns)`);
    }
    console.log(`done: ${ok} ok, ${failed} failed`);
  } finally {
    cleanup();
  }
  return failed === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err.stack || err);
    process.exit(1);
  },
);
