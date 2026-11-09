# Agent guide — Keep Them Out! (`hasina-game`)

Start here if you are an AI agent (or a new developer) picking up this project.
Read this file fully, then `docs/ARCHITECTURE.md` before changing engine code.

## What this is
A satirical, bilingual (English / Bangla) **tap-defense browser game**, shipped as a
static PWA. A simplified map of Bangladesh is in the centre of the screen; intruders
spawn on the India side of the border and walk toward Dhaka. The player taps them
before they cross. The tier-1 character (Hasina) getting in ends the game; tier 2/3
characters getting in cost points.

- Player-facing overview, game rules, point tables: `README.md`
- Engine internals, data flow, coordinate system, tuning knobs: `docs/ARCHITECTURE.md`
- Running log of what changed and why: `docs/CHANGELOG.md`
- Known issues and open ideas: `docs/TODO.md`

## Tech stack (deliberately tiny)
- Vanilla JS ES modules, HTML, CSS. **No build step, no dependencies, no npm.**
- Rendering: a single full-screen `<canvas>` with 2D context. UI screens are HTML overlays.
- Audio: synthesized with WebAudio (`js/audio.js`), no audio files.
- Offline/installable: `sw.js` (stale-while-revalidate cache) + `manifest.webmanifest`.
- Hosting: GitHub Pages via `.github/workflows/pages.yml` (deploys on push to `main`).

## Run / check
```bash
python3 -m http.server 8080      # then open http://localhost:8080
```
ES modules and the service worker do not work over `file://`.
There is no test suite. Quick syntax check of every module:
```bash
for f in js/*.js sw.js; do node --check "$f"; done
```
In the browser console, `window.__game` is the live `Game` instance (e.g.
`__game.sweep = 100`, `__game.shield = 3`, `__game.wave = 11; __game.nextWave()`,
`__game.spawn('hasina')`, `__game.wave = 4; __game.waveCleared()` → upgrade screen).
If the Chrome extension isn't available, a headless Chromium from the Playwright cache
(`~/.cache/ms-playwright/chromium_headless_shell-*`) driven over CDP with Node's built-in
`WebSocket` works for screenshots and `Runtime.evaluate` checks (no npm install needed).
Port 8080 is often already taken on the user's machine; use another (e.g. 8765).
Tip: when testing with a service worker active, hard-reload or use DevTools →
Application → "Update on reload", otherwise you may see the cached old version.

## File map
| File | Role |
|---|---|
| `index.html` | All screens (menu, how-to, pause, game over), HUD, sweep button. Static text uses `data-i18n="key"` |
| `css/style.css` | Styling, responsive, safe-area insets |
| `js/main.js` | UI glue: screen switching, HUD updates, high score (`localStorage`), share, keyboard, PWA install, SW registration, renders how-to tables from data |
| `js/game.js` | `Game` class: waves, spawning, movement, input, scoring, power-ups, rendering, main loop |
| `js/config.js` | **`CONFIG`: every global tunable** (layout, spawn, waves, scoring, input, combat, power-ups, perks, kick) with units |
| `js/data/enemies.js` | **Roster + per-character balance**: `TIERS`, `CHARACTERS` (stats, behaviours, `sprites`, `sound`), `POWERUPS`, `MAIN_ID`, `isMainWave` |
| `js/data/heroes.js` | `HEROES`: the 4 self characters (sprites/sound; gameplay use comes in plan phase D) |
| `js/data/sounds.js` | `SOUNDS`: sound id → optional `file` + `synth` fallback + volume |
| `js/assets.js` | `preloadImages()`, `getSprite(def, pose)` (null → draw emoji) |
| `js/perks.js` | Between-wave upgrades: `BASE_MODS` (per-run modifiers), `PERKS`, `perkOptions()` |
| `js/map.js` | Projection, projected map shapes (`BD`, `INDIA_EDGES`, neighbours, islands), labels, geometry helpers. Built from `js/data/map-bd.js` |
| `js/data/map-bd.js` | **Generated** map data (Natural Earth 10m). Don't edit; run `tools/build-map.mjs` |
| `tools/build-map.mjs` | Node script: Natural Earth GeoJSON → `js/data/map-bd.js` (+ optional preview SVG). See `tools/README.md` |
| `js/i18n.js` | `en` / `bn` strings, `t(key, vars)`, `fmt(n)` (Bangla digits), language detection |
| `js/audio.js` | `sfx.*` sound effects, mute state |
| `sw.js` | Service worker; `VERSION` + `ASSETS` list |

