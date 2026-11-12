#!/usr/bin/env node
// Generate raw character art with agy (Antigravity CLI), one agent per character.
//
//   node tools/gen-art.mjs [--style 2d|3d] [--only id1,id2] [--kind enemies|heroes] [--jobs 2] [--force] [--model id]
//
// For each character from tools/art/prompts.mjs: run one agy image-generation
// agent, read the conversation id from its NDJSON stream, then collect the
// newest image agy saved under ~/.gemini/antigravity-cli/brain/<conversation id>/
// into art-src/<kind>/<id>.<ext>. This is raw output only — tools/chroma-key.mjs
// turns it into game sprites. art-src/ is not committed (see .gitignore).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, STYLES, buildPrompt } from './art/prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const artSrc = path.join(root, 'art-src');
const brainRoot = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'brain');
const logPath = path.join(artSrc, 'log.jsonl');

const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const RUN_TIMEOUT_MS = 400_000; // safety kill per agent run (spawn → exit)
const MAX_ATTEMPTS = 2;         // one retry when no image was produced

const USAGE =
  'Usage: node tools/gen-art.mjs [--style 2d|3d] [--only id1,id2] ' +
  '[--kind enemies|heroes] [--jobs 2] [--force]';

// ---- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { style: '3d', only: null, kind: null, jobs: 2, force: false, model: 'gemini-3.8-flash-high' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--style') opts.style = argv[++i];
    else if (a === '--only') {
      // Plain ids; tolerate an optional "kind/" prefix on each entry.
      opts.only = (argv[++i] || '')
        .split(',')
        .map((s) => s.trim().split('/').pop())
        .filter(Boolean);
    } else if (a === '--kind') opts.kind = argv[++i];
    else if (a === '--model') opts.model = argv[++i]; // e.g. claude-sonnet-4-6 when Gemini quota is out
    else if (a === '--jobs') opts.jobs = Number.parseInt(argv[++i], 10);
    else if (a === '--force') opts.force = true;
    else if (a === '--help' || a === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`unknown argument: ${a}\n${USAGE}`);
      process.exit(2);
    }
  }
  if (!Object.hasOwn(STYLES, opts.style)) {
    console.error(`--style must be 2d or 3d\n${USAGE}`);
    process.exit(2);
  }
  if (opts.kind !== null && opts.kind !== 'enemies' && opts.kind !== 'heroes') {
    console.error(`--kind must be enemies or heroes\n${USAGE}`);
    process.exit(2);
  }
  if (!Number.isInteger(opts.jobs) || opts.jobs < 1) {
    console.error(`--jobs must be a positive integer\n${USAGE}`);
    process.exit(2);
  }
  return opts;
}

// ---- helpers ----------------------------------------------------------------

// Any existing raw file for this character (art-src/<kind>/<id>.*).
function existingRaw(kind, id) {
  let names;
  try {
    names = fs.readdirSync(path.join(artSrc, kind));
  } catch {
    return null;
  }
  const hit = names.find((n) => n.startsWith(id + '.'));
  return hit ? path.join(artSrc, kind, hit) : null;
}

// Newest image agy dropped in this conversation's brain folder (top level only).
function newestImage(conversationId) {
  const dir = path.join(brainRoot, conversationId);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const files = entries
    .filter((e) => e.isFile() && IMG_EXTS.includes(path.extname(e.name).toLowerCase()))
    .map((e) => {
      const f = path.join(dir, e.name);
      return { f, mtime: fs.statSync(f).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].f : null;
}

function findKey(obj, key) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj[key] === 'string') return obj[key];
  for (const v of Object.values(obj)) {
    const hit = findKey(v, key);
    if (hit) return hit;
  }
  return null;
}

// agy --output-format stream-json emits NDJSON; the first init event carries
// the conversation id that names the brain folder.
function conversationIdFromLine(line) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return null;
  }
  if ((obj.type || obj.event) !== 'init') return null;
  return findKey(obj, 'conversation_id') || findKey(obj, 'conversationId');
}

