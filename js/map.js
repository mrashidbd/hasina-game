// Simplified outline of Bangladesh (lon, lat), clockwise from the northern tip.
// Each vertex carries the type of the edge that STARTS at it:
//   I = border with India (enemies come from here)
//   M = border with Myanmar
//   C = coastline (Bay of Bengal)
// Accuracy is "recognisable game outline", not cartographic.
const RAW = [
  [88.45, 26.63, 'I'], [88.75, 26.30, 'I'], [89.05, 26.40, 'I'], [89.35, 26.00, 'I'],
  [89.85, 25.95, 'I'], [89.85, 25.30, 'I'], [90.40, 25.18, 'I'], [91.20, 25.20, 'I'],
  [92.00, 25.15, 'I'], [92.40, 24.95, 'I'], [92.20, 24.55, 'I'], [92.30, 24.25, 'I'],
  [91.90, 24.20, 'I'], [91.60, 23.95, 'I'], [91.35, 23.10, 'I'], [91.60, 23.00, 'I'],
  [91.80, 23.60, 'I'], [92.15, 23.65, 'I'], [92.35, 23.30, 'I'], [92.40, 22.80, 'I'],
  [92.60, 22.10, 'M'], [92.70, 21.40, 'M'], [92.30, 21.00, 'M'],
  [92.20, 20.75, 'C'], [92.00, 21.20, 'C'], [91.85, 21.80, 'C'], [91.80, 22.35, 'C'],
  [91.50, 22.70, 'C'], [91.00, 22.55, 'C'], [90.65, 22.00, 'C'], [90.30, 21.85, 'C'],
  [89.90, 21.80, 'C'], [89.50, 21.75, 'C'],
  [89.10, 21.70, 'I'], [89.05, 22.10, 'I'], [88.95, 22.80, 'I'], [88.75, 23.25, 'I'],
  [88.55, 23.65, 'I'], [88.75, 24.20, 'I'], [88.15, 24.50, 'I'], [88.05, 24.80, 'I'],
  [88.30, 25.20, 'I'], [88.55, 25.55, 'I'], [88.10, 25.80, 'I'], [88.20, 26.15, 'I'],
];

// Equirectangular projection to "map units" (~1 unit ≈ 100 km). y grows downward.
const COS = Math.cos((24 * Math.PI) / 180);
export const proj = (lon, lat) => [(lon - 88) * COS, 26.8 - lat];

export const BD = RAW.map(([lon, lat]) => proj(lon, lat));

export const INDIA_EDGES = [];
RAW.forEach((v, i) => {
  if (v[2] !== 'I') return;
  const a = BD[i];
  const b = BD[(i + 1) % BD.length];
  INDIA_EDGES.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
});
export const INDIA_LEN = INDIA_EDGES.reduce((s, e) => s + e.len, 0);

// Bay of Bengal: coastline + far-away points south.
export const SEA = [
  ...RAW.filter((v) => v[2] === 'C').map(([lon, lat]) => proj(lon, lat)), // Teknaf → west
  proj(89.10, 21.70),
  proj(80, 21.65),
  proj(80, 10),
  proj(93.5, 10),
  proj(92.95, 19.9),
];

export const MYANMAR = [
  proj(92.60, 22.10), proj(93.25, 22.6), proj(93.45, 24.2), proj(100, 24.2),
  proj(100, 19.9), proj(92.95, 19.9), proj(92.20, 20.75), proj(92.30, 21.00), proj(92.70, 21.40),
];

export const DHAKA = proj(90.41, 23.81);

export const LABELS = [
  { text: 'INDIA', at: proj(87.2, 25.0) },
  { text: 'INDIA', at: proj(90.9, 26.25) },
  { text: 'INDIA', at: proj(93.2, 24.6) },
  { text: 'MYANMAR', at: proj(93.4, 21.2) },
  { text: 'BAY OF BENGAL', at: proj(90.4, 21.0) },
];

export const BBOX = BD.reduce(
  (b, [x, y]) => ({
    minX: Math.min(b.minX, x), minY: Math.min(b.minY, y),
    maxX: Math.max(b.maxX, x), maxY: Math.max(b.maxY, y),
  }),
  { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
);

export function pointInPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distToPoly(poly, x, y) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}
