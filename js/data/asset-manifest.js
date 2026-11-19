// GENERATED — do not edit. Run: node tools/build-assets.mjs after adding files.
// Files not listed here are never requested by the game (no 404 spam).
export const ASSET_FILES = [
  'assets/enemies/arafat/emerge-strip.webp',
  'assets/enemies/arafat/jailed-strip.webp',
  'assets/enemies/arafat/kicked-strip.webp',
  'assets/enemies/arafat/struggle-strip.webp',
  'assets/enemies/arafat/walk-strip.webp',
  'assets/enemies/arafat/walk.png',
  'assets/enemies/ferdous/jailed-strip.webp',
  'assets/enemies/ferdous/struggle-strip.webp',
  'assets/enemies/ferdous/walk-strip.webp',
  'assets/enemies/ferdous/walk.png',
  'assets/enemies/hasina/emerge-strip.webp',
  'assets/enemies/hasina/jailed-strip.webp',
  'assets/enemies/hasina/kicked-strip.webp',
  'assets/enemies/hasina/struggle-strip.webp',
  'assets/enemies/hasina/walk-strip.webp',
  'assets/enemies/hasina/walk.png',
  'assets/enemies/inan/jailed-strip.webp',
  'assets/enemies/inan/struggle-strip.webp',
  'assets/enemies/inan/walk-strip.webp',
  'assets/enemies/inan/walk.png',
  'assets/enemies/mahi/jailed-strip.webp',
  'assets/enemies/mahi/struggle-strip.webp',
  'assets/enemies/mahi/walk-strip.webp',
  'assets/enemies/mahi/walk.png',
  'assets/enemies/momotaz/jailed-strip.webp',
  'assets/enemies/momotaz/struggle-strip.webp',
  'assets/enemies/momotaz/walk-strip.webp',
  'assets/enemies/momotaz/walk.png',
  'assets/enemies/murad/jailed-strip.webp',
  'assets/enemies/murad/struggle-strip.webp',
  'assets/enemies/murad/walk-strip.webp',
  'assets/enemies/murad/walk.png',
  'assets/enemies/nanok/emerge-strip.webp',
  'assets/enemies/nanok/jailed-strip.webp',
  'assets/enemies/nanok/kicked-strip.webp',
  'assets/enemies/nanok/struggle-strip.webp',
  'assets/enemies/nanok/walk-strip.webp',
  'assets/enemies/nanok/walk.png',
  'assets/enemies/nazmul/jailed-strip.webp',
  'assets/enemies/nazmul/struggle-strip.webp',
  'assets/enemies/nazmul/walk-strip.webp',
  'assets/enemies/nazmul/walk.png',
  'assets/enemies/quader/emerge-strip.webp',
  'assets/enemies/quader/jailed-strip.webp',
  'assets/enemies/quader/kicked-strip.webp',
  'assets/enemies/quader/struggle-strip.webp',
  'assets/enemies/quader/walk-strip.webp',
  'assets/enemies/quader/walk.png',
  'assets/enemies/riyaz/jailed-strip.webp',
  'assets/enemies/riyaz/struggle-strip.webp',
  'assets/enemies/riyaz/walk-strip.webp',
  'assets/enemies/riyaz/walk.png',
  'assets/enemies/saddam/jailed-strip.webp',
  'assets/enemies/saddam/struggle-strip.webp',
  'assets/enemies/saddam/walk-strip.webp',
  'assets/enemies/saddam/walk.png',
  'assets/enemies/shamim/emerge-strip.webp',
  'assets/enemies/shamim/jailed-strip.webp',
  'assets/enemies/shamim/kicked-strip.webp',
  'assets/enemies/shamim/struggle-strip.webp',
  'assets/enemies/shamim/walk-strip.webp',
  'assets/enemies/shamim/walk.png',
  'assets/enemies/shohag/jailed-strip.webp',
  'assets/enemies/shohag/struggle-strip.webp',
  'assets/enemies/shohag/walk-strip.webp',
  'assets/enemies/shohag/walk.png',
  'assets/enemies/somrat/jailed-strip.webp',
  'assets/enemies/somrat/struggle-strip.webp',
  'assets/enemies/somrat/walk-strip.webp',
  'assets/enemies/somrat/walk.png',
  'assets/enemies/taposh/emerge-strip.webp',
  'assets/enemies/taposh/jailed-strip.webp',
  'assets/enemies/taposh/kicked-strip.webp',
  'assets/enemies/taposh/struggle-strip.webp',
  'assets/enemies/taposh/walk-strip.webp',
  'assets/enemies/taposh/walk.png',
  'assets/enemies/zakir/jailed-strip.webp',
  'assets/enemies/zakir/struggle-strip.webp',
  'assets/enemies/zakir/walk-strip.webp',
  'assets/enemies/zakir/walk.png',
  'assets/heroes/common/ready.png',
  'assets/heroes/farmer/ready.png',
  'assets/heroes/studentF/ready.png',
  'assets/heroes/studentM/ready.png',
];

// Sprite paths follow the conventions in docs/prompts/.
// kind is 'enemies' or 'heroes'; poses is an array of pose names.
export function spritePaths(kind, id, poses) {
  const out = {};
  for (const pose of poses) out[pose] = `assets/${kind}/${id}/${pose}.png`;
  return out;
}

// Animation strips: assets/<kind>/<id>/<anim>-strip (webp), one row of square frames.
// Anims missing on disk are still listed; assets.js checks them against ASSET_FILES.
export function animPaths(kind, id, anims) {
  const out = {};
  for (const anim of anims) out[anim] = `assets/${kind}/${id}/${anim}-strip.webp`;
  return out;
}
