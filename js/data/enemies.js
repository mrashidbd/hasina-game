// ---------------------------------------------------------------------------
// Character roster: three tiers. All names and art are PLACEHOLDERS to be
// fine-tuned later.
//
//   Tier 1  MAIN TARGET     Hasina only. If she gets in, the game is over.
//   Tier 2  SENIOR LEADERS  If one gets in, you lose `penalty` points.
//   Tier 3  SMALL LEADERS   If one gets in, you lose `penalty` points.
//
// To change a character:
//   - name:   edit `char.<id>` in js/i18n.js (English + Bangla)
//   - art:    set `sprites.walk: 'assets/<id>.png'` (square image, drawn in
//             the circle); the emoji is used until a sprite is set
//   - balance: hp / speed / points / penalty / unlock below
//
// Units: speed is map units per second (1 unit ≈ 100 km), radius is map units.
// Behaviours: wobble (zig-zag), stealth (fades in and out), dash (jumps sideways
// when hit), group (spawns as a pack of N), summons ({ every, types }),
// splits ({ into, n }: breaks into n smaller intruders when caught by a tap).
// ---------------------------------------------------------------------------
import { CONFIG } from '../config.js';

export const TIERS = {
  1: { penalty: null, gameOver: true },
  2: { penalty: 200 },
  3: { penalty: 50 },
};

export const CHARACTERS = {
  // ---- Tier 1: main target ------------------------------------------------
  hasina: {
    tier: 1, emoji: '👑', color: '#b0202a', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 15, speed: 0.06, radius: 0.21, points: 500, sweepGain: 30,
    summons: { every: 3.5, types: ['small1', 'small1', 'small2', 'senior1'] },
  },

  // ---- Tier 2: senior leaders ---------------------------------------------
  senior1: { // "Heavy": takes a few hits
    tier: 2, emoji: '😤', color: '#8e5cc4', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 3, speed: 0.11, radius: 0.13, points: 50, sweepGain: 10, unlock: 2,
  },
  senior2: { // "Dodger": jumps sideways when hit
    tier: 2, emoji: '🕴️', color: '#3a6fb0', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 2, speed: 0.15, radius: 0.12, points: 60, sweepGain: 10, unlock: 4, dash: true,
  },
  senior3: { // "Organizer": keeps calling in small leaders
    tier: 2, emoji: '📢', color: '#c06a2b', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 4, speed: 0.09, radius: 0.14, points: 80, sweepGain: 12, unlock: 5,
    summons: { every: 4.5, types: ['small1'] },
  },
  senior4: { // "Tank": very tough, very slow
    tier: 2, emoji: '😎', color: '#5b4636', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 7, speed: 0.07, radius: 0.16, points: 120, sweepGain: 15, unlock: 7,
  },

  // ---- Tier 3: small leaders ----------------------------------------------
  small1: { // "Basic"
    tier: 3, emoji: '😠', color: '#d9534f', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 1, speed: 0.16, radius: 0.1, points: 10, sweepGain: 5, unlock: 1,
  },
  small2: { // "Runner": fast and zig-zags
    tier: 3, emoji: '🏃', color: '#f0a030', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 1, speed: 0.29, radius: 0.085, points: 20, sweepGain: 6, unlock: 2, wobble: true,
  },
  small3: { // "Sneaky": fades in and out of view
    tier: 3, emoji: '🥷', color: '#4a5a6e', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 1, speed: 0.19, radius: 0.09, points: 25, sweepGain: 7, unlock: 3, stealth: true,
  },
  small4: { // "Pack": arrives in groups of three
    tier: 3, emoji: '😬', color: '#c9a227', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 1, speed: 0.2, radius: 0.075, points: 8, sweepGain: 3, unlock: 4, group: 3,
  },
  small5: { // "Splitter": breaks into two small leaders when caught
    tier: 3, emoji: '🤡', color: '#2f9e8f', sprites: { walk: null, kicked: null, idle: null }, sound: null,
    hp: 1, speed: 0.13, radius: 0.11, points: 15, sweepGain: 5, unlock: 5,
    splits: { into: 'small1', n: 2 },
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
  wall: { emoji: '🧱', color: '#e0894a' },
  shield: { emoji: '🛡️', color: '#7cffb2' },
  charge: { emoji: '⚡', color: '#ffe15a' },
};
