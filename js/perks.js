// ---------------------------------------------------------------------------
// Upgrades ("perks") offered between waves. After every PERK_EVERY-th cleared
// wave (see js/game.js) the player picks one of three random options.
//
// Each perk changes `game.mods` (run modifiers, reset every run) or the game
// state directly. `max` = how many times it can be taken per run.
// `available(game)` (optional) hides a perk when it would be useless.
// Names/descriptions: `perkName.<id>` / `perkDesc.<id>` in js/i18n.js.
// ---------------------------------------------------------------------------

/** Starting values for every run. game.js reads these instead of constants. */
export const BASE_MODS = {
  tapRadius: 1,      // multiplier on the tap hit radius
  knockback: 1,      // multiplier on the push-back when a tough intruder is hit
  sweepGain: 1,      // multiplier on how fast catches fill the Sweep meter
  dropBonus: 0,      // added to the 7% power-up drop chance
  comboWindow: 1.5,  // seconds between catches to keep a combo
  freezeTime: 4,     // seconds a Freeze lasts
  wallTime: 7,       // seconds a Border Wall lasts
};

export const PERKS = {
  reach: { emoji: '🎯', max: 2, apply: (g) => { g.mods.tapRadius += 0.25; } },
  push: { emoji: '💪', max: 2, apply: (g) => { g.mods.knockback += 1; } },
  charge: { emoji: '🔋', max: 3, apply: (g) => { g.mods.sweepGain += 0.3; } },
  luck: { emoji: '🍀', max: 3, apply: (g) => { g.mods.dropBonus += 0.04; } },
  rhythm: { emoji: '⏱️', max: 2, apply: (g) => { g.mods.comboWindow += 0.5; } },
  cold: { emoji: '🧊', max: 2, apply: (g) => { g.mods.freezeTime += 2; g.mods.wallTime += 3; } },
  shield: {
    emoji: '🛡️', max: 99, available: (g) => g.shield < 3,
    apply: (g) => { g.shield = Math.min(3, g.shield + 1); },
  },
};

/** Up to `n` distinct random perks the player can still take. */
export function perkOptions(game, n) {
  const ids = Object.keys(PERKS).filter((id) => {
    const p = PERKS[id];
    return (game.perks[id] || 0) < p.max && (!p.available || p.available(game));
  });
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, n);
}
