// Sprite preloading and lookup, shared by enemies and heroes.
// Only paths listed in the asset manifest are ever requested, so an empty
// manifest falls back to emoji without any 404s.
import { CONFIG } from './config.js';
import { CHARACTERS } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { ASSET_FILES } from './data/asset-manifest.js';

const known = new Set(ASSET_FILES);
const cache = new Map(); // path -> HTMLImageElement

export const hasAsset = (path) => known.has(path);

/** True when the character has its own art file for exactly this pose. */
export const hasPose = (def, pose) => hasAsset(def?.sprites?.[pose]);

/** True when the character has an animation strip for exactly this anim. */
export const hasAnim = (def, anim) => hasAsset(def?.anims?.[anim]);

/**
 * Create an Image per sprite path that is in the manifest (cached by path).
 * `onLoad` (optional) runs after each image loads, so HTML built from sprites
 * (how-to roster, hero cards) can re-render once the art is ready.
 * Walk strips are preloaded too (every character is on screen immediately);
 * the other anims load lazily via getFrame to keep the first load light.
 */
export function preloadImages(onLoad) {
  for (const def of [...Object.values(CHARACTERS), ...Object.values(HEROES)]) {
    for (const path of [...Object.values(def.sprites || {}), def.anims?.walk]) {
      if (!path || !known.has(path) || cache.has(path)) continue;
      const img = new Image();
      if (onLoad) img.onload = onLoad;
      img.src = path;
      cache.set(path, img);
    }
  }
}

/**
 * The loaded sprite for `def` in `pose`, or null (rendering falls back to emoji).
 * Fallback order: requested pose -> 'walk' -> 'ready' -> null.
 * Paths outside the manifest are never requested.
 */
export function getSprite(def, pose) {
  if (!def?.sprites) return null;
  for (const p of [pose, 'walk', 'ready']) {
    const path = def.sprites[p];
    if (!path || !known.has(path)) continue;
    let img = cache.get(path);
    if (!img) {
      img = new Image();
      img.src = path;
      cache.set(path, img);
    }
    if (img.complete && img.naturalWidth > 0) return img;
  }
  return null;
}

/**
 * One frame of a strip: strips are a single row of square frames (frame count
 * = width / height), so a frame is just a source-x offset. Asking starts the
 * download (lazy anims); null until it has loaded or when not in the manifest.
 */
function stripFrame(path, frameOf) {
  if (!path || !known.has(path)) return null;
  let img = cache.get(path);
  if (!img) {
    img = new Image();
    img.src = path;
    cache.set(path, img);
  }
  if (!img.complete || img.naturalWidth <= 0) return null;
  const n = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
  const side = img.naturalHeight;
  const frame = Math.min(n - 1, frameOf(n)); // clamp: never read past the row
  return { img, sx: frame * side, side };
}

/**
 * Current frame of `anim` at time `t` (s), or null (caller draws the static
 * sprite instead). Looping anims cycle; one-shots hold their last frame.
 */
export function getFrame(def, anim, t) {
  const { fps = 0, loop = false } = CONFIG.sprites.anims[anim] || {};
  const tt = Math.max(0, t); // negative t would break the loop's modulo
  return stripFrame(def?.anims?.[anim], (n) => (loop ? Math.floor(tt * fps) % n : Math.floor(tt * fps)));
}

/** Frame of `anim` at progress `k` in [0,1] (emerge follows the climb, not time). */
export function getFrameAt(def, anim, k) {
  const kk = Math.max(0, Math.min(1, k));
  return stripFrame(def?.anims?.[anim], (n) => Math.floor(kk * n));
}
