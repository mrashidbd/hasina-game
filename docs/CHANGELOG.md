# Changelog / work log

Newest first. Every work session adds an entry: date, what changed, why, and anything
left unfinished. Keep entries short; details belong in commits and ARCHITECTURE.md.

## 2026-11-09 — Branch setup
- Pushed docs + gameplay pass 1, then created `main` from the same commit.
- Enabled GitHub Pages (source: GitHub Actions). The deploy from `main` is still rejected by
  the `github-pages` environment's branch rule (only the default branch is allowed); see TODO.

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
