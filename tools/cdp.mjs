// Minimal headless-Chromium driver for smoke tests and screenshots (no npm).
// Usage: SHOTS=<dir> [URL=http://127.0.0.1:8765/] [W=1280 H=800] node tools/cdp.mjs <script.mjs>
// The script exports `default async ({ ev, shot, sleep, click })`:
//   ev(expr)    evaluate JS in the page (REPL mode: top-level await, re-declarations OK)
//   shot(name)  save a PNG screenshot to $SHOTS/<name>.png
// Page exceptions and console errors are printed at the end ("no page errors" if none).
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const base = `${process.env.HOME}/.cache/ms-playwright`;
const dir = readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const bin = `${base}/${dir}/chrome-headless-shell-linux64/chrome-headless-shell`;
const W = Number(process.env.W || 1280), H = Number(process.env.H || 800);
const SHOTS = process.env.SHOTS || path.join(tmpdir(), 'kto-shots');
mkdirSync(SHOTS, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(bin, [`--remote-debugging-port=${port}`, `--window-size=${W},${H}`, '--no-sandbox',
  `--user-data-dir=${path.join(tmpdir(), `kto-prof-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(100); } }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const logs = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') logs.push(`EXC ${d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text}`);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push(`ERR ${d.params.args.map((a) => a.value ?? a.description).join(' ')}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, replMode: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
  return r.result.result.value;
};
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(r.result.data, 'base64'));
};
const click = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: process.env.URL || 'http://127.0.0.1:8765/' });
await sleep(1500);
try {
  await (await import(path.resolve(process.argv[2]))).default({ ev, shot, sleep, click });
} catch (e) { logs.push(`SCRIPT ${e.message}`); }
console.log(logs.length ? logs.join('\n') : 'no page errors');
proc.kill();
process.exit(0);
