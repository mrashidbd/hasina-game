# Architecture

How the game is put together, for anyone changing the code. Rules and point values
as the player sees them are in `README.md`; this file is about the *implementation*.
Line references are approximate — search for the function name.

## Module graph

```
index.html ──loads──> js/main.js (UI glue)
                         ├── js/game.js (engine: Game class)
                         │      ├── js/map.js        (geometry + map data)
                         │      ├── js/characters.js (roster/balance data)
                         │      ├── js/perks.js      (upgrades + BASE_MODS)
                         │      ├── js/audio.js      (sfx)
                         │      └── js/i18n.js       (t, fmt)
                         ├── js/characters.js (to build how-to tables)
                         ├── js/perks.js      (emoji/max for the upgrade screen)
                         ├── js/audio.js      (unlock, mute)
                         └── js/i18n.js       (language switch)
sw.js  — registered by main.js on load (not on file://)
```

`game.js` never touches the DOM except its canvas. It talks to the UI only through
three **hooks** passed to the constructor by `main.js`:

| Hook | Called | Used for |
|---|---|---|
| `onHud(game)` | every frame | score, wave, combo, shields, sweep meter (main.js caches last values to avoid DOM churn) |
| `onBanner(title, sub)` | wave start / wave clear | big centered banner text |
| `onGameOver(summary)` | 1.1 s after a tier-1 breach | game-over screen, high score save |
| `onPerks(ids)` | after the break following every `PERK_EVERY`-th wave | shows the upgrade screen; main.js calls `game.choosePerk(id)` |

## Game modes
`Game.mode` is one of `'menu' | 'playing' | 'paused' | 'perk' | 'over'`
(`'perk'` = simulation stopped while the upgrade screen is open).
- The render loop (`loop` → `update` → `render` → `onHud`) **always runs**, including
  on the menu (the map is the menu background).
- `update()` animates particles/floaters in every mode but only simulates when
  `mode === 'playing'`.
- `main.js` owns screen visibility (`show(id)`, `id = null` means in-game).
  Pause is triggered by button, `P`/`Esc`, or `visibilitychange`.

## Coordinate system
- Map data is lon/lat; `proj(lon, lat)` (map.js) is an equirectangular projection to
  **map units**: `x = (lon − 88) · cos 24°`, `y = 26.8 − lat` (y grows down).
  **1 map unit ≈ 100 km.** All gameplay distances/speeds/radii are in map units.
- `Game.resize()` fits the Bangladesh bounding box plus `PAD` (0.7 units of India) into
  the window between HUD insets (`insets.top = 64`, `insets.bottom = 90` px), giving
  scale `s` and offsets `ox, oy`. Convert with `sx(x)`, `sy(y)`; `rpx(r)` converts a
  radius with a 15 px minimum so things stay tappable on phones.
- `this.view` is the visible rectangle in map units, used to clamp spawns on screen.
- Particles and floaters are stored in **screen pixels**, enemies/power-ups in map units.

## Map data (`js/map.js`)
- `RAW`: ~45 vertices clockwise from the northern tip, each tagged with the type of the
  edge that starts there: `I` India, `M` Myanmar, `C` coast.
- Exports: `BD` (projected polygon), `INDIA_EDGES` (`{a, b, len}`), `INDIA_LEN`,
  `SEA` and `MYANMAR` polygons (for drawing and to reject spawns), `DHAKA`, `LABELS`,
  `BBOX`, `pointInPoly`, `distToPoly`.
- Paths are rebuilt as `Path2D` in `buildPaths()` on every resize.

## Wave lifecycle (`game.js`)
1. `start()` → `reset()` → `nextWave()`.
2. `nextWave()` builds `this.queue` of character IDs:
   - `count = 5 + floor(1.8·n)`
   - pool = all tier>1 characters with `unlock ≤ n`, weights: `small1` = 10, other
     tier 3 = `2 + 0.6n`, tier 2 = `1 + 0.35n` (`weighted()` picks).
   - If `isMainWave(n)` (every 3rd, every 2nd from 12), `MAIN_ID` is inserted mid-queue.
   - `spawnInterval = max(0.3, 1.5·0.92^(n−1))`, `speedMul = min(2.1, 1 + 0.07(n−1))`.
3. `update()` pops the queue every `spawnInterval·rand(0.7,1.3)`; from wave 6 a 20%
   chance of a second pop in the same tick. A pop calls `warn(type)`, which picks the
   spawn point immediately and stores `{type, p, t: WARN_TIME}` in `this.warnings`
   (drawn by `drawWarning`); after 0.7 s it becomes `spawn(type, p, true)`.
4. When the queue is empty **and** no enemies **and** no pending warnings remain →
   `waveCleared()` adds bonuses and sets `breakT = 2.4` s; when it runs out →
   `afterBreak()`: on every `PERK_EVERY` (2nd) wave it sets `mode = 'perk'` and calls
   `onPerks(perkOptions(game, 3))`; `choosePerk(id)` applies it and calls `nextWave()`.
   Otherwise `nextWave()` directly.

## Spawning
- `spawnPoint()`: pick a random point along `INDIA_EDGES` (length-weighted), push it
  outward along the edge normal by `SPAWN_MIN..SPAWN_MAX` (0.5–0.8 units), clamp to
  the visible view, reject if inside BD / sea / Myanmar or < 0.3 from the border.
  40 tries, else `null` (spawn skipped). Returns spawn `x,y` and border target `tx,ty`
  (slightly inside the border).
- `spawn(type, at?, primary = !at)`: creates the enemy object. If `primary`, speed is
  scaled by a **fairness factor** `clamp(dist/SPAWN_NOMINAL, 0.5, 1)` so clamped spawns
  on narrow phones aren't unfairly close. Tier 1 gets `+5 HP × mainCount`.
  `def.group > 1` spawns extra pack members around the first (primary spawns only).
  Wave spawns are primary (via warnings); summons and splits are not.
