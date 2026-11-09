#!/usr/bin/env node
// Build the game's Bangladesh map data from Natural Earth.
//
// Source (public domain): Natural Earth 10m Admin 0 Countries,
// e.g. https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson
// (a local checkout of that file is all this script needs; it does not
// download anything itself).
//
// Usage (Node >= 18, no dependencies):
//   node tools/build-map.mjs <path-to-ne_10m_admin_0_countries.geojson> [--tolerance 0.02] [--preview <file.svg>]
//
// Writes js/data/map-bd.js (generated; do not edit by hand).
// `--preview <file.svg>` optionally writes an SVG review image (I=green,
// M=orange, C=blue mainland strokes, islands grey, Myanmar light grey,
// Dhaka dot). The default tolerance is 0.02 map units (~2 km; see `proj`
// below, where 1 unit ~ 100 km).
//
// Features are identified by `properties.ADM0_A3`
// (`BGD`, `IND`, `MMR`, also `NPL`, `BTN`, `CHN`); all geometries are
// MultiPolygons in [lon, lat].

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Equirectangular projection matching js/map.js.
// 1 map unit ~= 100 km, y grows downward (screen coords).
const COS = Math.cos((24 * Math.PI) / 180);
const proj = (lon, lat) => [(lon - 88) * COS, 26.8 - lat];

// ----------------------------------------------------------------- args
const args = process.argv.slice(2);
if (args.length === 0 || args[0].startsWith('-')) {
  console.error(
    'usage: node tools/build-map.mjs <geojson> [--tolerance 0.02] [--preview <file.svg>]',
  );
  process.exit(1);
}
const inputPath = args[0];
let tolerance = 0.02;
let previewPath = null;
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === '--tolerance') {
    if (++i >= args.length) { console.error('--tolerance needs a value'); process.exit(1); }
    tolerance = Number(args[i]);
  } else if (a.startsWith('--tolerance=')) {
    tolerance = Number(a.slice('--tolerance='.length));
  } else if (a === '--preview') {
    if (++i >= args.length) { console.error('--preview needs a file path'); process.exit(1); }
    previewPath = args[i];
  } else if (a.startsWith('--preview=')) {
    previewPath = a.slice('--preview='.length);
  } else {
    console.error(`unknown argument: ${a}`);
    process.exit(1);
  }
}
if (!Number.isFinite(tolerance) || tolerance <= 0) {
  console.error(`invalid --tolerance: ${tolerance}`);
  process.exit(1);
}