## Conventions & rules (follow these)
1. **Keep it build-free.** Don't introduce bundlers, frameworks or npm deps unless the
   user explicitly asks. All paths stay relative (site runs under `/hasina-game/`).
2. **Every user-visible string goes in `js/i18n.js` in BOTH `en` and `bn`.** Use
   `t('key')` in JS or `data-i18n="key"` in HTML. Numbers shown to players go through
   `fmt()` (or pass numbers as `t()` vars, which are auto-formatted).
3. **Balance lives in data, not code.** Character stats → `js/data/enemies.js`. Global
   tunables → `CONFIG` in `js/config.js` (never add magic numbers to `game.js`; rendering-only
   pixel/colour values are the exception). Values a perk can change → `BASE_MODS` in
   `js/perks.js` (read via `game.mods.*`, never a constant). Wave formulas → `Game.nextWave()`.
4. **New character** = add entry in `CHARACTERS` + `char.<id>` and `trait.<id>` in both
   languages. The how-to roster table and wave mix pick it up automatically.
   **New perk** = entry in `PERKS` + `perkName.<id>` / `perkDesc.<id>` in both languages.
5. **Assets**: set the path in data (`sprites.<pose>` in `js/data/*.js`, `file` in
   `js/data/sounds.js`). Null/missing files fall back to emoji / synth, never throw.
   Art goes in `assets/enemies/<id>/`, `assets/heroes/<id>/`, sounds in `assets/sfx/…`
   (names per `docs/prompts/`). The SW caches them at runtime; new **JS** files must be
   added to `ASSETS` in `sw.js`.
6. **Any shipped change → bump `VERSION` in `sw.js`** (e.g. `kto-v3` → `kto-v4`), or
   installed players keep the old cached build.
7. Keep README's rule/point tables in sync with the code when balance changes
   (README is what players/maintainers read; it currently matches the code).
8. Style: 2-space indent, single quotes, semicolons, small focused functions, short
   comments explaining *why*.

## Team workflow (since 2026-11-09)
The user's rule: **Claude is code inspector + project manager.** Bulk/initial coding is
delegated, then Claude reviews diffs in detail, runs tests, fixes small issues itself and
sends larger corrections back to the tools.
- `opencode run -m opencode/crouton-alpha-free --auto "<brief>"` (unlimited; default choice)
- `agy -p "<brief>" --model claude-opus-4-6-thinking --mode accept-edits`; when its limit
  is reached use `--model gemini-3.8-flash-high`. **Caveat (2026-11-09):** in print mode
  agy stops at its first permission prompt (even listing a folder), `--mode auto` isn't
  available on this account, and `--dangerously-skip-permissions` is blocked by Claude's
  safety rules. So agy currently can't finish file-writing tasks unattended; use opencode
  unless the user runs agy interactively. Also never let an agent open the 13 MB GeoJSON.
- Two agents can run in parallel only on disjoint files (say so in each brief).
- Briefs: precise file list, exact values, "don't" list (no docs edits, no commits, no
  deps), and "done when" checks. Keep briefs in the session scratchpad, not the repo.
- Current roadmap: `docs/PLAN-v2.md`. Art/sound prompts for the user: `docs/prompts/`.

## Documentation upkeep (mandatory)
These docs exist so the next agent can pick up context fast. When you change the
project, update the docs **in the same change**:
- Behaviour/balance/rules changed → `README.md` tables + `docs/ARCHITECTURE.md` section.
- Architecture, new module, new state field, new hook → `docs/ARCHITECTURE.md` and the
  file map above.
- Every session of work → add a dated entry at the top of `docs/CHANGELOG.md`
  (what changed, why, anything left unfinished).
- Found a bug you didn't fix, or finished a TODO → update `docs/TODO.md`.

## Repo / git state
- Remote: `https://github.com/mrashidbd/hasina-game.git`
- Branches: `main` (created 2026-11-09; pushes deploy via the Pages workflow) and
  `claude/modest-bohr-vzpqz0` (original working branch, same commits as of 2026-11-09).
  The GitHub *default* branch is still `claude/modest-bohr-vzpqz0`.
- **Live site: https://mrashidbd.github.io/hasina-game/** — every push to `main` deploys
  (GitHub Pages, source: GitHub Actions; the `github-pages` environment allows `main` only).
  Work on a branch and merge to `main` when the user wants it live.
- Push as the `mrashidbd` GitHub account (`gh auth switch`); the other local account
  `zuviarbd` has no write access.
- Content note: this is a political satire / fan game. Character names other than the
  tier-1 target are intentional placeholders; the user will decide the real roster.
