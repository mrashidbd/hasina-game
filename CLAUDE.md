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
`__game.shield = 3`, `__game.wave = 11; __game.nextWave()`,
`__game.spawn('hasina')`, `__game.wave = 4; __game.waveCleared()` → upgrade screen).
`__game` is the game of the active mode; in Rope 'Em! mode try `__game.locked = 12`
(Hasina gets scheduled), `__game.startSneak()`, `__game.lives = 1`, `__game.mainT = 29`.
If the Chrome extension isn't available, a headless Chromium from the Playwright cache
(`~/.cache/ms-playwright/chromium_headless_shell-*`) driven over CDP with Node's built-in
`WebSocket` works for screenshots and `Runtime.evaluate` checks (no npm install needed).
Port 8080 is often already taken on the user's machine; use another (e.g. 8765).
Tip: when testing with a service worker active, hard-reload or use DevTools →
Application → "Update on reload", otherwise you may see the cached old version.

## File map
| File | Role |
|---|---|
| `index.html` | All screens (menu, how-to, pause, game over), HUD. Static text uses `data-i18n="key"` |
| `css/style.css` | Styling, responsive, safe-area insets |
| `js/main.js` | UI glue: screen switching, HUD updates, high score (`localStorage`), share, keyboard, PWA install, SW registration, renders how-to tables from data |
| `js/game.js` | `Game` class (classic mode): waves, spawning, movement, input, scoring, power-ups, rendering, main loop |
| `js/lasso.js` | `LassoGame extends Game`: the "Rope 'Em!" mode (lurkers outside BD, hero orbit + chase, rope, jail, sneak-ins, Hasina = win). Tunables `CONFIG.lasso`; design `docs/PLAN-lasso.md` |
| `js/config.js` | **`CONFIG`: every global tunable** (layout, spawn, waves, scoring, input, combat, power-ups, kick, sprites, audio, fun, lasso) with units |
| `js/data/enemies.js` | **Roster + per-character balance**: `TIERS`, `CHARACTERS` (stats, behaviours, `sprites`, `sound`), `POWERUPS`, `MAIN_ID`, `isMainWave` |
| `js/data/heroes.js` | `HEROES`: the 4 self characters (sprites/sound; gameplay use comes in plan phase D) |
| `js/data/sounds.js` | `SOUNDS`: sound id → optional `file` + `synth` fallback + volume |
| `js/assets.js` | `preloadImages(onLoad)`, `getSprite(def, pose)` (null → draw emoji); only loads manifest files |
| `js/data/asset-manifest.js` | **Generated** list of art/sound files present in `assets/` + `spritePaths()`. Run `node tools/build-assets.mjs` after adding files |
| `assets/` | Art (`enemies/<id>/`, `heroes/<id>/`), sounds (`sfx/enemies|heroes|game/`), music. Layout in `assets/README.md`, prompts in `docs/prompts/` |
| `tools/build-assets.mjs` | Scans `assets/`, writes the manifest, reports missing files per character |
| `tools/gen-art.mjs`, `tools/chroma-key.mjs`, `tools/art/` | **Automated art**: agy image-generator → `art-src/` (git-ignored) → green-screen removal in headless Chromium → `assets/`. See `tools/art/README.md` |
| `tools/cdp.mjs` | Headless-Chromium driver for smoke tests/screenshots: `SHOTS=<dir> node tools/cdp.mjs <script.mjs>` |
| `js/perks.js` | `BASE_MODS`: per-run modifiers copied to `game.mods` (the upgrade screen was removed 2026-11-12) |
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
   pixel/colour values are the exception). Per-run modifiers → `BASE_MODS` in
   `js/perks.js` (read via `game.mods.*`, never a constant). Wave formulas → `Game.nextWave()`.
4. **New character** = add entry in `CHARACTERS` + `char.<id>` and `trait.<id>` in both
   languages. The how-to roster table and wave mix pick it up automatically.
   Keep it simple: the user wants a fun game for all ages (2 power-ups, no upgrade screens).
