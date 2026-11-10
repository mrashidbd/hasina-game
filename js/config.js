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
    // hero
    orbitRadius: 0.55,     // map units, hero circles Dhaka at this radius
    orbitLapTime: 10,      // s per lap
    heroRunSpeed: 1.8,     // map units/s while chasing / returning
    heroSizePx: 56,        // px
    cheerTime: 0.6,        // s
    // rope
    ropeRange: 3.0,        // map units (covers Bangladesh from the orbit)
    ropeSpeed: 8,          // map units/s
    loopRadius: 0.3,       // map units
    homing: true,          // loop follows a tapped crook while flying
    dodgeChance: 0.5, dodgeDist: 0.35,
    autoReelTime: 0.45, reelStart: 0.35, reelPerTap: 0.2, pullBase: 0.1,
    strengthExp: 0.35, mainPullMul: 1.0, // Hasina needs ~3.3 taps/s just to hold her
    breakDashTime: 0.6, breakDashMul: 3,
    yankTime: 0.7,         // s, flight into the jail
    yankArcPx: 90,         // px, height of the flight arc
    // lurkers (outside Bangladesh, on Indian land, on screen)
    lurkMinBorderDist: 0.15, lurkMaxBorderDist: 2.2, // map units from the BD border
    lurkSpeedMul: 0.6,      // tier 3: × def.speed
    fastSpeedMul: 1.6,      // tier 2: × def.speed
    mainSpeed: 0.45,        // map units/s, Hasina (the fastest)
    turnTier3: [2, 4],      // s between new waypoints (random in range)
    turnTier2: [0.5, 1.2],
    turnMain: [0.35, 0.8],
    waypointMaxDist: 1.2,   // map units, next waypoint within this distance
    // population / levels
    levelEvery: 6,          // lockups per level
    unlockPerLevel: 1.5,    // classic waves per level (for `unlock` and pool weights)
    maxOnMapBase: 5, maxOnMapPerLevel: 1, maxOnMapCap: 14,
    firstSpawnDelay: 0.6,
    spawnEvery: 1.4, spawnSpeedup: 0.92, spawnEveryMin: 0.5, // s, × per level
    speedPerLevel: 0.05,
    // sneaking in
    sneakEvery: 9, sneakSpeedup: 0.88, sneakEveryMin: 3.5, // s, × per level
    sneakSpeed: 0.22, sneakSpeedPerLevel: 0.02,             // map units/s
    gotInRadius: 0.3,       // map units from Dhaka = got in
    lives: 3,
    // Hasina
    mainAfterLocked: 12,    // lockups before she can appear
    mainDelay: [4, 12],     // s random delay before she appears
    mainStay: 30,           // s on the map before she slips away
    mainCooldown: 20,       // s before she comes back
    mainPoints: 1000,
    winBonusPerLife: 500,
    powerups: ['freeze', 'wall', 'shield'],
  },
};
