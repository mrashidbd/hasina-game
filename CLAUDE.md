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
`__game.sweep = 100`, `__game.shield = 3`, `__game.wave = 11; __game.nextWave()`).
Tip: when testing with a service worker active, hard-reload or use DevTools →
Application → "Update on reload", otherwise you may see the cached old version.

## File map
| File | Role |
|---|---|
| `index.html` | All screens (menu, how-to, pause, game over), HUD, sweep button. Static text uses `data-i18n="key"` |
| `css/style.css` | Styling, responsive, safe-area insets |
| `js/main.js` | UI glue: screen switching, HUD updates, high score (`localStorage`), share, keyboard, PWA install, SW registration, renders how-to tables from data |
| `js/game.js` | `Game` class: waves, spawning, movement, input, scoring, power-ups, rendering, main loop |
| `js/characters.js` | **Roster + balance data**: `TIERS`, `CHARACTERS`, `POWERUPS`, `MAIN_ID`, `isMainWave` |
| `js/map.js` | Bangladesh outline (lon/lat, edges tagged India/Myanmar/Coast), projection, sea/Myanmar polygons, geometry helpers |
| `js/i18n.js` | `en` / `bn` strings, `t(key, vars)`, `fmt(n)` (Bangla digits), language detection |
| `js/audio.js` | `sfx.*` sound effects, mute state |
| `sw.js` | Service worker; `VERSION` + `ASSETS` list |

## Conventions & rules (follow these)
1. **Keep it build-free.** Don't introduce bundlers, frameworks or npm deps unless the
   user explicitly asks. All paths stay relative (site runs under `/hasina-game/`).
2. **Every user-visible string goes in `js/i18n.js` in BOTH `en` and `bn`.** Use
   `t('key')` in JS or `data-i18n="key"` in HTML. Numbers shown to players go through
   `fmt()` (or pass numbers as `t()` vars, which are auto-formatted).
3. **Balance lives in data, not code.** Character stats → `js/characters.js`. Global
   tuning constants → top of `js/game.js`. Wave formulas → `Game.nextWave()`.
4. **New character** = add entry in `CHARACTERS` + `char.<id>` and `trait.<id>` in both
   languages. The how-to roster table and wave mix pick it up automatically.
5. **New asset file** (sprite, sound, etc.) → add it to `ASSETS` in `sw.js`.
6. **Any shipped change → bump `VERSION` in `sw.js`** (e.g. `kto-v3` → `kto-v4`), or
   installed players keep the old cached build.
7. Keep README's rule/point tables in sync with the code when balance changes
   (README is what players/maintainers read; it currently matches the code).
8. Style: 2-space indent, single quotes, semicolons, small focused functions, short
   comments explaining *why*.

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
- As of 2026-11-05 the only remote branch is `claude/modest-bohr-vzpqz0`; **there is no
  `main` branch yet**, so the Pages workflow (which triggers on `main`) has never run.
  Ask the user before creating/pushing `main`.
- Content note: this is a political satire / fan game. Character names other than the
  tier-1 target are intentional placeholders; the user will decide the real roster.