- Summoners (`def.summons = { every, types }`) spawn helpers near themselves with an
  `at` point; interval shrinks `0.05 s` per wave, min 1.8 s.
- Splitters (`def.splits = { into, n }`): `catch()` → `split(e)` spawns `n` of `into`
  side by side, 0.1 units further from the border. Not triggered by Sweep.

### Enemy object
```js
{ type, def, x, y, tx, ty, phase /*0 = to border, 1 = to Dhaka*/,
  hp, maxHp, r, speed, t, seed, hitFlash, summonT, home: {x, y}, near /*dist to border*/ }
```
Movement: head to `(tx,ty)`; within 0.03 switch `phase = 1` and head to `DHAKA`.
`wobble` adds a sinusoidal sideways component. A breach is detected by
`pointInPoly(BD, x, y)` every frame → `breach(e)`.

## Input & scoring
- `onPointer` (pointerdown on canvas): power-ups first (30 px radius, doesn't count as
  a tap), else nearest enemy within `max(rpx(r)·1.25, 26)` px. Miss → combo reset,
  ripple. Hit → `damage(e, 1)`.
- `damage()`: if HP remains → knockback 0.035 units away from the border target;
  `dash` characters also jump 0.16 sideways (flipped if that lands inside BD).
  HP ≤ 0 → `catch()`.
- `catch()`: combo (`COMBO_WINDOW` 1.5 s), `multiplier() = min(5, 1 + floor((combo−1)/5))`,
  points × mult (sweep: 50%, no mult, no close-call, no sweep gain, no power-up drop),
  close call `+25` if `distToPoly < CLOSE_CALL (0.12)`, sweep meter `+def.sweepGain`,
  power-up drop chance `POWERUP_CHANCE + mods.dropBonus` (100% for tier 1).
- `comboLeft()` (0..1) drives the HUD combo timer bar.
- `useSweep()`: needs `sweep ≥ 100`; deals 99 damage to everyone, 4 to tier 1.
- `breach()`: tier 2/3 → remove, subtract `penaltyOf(def)` (floored at score 0), combo
  reset. Tier 1 → if `shield > 0`, consume one and teleport her to `home`; else
  `mode = 'over'` and call `onGameOver` after 1.1 s.
- Stats: `this.stats` (whole run) and `this.waveStats` (for per-wave accuracy/leak bonuses).
  `summary()` builds the object passed to `onGameOver`.

## Perks / run modifiers (`js/perks.js`)
`game.mods` is reset to `BASE_MODS` each run; gameplay code reads these instead of
constants: `tapRadius` (× hit radius), `knockback` (× 0.035 push), `sweepGain`
(× def.sweepGain), `dropBonus` (+ drop chance), `comboWindow` (s), `freezeTime`,
`wallTime` (s). `game.perks` counts picks per id (for `max` and the `n/max` label).
`perkOptions()` shuffles the perks that are under `max` and pass `available(game)`.

## Power-ups
`POWERUPS` in characters.js holds emoji/colour only; effects are hard-coded in
`Game.collect()`: freeze → `freezeT = mods.freezeTime` (4), wall → `wallT = mods.wallTime` (7; speed × 0.4), shield →
`+1` up to `MAX_SHIELD` (3; not dropped when full), charge → sweep `+40`. Power-ups
live 6 s and blink in the last 1.5 s. Adding a power-up = entry in `POWERUPS` + branch
in `collect()` + `pu.*`, `puName.*`, `puDesc.*` strings.

## Rendering order (`render()`)
India background → Myanmar → sea gradient → labels → Bangladesh fill + red flag disc
(clipped) → border outline (India border glows mint / pulses red when any enemy is
within `DANGER`, orange & thick while wall is active) → Dhaka dot + label → power-ups →
spawn warnings (`drawWarning`) → enemies (`drawEnemy`: danger ring, tier-1 gold aura, shadow, body/sprite/emoji, frozen
tint, HP bar if maxHp>1, name tag for tier ≤ 2) → first-catch "TAP!" hint → breach
marker → particles → floaters → full-screen overlays (freeze tint, sweep flash, leak
flash, `drawBossBar` (gold HP bar under the HUD while tier 1 is alive), red vignette
when tier 1 is near the border). Screen shake translates the
whole frame. DPR is capped at 2.

Map labels come from `LABELS[].key` → `t('map.<key>')`, so they follow the language.

## Persistence (`localStorage` keys)
| Key | Value |
|---|---|
| `kto-best` | `{ score, wave }` |
| `kto-lang` | `'en'` / `'bn'` (default: Bangla if `navigator.language` starts with `bn`) |
| `kto-muted` | `'1'` / `'0'` |

All access is wrapped in try/catch (private mode safe).

## i18n
`t('a.b', {var})` walks nested keys in the current language, falls back to `en`, then
to the key. Values can be arrays (e.g. `rules`). Numeric vars are formatted with `fmt`,
which converts digits to Bangla in `bn`. `applyLang()` in main.js re-renders every
`[data-i18n]` element (via `innerHTML`, so strings may contain markup) plus the
generated how-to tables and game-over stats.

## PWA
- `sw.js`: precaches `ASSETS` on install under cache name `VERSION`, deletes other
  caches on activate, serves same-origin GETs stale-while-revalidate.
- Manifest: fullscreen, any orientation, icons in `icons/`.
- `main.js` shows an "Install app" button on `beforeinstallprompt`, and an iOS
  "Add to Home Screen" hint on iOS Safari when not standalone.
