// Sprite preloading and lookup, shared by enemies and heroes.
import { CHARACTERS } from './data/enemies.js';
import { HEROES } from './data/heroes.js';

const cache = new Map(); // path -> HTMLImageElement

/** Create an Image per non-null sprite path (cached by path). Never loads null. */
export function preloadImages() {
  for (const def of [...Object.values(CHARACTERS), ...Object.values(HEROES)]) {
    for (const path of Object.values(def.sprites || {})) {
      if (!path || cache.has(path)) continue;
      const img = new Image();
      img.src = path;
      cache.set(path, img);
    }
  }
}

/**
 * The loaded sprite for `def` in `pose`, or null (rendering falls back to emoji).
 * Fallback order: requested pose -> 'walk' -> 'ready' -> null.
 */
export function getSprite(def, pose) {
  if (!def?.sprites) return null;
  for (const p of [pose, 'walk', 'ready']) {
    const path = def.sprites[p];
    if (!path) continue;
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