// One agy run. Always resolves; the caller decides success by whether an image
// was produced.
function runAgent(prompt, model) {
  return new Promise((resolve) => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-art-'));
    const child = spawn(
      'agy',
      [
        '-p', prompt,
        '--model', model,
        '--output-format', 'stream-json',
        '--print-timeout', '280s',
      ],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let conversationId = null;
    let stderrTail = '';
    let lineBuf = '';
    let done = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, RUN_TIMEOUT_MS);

    const finish = (note) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        fs.rmSync(cwd, { recursive: true, force: true });
      } catch { /* best effort */ }
      resolve({ conversationId, timedOut, note: note || null });
    };

    child.on('error', (err) =>
      finish(err.code === 'ENOENT' ? 'agy not found on PATH' : String(err.message || err)));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      lineBuf += chunk;
      let nl;
      while ((nl = lineBuf.indexOf('\n')) >= 0) {
        const line = lineBuf.slice(0, nl);
        lineBuf = lineBuf.slice(nl + 1);
        if (!conversationId && line.trim()) {
          conversationId = conversationIdFromLine(line) || null;
        }
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (c) => {
      stderrTail = (stderrTail + c).slice(-400);
    });
    child.on('close', (code) => {
      if (code !== 0 && !conversationId) {
        finish(`agy exited with code ${code}${stderrTail.trim() ? `: ${stderrTail.trim()}` : ''}`);
      } else {
        finish(null);
      }
    });
  });
}

function logAttempt(entry) {
  try {
    fs.appendFileSync(logPath, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* logging must never kill a run */ }
}

// ---- per-character generation (with one retry) ------------------------------

async function generateCharacter(ch, opts) {
  const prompt = buildPrompt(opts.style, ch);
  const t0 = Date.now();
  let reason = 'unknown';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const run = await runAgent(prompt, opts.model);
    const src = run.conversationId ? newestImage(run.conversationId) : null;
    const secs = Math.round((Date.now() - t0) / 1000);

    if (src) {
      const destDir = path.join(artSrc, ch.kind);
      fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, ch.id + path.extname(src).toLowerCase());
      fs.copyFileSync(src, dest);
      logAttempt({
        kind: ch.kind, id: ch.id, style: opts.style, attempt, ok: true,
        seconds: secs, conversation: run.conversationId,
        file: path.relative(root, dest),
      });
      console.log(`ok ${ch.kind}/${ch.id} (${secs}s)`);
      return { ok: true };
    }

    reason = !run.conversationId
      ? (run.timedOut ? 'timed out before any stream event'
        : run.note || 'no conversation id in stream')
      : (run.timedOut ? 'timed out, no image saved'
        : 'no image found in brain folder');
    logAttempt({
      kind: ch.kind, id: ch.id, style: opts.style, attempt, ok: false,
      seconds: secs, conversation: run.conversationId, reason,
    });
    if (attempt < MAX_ATTEMPTS) console.log(`retry ${ch.kind}/${ch.id}: ${reason}`);
  }

  console.log(`FAIL ${ch.kind}/${ch.id}: ${reason}`);
  return { ok: false };
}

// ---- main --------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(artSrc, { recursive: true });

  const selected = CHARACTERS.filter(
    (ch) => (!opts.kind || ch.kind === opts.kind)
      && (!opts.only || opts.only.includes(ch.id)),
  );
  if (opts.only) {
    const hit = new Set(selected.map((c) => c.id));
    for (const id of opts.only) {
      if (!hit.has(id)) console.log(`note: unknown or filtered-out id "${id}"`);
    }
  }
  if (selected.length === 0) {
    console.log('nothing selected');
    return 0;
  }

  // Skip characters that already have raw art, unless --force.
  const queue = [];
  let skipped = 0;
  for (const ch of selected) {
    if (!opts.force && existingRaw(ch.kind, ch.id)) {
      console.log(`skip ${ch.kind}/${ch.id} (already in art-src)`);
      skipped++;
    } else {
      queue.push(ch);
    }
  }

  // Simple worker pool: at most --jobs agents run in parallel.
  const results = [];
  const workers = Array.from(
    { length: Math.max(1, Math.min(opts.jobs, queue.length)) },
    async () => {
      for (;;) {
        const ch = queue.shift();
        if (!ch) break;
        results.push(await generateCharacter(ch, opts));
      }
    },
  );
  await Promise.all(workers);

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  console.log(`summary: ${ok} ok, ${failed} failed, ${skipped} skipped (style ${opts.style})`);
  return failed === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err.stack || err);
    process.exit(1);
  },
);