// --------------------------------------------------------------- helpers
function stripClosingDuplicate(ring) {
  const r = ring.slice();
  while (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  return r;
}

// Signed area in projected (screen) coords. > 0 means clockwise on screen
// (y down): e.g. (0,0)->(1,0)->(1,1)->(0,1) has area +1 and looks clockwise.
function signedAreaProj(ringLonLat) {
  let a = 0;
  const n = ringLonLat.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = proj(ringLonLat[i][0], ringLonLat[i][1]);
    const [x2, y2] = proj(ringLonLat[(i + 1) % n][0], ringLonLat[(i + 1) % n][1]);
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function ringAreaDeg2(ringLonLat) {
  let a = 0;
  const n = ringLonLat.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = ringLonLat[i];
    const [x2, y2] = ringLonLat[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

function distPointToSegPx(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const L = dx * dx + dy * dy;
  if (L === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / L;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Douglas-Peucker on an array of [x, y] (projected). Always keeps the first
// and last points. Returns sorted kept indices.
function douglasPeucker(pts, tol) {
  if (pts.length <= 2) return pts.map((_, i) => i);
  const keep = new Set([0, pts.length - 1]);
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distPointToSegPx(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
      if (d > maxD) { maxD = d; mi = i; }
    }
    if (maxD > tol && mi > a && mi < b) {
      keep.add(mi);
      stack.push([a, mi], [mi, b]);
    }
  }
  return [...keep].sort((x, y) => x - y);
}

// Simplify an open polyline (lon/lat array) in projected coords.
function simplifyOpen(lonLat, tol) {
  if (lonLat.length <= 2) return lonLat.slice();
  const pts = lonLat.map(([lon, lat]) => proj(lon, lat));
  return douglasPeucker(pts, tol).map((i) => lonLat[i]);
}

// Simplify a closed ring (lon/lat, no duplicate closing point).
// Uses the closed trick: append the first point so DP anchors both ends,
// then drop the duplicate. If it collapses below 3 points, keep the
// original ring instead.
function simplifyClosed(ringLonLat, tol) {
  const stripped = stripClosingDuplicate(ringLonLat);
  if (stripped.length <= 3) return stripped;
  const closed = stripped.concat([stripped[0]]);
  const pts = closed.map(([lon, lat]) => proj(lon, lat));
  const kept = douglasPeucker(pts, tol).map((i) => closed[i]);
  const out = stripClosingDuplicate(kept);
  return out.length >= 3 ? out : stripped;
}

function allSegments(feature) {
  const segs = [];
  const polys = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
        segs.push({
          ax, ay, bx, by,
          minX: Math.min(ax, bx), maxX: Math.max(ax, bx),
          minY: Math.min(ay, by), maxY: Math.max(ay, by),
        });
      }
    }
  }
  return segs;
}

const BORDER_THRESH = 0.0015; // degrees, per spec
function liesOn(lon, lat, segs) {
  for (const s of segs) {
    if (lon < s.minX - BORDER_THRESH || lon > s.maxX + BORDER_THRESH) continue;
    if (lat < s.minY - BORDER_THRESH || lat > s.maxY + BORDER_THRESH) continue;
    if (distPointToSegPx(lon, lat, s.ax, s.ay, s.bx, s.by) < BORDER_THRESH) return true;
  }
  return false;
}

// Maximal circular runs, returned as [{ tag, idx: [indices] }] in circular
// order starting after a run boundary. Used only for noise removal, where
// runs wrap around the ring.
function circularRuns(tags) {
  const n = tags.length;
  if (n === 0) return [];
  const runs = [];
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && tags[j] === tags[i]) j++;
    runs.push({ tag: tags[i], start: i, len: j - i });
    i = j;
  }
  // Merge first/last when they are the same tag (one circular run).
  if (runs.length > 1 && runs[0].tag === runs[runs.length - 1].tag) {
    const last = runs.pop();
    const first = runs.shift();
    runs.push({ tag: first.tag, start: last.start, len: last.len + first.len, wrapped: true });
    // `start` is the start of the tail piece; indices computed mod n.
  }
  return runs;
}

function denoiseTags(tags) {
  const t = tags.slice();
  const n = t.length;
  for (let iter = 0; iter < n; iter++) {
    const runs = circularRuns(t);
    if (runs.length <= 2) break;
    let fixed = false;
    for (let r = 0; r < runs.length; r++) {
      const run = runs[r];
      if (run.len >= 3) continue;
      const prev = runs[(r - 1 + runs.length) % runs.length];
      const next = runs[(r + 1) % runs.length];
      if (prev.tag !== next.tag || prev.tag === run.tag) continue;
      for (let k = 0; k < run.len; k++) t[(run.start + k) % n] = prev.tag;
      fixed = true;
      break; // recompute runs after each fix
    }
    if (!fixed) break;
  }
  return t;
}

function fmt4(v) {
  const r = Math.round(v * 10000) / 10000;
  return (r === 0 ? 0 : r).toFixed(4);
}

// ----------------------------------------------------------------- load
let raw;
try {
  raw = fs.readFileSync(inputPath, 'utf8');
} catch (e) {
  console.error(`cannot read input: ${inputPath}: ${e.message}`);
  process.exit(1);
}
const geo = JSON.parse(raw);
const byA3 = (a3) => geo.features.find((f) => f.properties && f.properties.ADM0_A3 === a3);
const bgd = byA3('BGD'), ind = byA3('IND'), mmr = byA3('MMR');
if (!bgd || !ind || !mmr) {
  console.error('missing BGD/IND/MMR feature (check properties.ADM0_A3)');
  process.exit(1);
}

function outerRings(feature) {
  if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates[0]];
  return feature.geometry.coordinates.map((poly) => poly[0]);
}

// 1. Mainland = BGD outer ring with the most points.
const bgdOuters = outerRings(bgd);
let mainlandIdx = 0;
for (let i = 1; i < bgdOuters.length; i++) {
  if (bgdOuters[i].length > bgdOuters[mainlandIdx].length) mainlandIdx = i;
}
let mainland = stripClosingDuplicate(bgdOuters[mainlandIdx].slice());

