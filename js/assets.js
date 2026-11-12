// Sprite preloading and lookup, shared by enemies and heroes.
// Only paths listed in the asset manifest are ever requested, so an empty
// manifest falls back to emoji without any 404s.
import { CHARACTERS } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { ASSET_FILES } from './data/asset-manifest.js';

const known = new Set(ASSET_FILES);
const cache = new Map(); // path -> HTMLImageElement

export const hasAsset = (path) => known.has(path);

/** True when the character has its own art file for exactly this pose. */
export const hasPose = (def, pose) => hasAsset(def?.sprites?.[pose]);

/**
 * Create an Image per sprite path that is in the manifest (cached by path).
 * `onLoad` (optional) runs after each image loads, so HTML built from sprites
 * (how-to roster, hero cards) can re-render once the art is ready.
 */
export function preloadImages(onLoad) {
  for (const def of [...Object.values(CHARACTERS), ...Object.values(HEROES)]) {
    for (const path of Object.values(def.sprites || {})) {
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
