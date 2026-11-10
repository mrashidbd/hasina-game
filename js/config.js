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
    poolBackbone: { nazmul: 4, zakir: 4, momotaz: 2 }, // id -> fixed weight, still subject to unlock
    poolTier3Base: 1, // weight, tier-3 pool weight base (base + perWave·n)
    poolTier3PerWave: 0.3, // weight per wave, tier-3 pool weight growth
    poolTier2Base: 0.8, // weight, tier-2 pool weight base (base + perWave·n)
    poolTier2PerWave: 0.28, // weight per wave, tier-2 pool weight growth
    warnThrottle: 0.25, // s, minimum interval between spawn-warning sounds
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
    heroShowTime: 0.35, // s, hero stays on screen per kick
    kickDuration: 0.25, // s, kick animation duration
    heroSizePx: 64, // px, hero sprite/emoji size during a kick
    heroOffsetPx: 10, // px, hero centre sits this far behind the intruder radius
    windupTime: 0.06, // s, ready pose before the kick pose
    fleeDistancePx: 300, // px, flee distance after a catch
    fleeSpeedPx: 520, // px/s, flee speed after a catch
    fleeHopPx: 18, // px, upward hop at the start of the flee
    fleeWobbleDeg: 12, // deg, fleeing tilt/wobble amplitude
    fleeFade: true, // fade out while fleeing
    sweepAllHeroes: true, // bool, sweep kicks cycle through all heroes
  },
  sprites: {
    heightMul: 2.8, // multiplier, full-body sprite height = rpx(r) × heightMul
    feetOffset: 0.9, // multiplier, feet sit at y + rpx(r) × feetOffset below the centre
  },
  audio: {
    musicVolume: 0.35, // volume, music track volume
    sfxVolume: 1, // volume, multiplier on file-playback volume
  },
  // "Rope 'Em!" mode (js/lasso.js). Map units: 1 ≈ 100 km. See docs/PLAN-lasso.md.
  lasso: {
    roundTime: 60, // s, length of a round
    breakTime: 2.2, // s, pause between rounds
    targetBase: 5, // catches, round target = targetBase + targetPerRound × round
    targetPerRound: 2, // catches per round
    mainCountsAs: 5, // catches, a Hasina catch counts this much toward the target
    unlockPerRound: 1.5, // classic waves per round, for `unlock` and pool weights
    maxOnMapBase: 4, // count, characters on the map at once (round 1)
    maxOnMapPerRound: 0.6, // count added per round
    maxOnMapCap: 12, // count, hard cap
    firstSpawnDelay: 0.6, // s
    spawnEvery: 1.6, // s between spawns (round 1)
    spawnSpeedup: 0.92, // factor per round
    spawnEveryMin: 0.6, // s
    spawnHeroGap: 0.6, // map units, spawns keep this far from the hero
    speedMul: 0.55, // × character speed (classic speeds are for a sprint)
    speedPerRound: 0.06, // speed bonus per round
    lurkMin: 6, lurkMax: 12, // s wandering before bolting for the border (tier 3)
    lurkTier2Mul: 0.85, // × lurk time for tier 2
    mainLurkMul: 0.5, // × lurk time for Hasina
    boltSpeedMul: 1.6, // × speed while bolting for the border
    boltOvershoot: 0.4, // map units past the border they aim for
    waypointMinDist: 0.6, // map units between lurk waypoints
    mainSpeed: 0.26, // map units/s, Hasina's base speed (the fastest on the map)
    mainFromRound: 2, // round, Hasina can appear from this round
    mainChance: 0.35, // chance per round (at most once per round)
    mainEveryRound: 4, // Hasina is guaranteed every Nth round
    mainPoints: 1000, // points for catching Hasina
    pathPoints: 320, // count, samples on the hero's patrol loop
    pathInset: 0.12, // map units the patrol loop sits inside the border
    pathSmooth: 9, // samples, moving-average window that smooths the loop
    heroLapTime: 16, // s for one full lap
    heroSizePx: 56, // px, hero size
    cheerTime: 0.6, // s, cheer pose after a catch
    ropeRange: 1.7, // map units, max throw distance
    ropeSpeed: 7, // map units/s, loop flight speed (out and back)
    loopRadius: 0.28, // map units, catch radius of the loop
    dodgeChance: 0.5, // chance a dodger jumps out of an incoming loop
    dodgeDist: 0.35, // map units, dodge jump
    autoReelTime: 0.45, // s to pull in a 1-HP character
    reelStart: 0.35, // tug meter start value (0..1)
    reelPerTap: 0.2, // tug gain per tap ÷ strength
    pullBase: 0.1, // tug loss per s × strength
    strengthExp: 0.35, // strength = hp ^ strengthExp
    mainPullMul: 1.2, // × Hasina's pull
    breakDashTime: 0.6, // s a character dashes away after the rope snaps
    breakDashMul: 3, // × speed while dashing away
    roundBonus: 100, // points × round for reaching the target
    timeBonusPerSec: 10, // points per second left when the target was reached
    powerups: ['freeze', 'wall', 'shield'], // kinds that can drop in this mode
  },
};