// 2. Orient clockwise on screen (y down) and start at the northernmost vertex.
if (signedAreaProj(mainland) < 0) mainland = mainland.slice().reverse();
let northIdx = 0;
for (let i = 1; i < mainland.length; i++) if (mainland[i][1] > mainland[northIdx][1]) northIdx = i;
mainland = mainland.slice(northIdx).concat(mainland.slice(0, northIdx));

// 3. Tag every vertex by the edge that starts there.
const indSegs = allSegments(ind), mmrSegs = allSegments(mmr);
const N = mainland.length;
let tags = mainland.map(([lon, lat], i) => {
  const [nlon, nlat] = mainland[(i + 1) % N];
  if (liesOn(lon, lat, indSegs) && liesOn(nlon, nlat, indSegs)) return 'I';
  if (liesOn(lon, lat, mmrSegs) && liesOn(nlon, nlat, mmrSegs)) return 'M';
  return 'C';
});
tags = denoiseTags(tags);
const tagCounts = (arr) => arr.reduce((a, t) => ((a[t] = (a[t] || 0) + 1), a), {});
console.log(`mainland original: ${N} vertices, tags ${JSON.stringify(tagCounts(tags))}`);

// 4. Simplify per tag-run (keeps run endpoints so boundaries survive).
const runs = [];
for (let i = 0; i < N;) {
  let j = i;
  while (j < N && tags[j] === tags[i]) j++;
  runs.push({ tag: tags[i], start: i, end: j - 1 }); // inclusive
  i = j;
}
const simplified = [];
for (const run of runs) {
  const idx = [];
  for (let k = run.start; k <= run.end; k++) idx.push(k);
  idx.push((run.end + 1) % N); // boundary vertex (start of next run)
  const pts = idx.map((gi) => proj(mainland[gi][0], mainland[gi][1]));
  const kept = douglasPeucker(pts, tolerance);
  // Emit kept points except the last (= next run's start); the next run's
  // first point emits that boundary vertex with its own tag.
  for (const kp of kept.slice(0, -1)) {
    const [lon, lat] = mainland[idx[kp]];
    simplified.push([lon, lat, run.tag]);
  }
  console.log(`  run ${run.tag}: ${idx.length - 1} -> ${kept.length - 1} vertices`);
}
console.log(`mainland simplified: ${simplified.length} vertices (target 250-500), tags ${JSON.stringify(tagCounts(simplified.map((v) => v[2])))}`);

// 5. Islands: other BGD outer rings with area >= threshold, 15 biggest.
const MIN_ISLAND_AREA = 0.003; // deg^2 (~35 km^2)
const MAX_ISLANDS = 15;
const islandCandidates = bgdOuters
  .map((ring, i) => ({ i, ring: stripClosingDuplicate(ring.slice()) }))
  .filter(({ i }) => i !== mainlandIdx)
  .map(({ ring }) => ({ ring, area: ringAreaDeg2(ring) }))
  .filter(({ area }) => area >= MIN_ISLAND_AREA)
  .sort((a, b) => b.area - a.area)
  .slice(0, MAX_ISLANDS);
const islands = islandCandidates.map(({ ring }) => simplifyClosed(ring, tolerance));
console.log(`islands: ${islands.length} rings, ${islands.reduce((s, r) => s + r.length, 0)} vertices ` +
  `(from ${bgdOuters.length - 1} other rings, area >= ${MIN_ISLAND_AREA} deg^2)`);

// 6. Myanmar: largest MMR ring, keep lon < 95.5 && lat > 19, then close and simplify.
const mmrOuters = outerRings(mmr);
let mmrIdx = 0;
for (let i = 1; i < mmrOuters.length; i++) if (mmrOuters[i].length > mmrOuters[mmrIdx].length) mmrIdx = i;
const mmrLargest = stripClosingDuplicate(mmrOuters[mmrIdx].slice());
const mmrFiltered = mmrLargest.filter(([lon, lat]) => lon < 95.5 && lat > 19);
if (mmrFiltered.length < 3) {
  console.error('Myanmar filtered ring has fewer than 3 points');
  process.exit(1);
}
const myanmar = simplifyOpen(mmrFiltered, tolerance);
console.log(`myanmar: ${mmrLargest.length} -> filtered ${mmrFiltered.length} -> simplified ${myanmar.length} vertices`);

