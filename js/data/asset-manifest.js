// GENERATED — do not edit. Run: node tools/build-assets.mjs after adding files.
// Files not listed here are never requested by the game (no 404 spam).
export const ASSET_FILES = [
  'assets/enemies/arafat/walk.png',
  'assets/enemies/hasina/walk.png',
  'assets/enemies/inan/walk.png',
  'assets/enemies/momotaz/walk.png',
  'assets/enemies/nanok/walk.png',
  'assets/enemies/nazmul/walk.png',
  'assets/enemies/quader/walk.png',
  'assets/enemies/shamim/walk.png',
  'assets/enemies/taposh/walk.png',
  'assets/enemies/zakir/walk.png',
  'assets/heroes/farmer/ready.png',
];

// Sprite paths follow the conventions in docs/prompts/.
// kind is 'enemies' or 'heroes'; poses is an array of pose names.
export function spritePaths(kind, id, poses) {
  const out = {};
  for (const pose of poses) out[pose] = `assets/${kind}/${id}/${pose}.png`;
  return out;
}
