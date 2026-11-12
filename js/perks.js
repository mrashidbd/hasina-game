// ---------------------------------------------------------------------------
// Run modifiers. `BASE_MODS` is copied to `game.mods` at the start of every
// run (see js/game.js); gameplay code reads `game.mods.*` instead of
// constants, so this stays the single place to tune the per-run values.
// ---------------------------------------------------------------------------
import { CONFIG } from './config.js';

/** Starting values for every run. game.js reads these instead of constants. */
export const BASE_MODS = {
  tapRadius: 1,      // multiplier on the tap hit radius
  knockback: 1,      // multiplier on the push-back when a tough intruder is hit
  dropBonus: 0,      // added to the power-up drop chance
  comboWindow: CONFIG.scoring.comboWindow, // seconds between catches to keep a combo
  freezeTime: CONFIG.powerups.freezeTime, // seconds a Freeze lasts
};
