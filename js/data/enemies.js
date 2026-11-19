// ---------------------------------------------------------------------------
// Character roster: three tiers. Names match the art/sound file names under
// assets/ (see docs/prompts/enemy-characters.md and docs/prompts/sound-design.md).
//
//   Tier 1  MAIN TARGET     Hasina only. If she gets in, the game is over.
//   Tier 2  SENIOR LEADERS  If one gets in, you lose `penalty` points.
//   Tier 3  SMALL LEADERS   If one gets in, you lose `penalty` points.
//
// To change a character:
//   - name:   edit `char.<id>` in js/i18n.js (English + Bangla)
//   - art:    set `sprites.<pose>` (square image, drawn full-body); the emoji
//             is used until a sprite is present in the asset manifest
//   - balance: hp / speed / points / penalty / unlock below
//
// Units: speed is map units per second (1 unit ≈ 100 km), radius is map units.
// Behaviours: wobble (zig-zag), stealth (fades in and out), dash (jumps sideways
// when hit), group (spawns as a pack of N), summons ({ every, types }),
// splits ({ into: [ids], n }: breaks into n smaller intruders when caught
// by a tap; each child picks a random id from `into`).
// ---------------------------------------------------------------------------
import { CONFIG } from '../config.js';
import { spritePaths, animPaths } from './asset-manifest.js';

export const TIERS = {
  1: { penalty: null, gameOver: true },
  2: { penalty: 200 },
  3: { penalty: 50 },
};