// 7. Write js/data/map-bd.js.
const outPath = path.join(__dirname, '..', 'js', 'data', 'map-bd.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const lines = [];
lines.push('// GENERATED — do not edit. Run: node tools/build-map.mjs <path-to-ne_10m_admin_0_countries.geojson>');
lines.push('// Source: Natural Earth 10m Admin 0 Countries (public domain).');
lines.push('// MAINLAND vertices are clockwise from the northernmost vertex;');
lines.push("// each carries the type of the edge that STARTS at it: 'I' India, 'M' Myanmar, 'C' coast.");
lines.push('export const MAINLAND = [');
for (const [lon, lat, t] of simplified) lines.push(`  [${fmt4(lon)}, ${fmt4(lat)}, '${t}'],`);
lines.push('];');
lines.push('export const ISLANDS = [');
for (const ring of islands) {
  lines.push('  [' + ring.map(([lon, lat]) => `[${fmt4(lon)}, ${fmt4(lat)}]`).join(', ') + '],');
}
lines.push('];');
lines.push('export const MYANMAR_OUTLINE = [');
for (const [lon, lat] of myanmar) lines.push(`  [${fmt4(lon)}, ${fmt4(lat)}],`);
lines.push('];');
lines.push('');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`wrote ${outPath}`);

// 8. Optional preview SVG.
if (previewPath) {
  const all = [
    ...simplified.map(([lon, lat]) => proj(lon, lat)),
    ...islands.flatMap((r) => r.map(([lon, lat]) => proj(lon, lat))),
    ...myanmar.map(([lon, lat]) => proj(lon, lat)),
  ];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of all) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const pad = 0.4;
  const w = (maxX - minX) + pad * 2, h = (maxY - minY) + pad * 2;
  const sw = 900, sh = Math.round((900 * h) / w);
  const color = { I: '#1a9850', M: '#e67e22', C: '#2166ac' };
  let segs = '';
  for (let i = 0; i < simplified.length; i++) {
    const [lon, lat, t] = simplified[i];
    const [x1, y1] = proj(lon, lat);
    const [nlon, nlat] = [simplified[(i + 1) % simplified.length][0], simplified[(i + 1) % simplified.length][1]];
    const [x2, y2] = proj(nlon, nlat);
    segs += `<line x1="${x1.toFixed(4)}" y1="${y1.toFixed(4)}" x2="${x2.toFixed(4)}" y2="${y2.toFixed(4)}" stroke="${color[t]}" stroke-width="0.018"/>\n`;
  }
  const islandPaths = islands.map((ring) => {
    const d = ring.map(([lon, lat], i) => {
      const [x, y] = proj(lon, lat);
      return `${i ? 'L' : 'M'}${x.toFixed(4)},${y.toFixed(4)}`;
    }).join(' ') + ' Z';
    return `<path d="${d}" fill="none" stroke="#666" stroke-width="0.015"/>`;
  }).join('\n');
  const myD = myanmar.map(([lon, lat], i) => {
    const [x, y] = proj(lon, lat);
    return `${i ? 'L' : 'M'}${x.toFixed(4)},${y.toFixed(4)}`;
  }).join(' ') + ' Z';
  const [dx, dy] = proj(90.41, 23.81);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}" viewBox="${(minX - pad).toFixed(4)} ${(minY - pad).toFixed(4)} ${w.toFixed(4)} ${h.toFixed(4)}">\n` +
    `<rect x="${(minX - pad).toFixed(4)}" y="${(minY - pad).toFixed(4)}" width="${w.toFixed(4)}" height="${h.toFixed(4)}" fill="#fff"/>\n` +
    `<path d="${myD}" fill="#e5e5e5" stroke="#999" stroke-width="0.015"/>\n` +
    islandPaths + '\n' + segs +
    `<circle cx="${dx.toFixed(4)}" cy="${dy.toFixed(4)}" r="0.05" fill="#d73027" stroke="#000" stroke-width="0.01"/>\n` +
    `<text x="${(dx + 0.08).toFixed(4)}" y="${dy.toFixed(4)}" font-size="0.12" fill="#000">Dhaka</text>\n` +
    `<text x="${(minX - pad + 0.05).toFixed(4)}" y="${(minY - pad + 0.18).toFixed(4)}" font-size="0.14" fill="#000">I=green M=orange C=blue (tol ${tolerance})</text>\n` +
    '</svg>\n';
  fs.mkdirSync(path.dirname(path.resolve(previewPath)), { recursive: true });
  fs.writeFileSync(previewPath, svg);
  console.log(`wrote preview ${previewPath} (${sw}x${sh})`);
}
