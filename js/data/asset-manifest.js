// GENERATED — do not edit. Run: node tools/build-assets.mjs after adding files.
// Files not listed here are never requested by the game (no 404 spam).
export const ASSET_FILES = [];

// Sprite paths follow the conventions in docs/prompts/.
// kind is 'enemies' or 'heroes'; poses is an array of pose names.
export function spritePaths(kind, id, poses) {
  const out = {};
  for (const pose of poses) out[pose] = `assets/${kind}/${id}/${pose}.png`;
  return out;
}
