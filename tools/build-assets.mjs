#!/usr/bin/env node
// Scan assets/ and write the manifest the game loads from.
//
// Only files listed in js/data/asset-manifest.js are ever requested, so the
// game never spams 404s for art/sounds that don't exist yet. Re-run after
// adding files:
//
//   node tools/build-assets.mjs
//
// Writes js/data/asset-manifest.js (generated; do not edit by hand) and
// prints a short per-character present/missing report. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const outPath = path.join(root, 'js', 'data', 'asset-manifest.js');

// Expected files (ids match docs/prompts/ art and sound file names).
const ENEMIES = [
  'hasina', 'quader', 'nanok', 'taposh', 'shamim', 'arafat',
  'nazmul', 'zakir', 'momotaz', 'inan', 'shohag', 'saddam',
  'murad', 'ferdous', 'mahi', 'somrat', 'riyaz',
];
const HEROES = ['farmer', 'studentM', 'studentF', 'common'];
const ENEMY_POSES = ['walk', 'kicked', 'idle'];
const HERO_POSES = ['ready', 'kick', 'cheer'];
const GAME_SFX = [
  'hit', 'miss', 'catch', 'combo', 'close', 'power', 'freeze', 'wall',
  'shield', 'sweep', 'wave', 'cleared', 'warn', 'boss', 'leak',
  'perk', 'over', 'record', 'tap',
];
const MUSIC = ['menu', 'game', 'boss'];

// Walk assets/ (if it exists) and collect repo-relative paths with '/'.
// Only loadable game assets are listed (.md and other docs are never requested).
const ASSET_EXTS = ['.png', '.mp3', '.ogg'];
function scan(dir, prefix, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const rel = `${prefix}/${e.name}`;
    if (e.isDirectory()) scan(path.join(dir, e.name), rel, out);
    else if (e.isFile() && ASSET_EXTS.includes(path.extname(e.name))) out.push(rel);
  }
}

const files = [];
scan(assetsDir, 'assets', files);
files.sort();
const known = new Set(files);

function soundPresent(base) {
  return known.has(`${base}.mp3`) || known.has(`${base}.ogg`);
}

// ---- write the manifest ---------------------------------------------------
const lines = [];
lines.push('// GENERATED — do not edit. Run: node tools/build-assets.mjs after adding files.');
lines.push('// Files not listed here are never requested by the game (no 404 spam).');
if (files.length === 0) {
  lines.push('export const ASSET_FILES = [];');
} else {
  lines.push('export const ASSET_FILES = [');
  for (const f of files) lines.push(`  '${f}',`);
  lines.push('];');
}
lines.push('');
lines.push('// Sprite paths follow the conventions in docs/prompts/.');
lines.push('// kind is \'enemies\' or \'heroes\'; poses is an array of pose names.');
lines.push('export function spritePaths(kind, id, poses) {');
lines.push('  const out = {};');
lines.push('  for (const pose of poses) out[pose] = `assets/${kind}/${id}/${pose}.png`;');
lines.push('  return out;');
lines.push('}');
lines.push('');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`wrote ${path.relative(root, outPath)} (${files.length} file${files.length === 1 ? '' : 's'})`);

// ---- short present/missing report ----------------------------------------
for (const id of ENEMIES) {
  const missing = ENEMY_POSES.filter((p) => !known.has(`assets/enemies/${id}/${p}.png`));
  if (!soundPresent(`assets/sfx/enemies/${id}`)) missing.push('sfx');
  console.log(`${id}: ${missing.length === 0 ? 'complete' : `missing ${missing.join(', ')}`}`);
}
for (const id of HEROES) {
  const missing = HERO_POSES.filter((p) => !known.has(`assets/heroes/${id}/${p}.png`));
  if (!soundPresent(`assets/sfx/heroes/${id}`)) missing.push('sfx');
  console.log(`${id}: ${missing.length === 0 ? 'complete' : `missing ${missing.join(', ')}`}`);
}
const gameMissing = GAME_SFX.filter((n) => !soundPresent(`assets/sfx/game/${n}`));
console.log(`game sfx: ${gameMissing.length === 0 ? 'complete' : `missing ${gameMissing.length} (${gameMissing.join(', ')})`}`);
const musicMissing = MUSIC.filter((n) => !soundPresent(`assets/music/${n}`));
console.log(`music: ${musicMissing.length === 0 ? 'complete' : `missing ${musicMissing.length} (${musicMissing.join(', ')})`}`);