export const CHARACTERS = {
  // ---- Tier 1: main target ------------------------------------------------
  hasina: {
    tier: 1, emoji: '👑', color: '#b0202a', sprites: spritePaths('enemies', 'hasina', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'hasina', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_hasina',
    hp: 15, speed: 0.06, radius: 0.21, points: 500,
    summons: { every: 3.5, types: ['nazmul', 'zakir', 'inan', 'nanok'] },
  },

  // ---- Tier 2: senior leaders ---------------------------------------------
  quader: { // "Organizer": keeps calling in small leaders
    tier: 2, emoji: '📢', color: '#e07b2a', sprites: spritePaths('enemies', 'quader', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'quader', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_quader',
    hp: 4, speed: 0.09, radius: 0.14, points: 80, unlock: 5,
    summons: { every: 4.5, types: ['nazmul', 'zakir'] },
  },
  nanok: { // "Heavy": takes a few hits
    tier: 2, emoji: '💪', color: '#8e5cc4', sprites: spritePaths('enemies', 'nanok', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'nanok', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_nanok',
    hp: 3, speed: 0.11, radius: 0.13, points: 50, unlock: 2,
  },
  taposh: { // "Dodger": jumps sideways when hit
    tier: 2, emoji: '🦟', color: '#3a6fb0', sprites: spritePaths('enemies', 'taposh', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'taposh', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_taposh',
    hp: 2, speed: 0.15, radius: 0.12, points: 60, unlock: 4, dash: true,
  },
  shamim: { // "Tank": very tough, very slow
    tier: 2, emoji: '😎', color: '#5b4636', sprites: spritePaths('enemies', 'shamim', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'shamim', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_shamim',
    hp: 7, speed: 0.07, radius: 0.16, points: 120, unlock: 7,
  },
  arafat: { // "Spin doctor": flickers like a TV signal
    tier: 2, emoji: '📺', color: '#2a9d9a', sprites: spritePaths('enemies', 'arafat', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'arafat', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_arafat',
    hp: 2, speed: 0.12, radius: 0.12, points: 70, unlock: 6, stealth: true,
  },

  // ---- Tier 3: small leaders ----------------------------------------------
  nazmul: { // "Basic"
    tier: 3, emoji: '😠', color: '#c0392b', sprites: spritePaths('enemies', 'nazmul', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'nazmul', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_nazmul',
    hp: 1, speed: 0.16, radius: 0.1, points: 10, unlock: 1,
  },
  zakir: { // "Basic"
    tier: 3, emoji: '😬', color: '#b5532a', sprites: spritePaths('enemies', 'zakir', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'zakir', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_zakir',
    hp: 1, speed: 0.17, radius: 0.1, points: 10, unlock: 1,
  },
  momotaz: { // "Basic"
    tier: 3, emoji: '🎤', color: '#c2185b', sprites: spritePaths('enemies', 'momotaz', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'momotaz', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_momotaz',
    hp: 1, speed: 0.15, radius: 0.1, points: 12, unlock: 2,
  },
  inan: { // "Runner": fast and zig-zags
    tier: 3, emoji: '🏃', color: '#f0a030', sprites: spritePaths('enemies', 'inan', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'inan', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_inan',
    hp: 1, speed: 0.29, radius: 0.085, points: 20, unlock: 2, wobble: true,
  },
  shohag: { // "Runner": fast and zig-zags
    tier: 3, emoji: '💨', color: '#d4a017', sprites: spritePaths('enemies', 'shohag', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'shohag', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_shohag',
    hp: 1, speed: 0.27, radius: 0.085, points: 20, unlock: 3, wobble: true,
  },
  saddam: { // "Pack": arrives in groups of three
    tier: 3, emoji: '✊', color: '#d9534f', sprites: spritePaths('enemies', 'saddam', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'saddam', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_saddam',
    hp: 1, speed: 0.2, radius: 0.075, points: 8, unlock: 3, group: 3,
  },
  murad: { // "Runner": fast and zig-zags
    tier: 3, emoji: '🥵', color: '#5b6fa8', sprites: spritePaths('enemies', 'murad', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'murad', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_murad',
    hp: 1, speed: 0.3, radius: 0.085, points: 22, unlock: 4, wobble: true,
  },
  ferdous: { // "Film star": fades in and out of view
    tier: 3, emoji: '🎬', color: '#4b3fa0', sprites: spritePaths('enemies', 'ferdous', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'ferdous', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_ferdous',
    hp: 1, speed: 0.19, radius: 0.09, points: 25, unlock: 4, stealth: true,
  },
  mahi: { // "Film star": fades in and out of view
    tier: 3, emoji: '🤳', color: '#e75480', sprites: spritePaths('enemies', 'mahi', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'mahi', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_mahi',
    hp: 1, speed: 0.19, radius: 0.09, points: 25, unlock: 5, stealth: true,
  },
  somrat: { // "Splitter": breaks into two small leaders when caught
    tier: 3, emoji: '🕶️', color: '#2e8b57', sprites: spritePaths('enemies', 'somrat', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'somrat', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_somrat',
    hp: 1, speed: 0.13, radius: 0.11, points: 15, unlock: 5,
    splits: { into: ['nazmul', 'zakir'], n: 2 },
  },
  riyaz: { // "Splitter": breaks into two small leaders when caught
    tier: 3, emoji: '👋', color: '#7d8b2e', sprites: spritePaths('enemies', 'riyaz', ['walk', 'kicked', 'idle']), anims: animPaths('enemies', 'riyaz', ['walk', 'struggle', 'jailed', 'emerge', 'kicked']), sound: 'enemy_riyaz',
    hp: 1, speed: 0.13, radius: 0.11, points: 15, unlock: 6,
    splits: { into: ['nazmul', 'zakir'], n: 2 },
  },
};

export const MAIN_ID = 'hasina';

export const penaltyOf = (def) => def.penalty ?? TIERS[def.tier].penalty;

/** When the main target appears: every 3rd wave, every 2nd from wave 12. */
export const isMainWave = (n) => (n >= CONFIG.waves.mainFromWave
  ? n % CONFIG.waves.mainEveryLate === 0
  : n % CONFIG.waves.mainEvery === 0);

export const POWERUPS = {
  freeze: { emoji: '❄️', color: '#6fd3ff' },
  shield: { emoji: '🛡️', color: '#7cffb2' },
};
