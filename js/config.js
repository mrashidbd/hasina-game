// ---------------------------------------------------------------------------
// Every global gameplay tunable lives here. Engine code reads CONFIG.x.y
// instead of literals; roster stats stay in js/data/enemies.js.
// Units: distances/speeds are map units (1 unit ≈ 100 km) unless noted px/s.
// ---------------------------------------------------------------------------

export const CONFIG = {
  layout: {
    pad: 0.7, // map units of "India" kept visible around Bangladesh
    hudTop: 64, // px, HUD inset at the top
    hudBottom: 90, // px, HUD inset at the bottom
    minRadiusPx: 15, // px, minimum rendered radius so targets stay tappable
    dprCap: 2, // device-pixel-ratio cap for the canvas
  },
  spawn: {
    min: 0.5, // map units, spawn distance outside the border (SPAWN_MIN)
    max: 0.8, // map units, spawn distance outside the border (SPAWN_MAX)
    minBorderDist: 0.3, // map units, minimum distance from the border
    tries: 40, // attempts to find a valid spawn point per spawn
    viewMargin: 0.06, // map units, keep spawns this far inside the view edge
    fairnessMin: 0.5, // multiplier, lower clamp for fairness speed scaling
    fairnessMax: 1, // multiplier, upper clamp for fairness speed scaling
    speedJitterMin: 0.9, // multiplier, lower speed jitter on spawn
    speedJitterMax: 1.1, // multiplier, upper speed jitter on spawn
    warnTime: 0.7, // s, how long a spawn is telegraphed before it appears
    packSpread: 0.12, // map units, pack members spawn this far from the leader
    packTargetJitter: 0.1, // map units, pack target jitter around the leader target
    summonSpread: 0.15, // map units, summons appear this far from the summoner
    summonMinInterval: 1.8, // s, minimum interval between summons
    summonSpeedupPerWave: 0.05, // s, summon interval shrinks by this per wave
    normalProbe: 0.02, // map units, probe distance to orient the border normal
    targetInset: 0.05, // map units, border target sits this far inside the border
  },
  waves: {
    countBase: 5, // count, base intruders per wave (count = base + floor(perWave·n))
    countPerWave: 1.8, // count per wave, added per wave number
    intervalBase: 1.5, // s, base spawn interval (interval = base·decay^(n−1))
    intervalDecay: 0.92, // multiplier, spawn interval decay per wave
    intervalMin: 0.3, // s, minimum spawn interval
    jitterMin: 0.7, // multiplier, lower spawn interval jitter
    jitterMax: 1.3, // multiplier, upper spawn interval jitter
    speedBase: 1, // multiplier, base speed multiplier (speedMul = base + perWave·(n−1))
    speedPerWave: 0.07, // multiplier per wave, speed growth per wave
    speedMax: 2.1, // multiplier, maximum speed multiplier
    doubleFromWave: 6, // wave, double spawns start from this wave
    doubleChance: 0.2, // probability, chance of a second spawn in the same tick
    firstSpawnDelay: 1.2, // s, delay before the first spawn of a wave
    breakTime: 2.4, // s, break between waves
    poolBackboneId: 'small1', // id, backbone character id (fixed pool weight)
    poolBackboneWeight: 10, // weight, backbone pool weight
    poolTier3Base: 2, // weight, tier-3 pool weight base (base + perWave·n)
    poolTier3PerWave: 0.6, // weight per wave, tier-3 pool weight growth
    poolTier2Base: 1, // weight, tier-2 pool weight base (base + perWave·n)
    poolTier2PerWave: 0.35, // weight per wave, tier-2 pool weight growth
    mainEvery: 3, // waves, main target every Nth wave
    mainFromWave: 12, // wave, from this wave the main target comes more often
    mainEveryLate: 2, // waves, main target every Nth wave from mainFromWave
    mainHpPerAppearance: 5, // hp, extra main-target hp per appearance
  },
  scoring: {
    comboWindow: 1.5, // s, window between catches to keep a combo
    multiplierStep: 5, // count, catches per multiplier step
    multiplierMax: 5, // multiplier, maximum combo multiplier
    closeCallDistance: 0.12, // map units, border distance that counts as a close call
    closeCallBonus: 25, // points, close-call bonus
    clearPerWave: 50, // points per wave, wave-clear bonus (bonus = perWave·n)
    sharpshooterPerWave: 25, // points per wave, sharpshooter bonus (bonus = perWave·n)
    sharpshooterAccuracy: 0.9, // ratio, accuracy needed for the sharpshooter bonus
    sealedPerWave: 30, // points per wave, no-leaks bonus (bonus = perWave·n)
    sweepPointsFactor: 0.5, // multiplier, sweep catches give this fraction of points
    sweepMax: 100, // points, sweep meter maximum
  },
  input: {
    hitRadiusMultiplier: 1.25, // multiplier, expands the enemy radius for taps
    minHitRadiusPx: 26, // px, minimum tap hit radius
    powerupTapRadiusPx: 30, // px, power-up tap radius
  },
  combat: {
    knockback: 0.035, // map units, push-back when a tough intruder is hit
    dash: 0.16, // map units, sideways dash distance when hit
    dangerDistance: 0.18, // map units, distance at which an intruder is dangerous
    phaseSwitchDistance: 0.03, // map units, switch phase this close to the border target
    wobbleFrequency: 5, // rad/s, wobble sine frequency
    wobbleAmplitude: 0.8, // multiplier, wobble sideways amplitude (× speed)
    splitterPush: 0.1, // map units, splitter children pushed back from the border
    splitterSpacing: 0.14, // map units, splitter children spacing
    hitFlashTime: 0.15, // s, white hit-flash duration
  },
  powerups: {
    dropChance: 0.07, // probability, power-up drop chance on a catch
    life: 6, // s, power-up lifetime
    blinkTime: 1.5, // s, power-ups blink during their last this-many seconds
    maxShield: 3, // count, maximum shields held
    freezeTime: 4, // s, freeze duration
    wallTime: 7, // s, border wall duration
    wallSlow: 0.4, // multiplier, speed while the wall is active
    chargeAmount: 40, // points, sweep charge from the charge power-up
    sweepMainDamage: 4, // damage, sweep damage dealt to the main target
    sweepDamage: 99, // damage, sweep damage dealt to regular intruders
  },
  perks: {
    every: 2, // waves, offer an upgrade after every Nth cleared wave
    choices: 3, // count, number of upgrade choices offered
  },
  kick: {
    heroShowTime: 0.35, // s, hero shown before a kick (later phase, unused)
    kickDuration: 0.25, // s, kick animation duration (later phase, unused)
    fleeDistancePx: 300, // px, flee distance after a kick (later phase, unused)
    fleeSpeedPx: 520, // px/s, flee speed after a kick (later phase, unused)
    fleeFade: true, // fade out while fleeing (later phase, unused)
  },
};
