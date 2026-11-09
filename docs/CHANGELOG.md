# Changelog / work log

Newest first. Every work session adds an entry: date, what changed, why, and anything
left unfinished. Keep entries short; details belong in commits and ARCHITECTURE.md.

## 2026-11-09 — v2 phase E: real roster (branch `v2`)
- 17 real characters replace the placeholders (Hasina; Quader, Nanok, Taposh, Samim Osman,
  Arafat; Siddique Nazmul, Zakir, Momotaz, Inan, Shohag, Saddam, Murad, Ferdous, Mahiya Mahi,
  Somrat, Riyaz) with behaviours, names and traits in both languages. Wave weights rescaled so
  the tier-2 share matches the old balance.
- Asset pipeline: conventional paths + generated `js/data/asset-manifest.js`
  (`tools/build-assets.mjs`); only existing files are requested.
- Full-body sprite rendering (feet-anchored, mirrored by walking direction); all sounds of the
  sound-design doc wired with synth fallbacks; menu/game/boss music support.
- Review fixes by Claude: duplicate `play` import broke the page (rename to `playSound`);
  sound list derived from the rosters; how-to roster re-renders when art loads; sound files
  no longer fetched twice. Tested with stand-in art + a generated sound file (removed again).
  SW `kto-v8`.

## 2026-11-09 — v2 phases C + D (branch `v2`)
- **Accurate map** (opencode, 2 rounds, reviewed): `tools/build-map.mjs` turns Natural Earth
  10m data into `js/data/map-bd.js`: 340-point mainland with I/M/C edge tags, 15 islands,
  clipped India / Myanmar / Nepal / Bhutan / China land. Real coastlines are drawn and spawns
  must be on Indian land. Review fix: hairline gaps between countries closed by stroking.
  Verified: cities inside/outside correctly, ~75% spawn-point success, reproducible output.
- **Hero select + kick and flee** (opencode, reviewed): pick Farmer / Student ♂ / Student ♀ /
  Common People; every hit shows the hero kicking; caught intruders run 300 px back to India
  and fade. Sweep shows all four heroes. Review fix: Sweep played one sound per intruder.
- agy could not complete unattended tasks (print mode stops at permission prompts); see
  CLAUDE.md "Team workflow". SW `kto-v7`.

## 2026-11-09 — v2 plan, prompt docs, config refactor (branch `v2`)
- New workflow: Claude reviews; opencode/agy write code (see CLAUDE.md "Team workflow").
- `docs/PLAN-v2.md` (approved), `docs/prompts/enemy-characters.md`,
  `docs/prompts/self-characters.md`, `docs/prompts/sound-design.md` (for Nano Banana / ElevenLabs).
- Phase B (opencode, reviewed): `js/config.js` holds every gameplay tunable; roster moved
  to `js/data/enemies.js` (`sprites: {walk, kicked, idle}`, `sound`); new
  `js/data/heroes.js`, `js/data/sounds.js`, `js/assets.js`; `audio.js` gains `play()` with
  file→synth fallback. `js/characters.js` removed. SW `kto-v5`.
- Verified: identical wave count/interval/speed/boss schedule for waves 1–20, full smoke
  test (spawn, catch, split, perk screen, quit-save), sprite load + missing-sound fallback,
  no console errors. No gameplay change intended.

## 2026-11-09 — Branch setup
- Pushed docs + gameplay pass 1, then created `main` from the same commit.
- Enabled GitHub Pages (source: GitHub Actions); user allowed `main` in the `github-pages`
  environment. First successful deploy (run 42612965148): https://mrashidbd.github.io/hasina-game/
  — checked live in headless Chromium at phone size: game starts, service worker active, no errors.

## 2026-11-05 — Gameplay pass 1
- **Spawn warnings**: each wave spawn is telegraphed 0.7 s ahead by a flashing marker
  (gold 👑 for Hasina) so spawns near the border are fair and readable.
- **Boss HP bar** under the HUD while Hasina is on the map.
- **Combo timer bar** in the HUD (time left to keep the combo).
- **New intruder `small5` (Splitter)**: splits into two `small1` when tapped (unlocks wave 5).
- **Upgrades between waves**: new `js/perks.js`; every 2nd cleared wave pick 1 of 3
  (tap radius, knockback, sweep charge, drop luck, combo window, longer freeze/wall,
  spare shield). New game mode `'perk'`, hook `onPerks`, `game.mods`. Game-over stats
  show the number of upgrades.
- Fixes: leak floater shows the points actually lost; map labels are translated;
  quitting from pause/game screens saves the high score; English breach reason no
  longer lower-cases the name; stats grid layout even with the extra row.
- `sw.js` VERSION → `kto-v4` (added `js/perks.js` to ASSETS).
- Tested in headless Chromium (CDP script): spawns, catching, boss bar, split, upgrade
  screen and pick, quit-saves-best, no console errors. Not yet tested on a real phone.

## 2026-11-05 — Local setup + agent docs
- Cloned the repo into the local project root (tracking `origin/claude/modest-bohr-vzpqz0`).
- Analysed the whole codebase. Added `CLAUDE.md` (agent guide + conventions),
  `AGENTS.md` (pointer), `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`, `docs/TODO.md`.
- No gameplay changes.

## 2026-11-05 — Earlier history (from git, before local setup)
- `b11eed9` Rework roster into three character tiers (main target / senior / small leaders, point penalties).
- `863febb` Bangla/English toggle, fairer spawns on narrow screens, first-catch hint.
- `3c696bf` Initial game: border-defense tap game with PWA support.