5. **Assets**: paths are by convention (`assets/enemies/<id>/<pose>.png`,
   `assets/sfx/enemies/<id>.mp3`, …; see `docs/prompts/`). Drop files in, then run
   `node tools/build-assets.mjs`; only manifest-listed files are requested, everything else
   falls back to emoji / synth. The SW caches assets at runtime; new **JS** files must be
   added to `ASSETS` in `sw.js`.
6. **Test in a real browser module context.** `node --check` treats `.js` as a script and
   misses module errors (e.g. a duplicate import binding broke the whole page once). Use
   `node --input-type=module --check < file.js` and a headless-Chromium smoke test.
7. **Any shipped change → bump `VERSION` in `sw.js`** (e.g. `kto-v3` → `kto-v4`), or
   installed players keep the old cached build.
8. Keep README's rule/point tables in sync with the code when balance changes
   (README is what players/maintainers read; it currently matches the code).
9. Style: 2-space indent, single quotes, semicolons, small focused functions, short
   comments explaining *why*.

## Team workflow (since 2026-11-09)
The user's rule: **Claude is code inspector + project manager.** Bulk/initial coding is
delegated, then Claude reviews diffs in detail, runs tests, fixes small issues itself and
sends larger corrections back to the tools.
- **Default coder (user, 2026-11-10): GLM-5.3 via the user's Z.AI Coding Plan:**
  `opencode run -m zai-coding-plan/glm-5.3 --auto --title "<t>" "<brief>"`. (The
  `console-z-ai/glm-5.3` id fails with an auth error; `crouton-alpha-free` is gone.)
- **agy is used for image generation** (`node tools/gen-art.mjs`): its image-generator
  subagent needs no permission, and the script picks the file up from
  `~/.gemini/antigravity-cli/brain/<conversation>/`. The image quota is limited per day
  (2026-11-12: about 11 images, then `QUOTA_EXHAUSTED` with a reset time in
  `~/.gemini/antigravity-cli/cli.log`); rerun the script later and it skips what exists.
- `agy -p "<brief>" --model claude-opus-4-6-thinking --mode accept-edits`; when its limit
  is reached use `--model gemini-3.8-flash-high`. **Caveat (2026-11-09):** in print mode
  agy stops at its first permission prompt (even listing a folder), `--mode auto` isn't
  available on this account, and `--dangerously-skip-permissions` is blocked by Claude's
  safety rules. So agy currently can't finish file-writing tasks unattended; use opencode
  unless the user runs agy interactively. Also never let an agent open the 13 MB GeoJSON.
- Two agents can run in parallel only on disjoint files (say so in each brief).
- Briefs: precise file list, exact values, "don't" list (no docs edits, no commits, no
  deps), and "done when" checks. Keep briefs in the session scratchpad, not the repo.
- Current roadmap: `docs/PLAN-v2.md` (done except phase F) and `docs/PLAN-lasso.md`
  (Rope 'Em! mode, branch `lasso`). Art/sound prompts for the user: `docs/prompts/`.

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
- Branches: `main` (live; pushes deploy via the Pages workflow), `v2` (v2 work branch,
  merged into `main` 2026-11-09), `lasso` (Rope 'Em! mode, from `v2`, 2026-11-10; not live
  yet) and `claude/modest-bohr-vzpqz0` (original branch, stale).
  The GitHub *default* branch is still `claude/modest-bohr-vzpqz0`.
- **Live site: https://mrashidbd.github.io/hasina-game/** — every push to `main` deploys
  (GitHub Pages, source: GitHub Actions; the `github-pages` environment allows `main` only).
  Work on a branch and merge to `main` when the user wants it live.
- Push as the `mrashidbd` GitHub account (`gh auth switch`); the other local account
  `zuviarbd` has no write access.
- Content note: this is a political satire / fan game. Character names other than the
  tier-1 target are intentional placeholders; the user will decide the real roster.
