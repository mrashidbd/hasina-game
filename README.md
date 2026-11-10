# Keep Them Out! 🛡️🇧🇩

A browser game for desktop and mobile, installable as a PWA. Bangladesh sits in the
middle of the screen, and intruders try to get in across the border from India. Tap them before they
cross. If even one gets in, the game is over.

> All characters are placeholder ("dummy") art for now. See [Swapping in real characters](#swapping-in-real-characters).

## Run locally

It's a plain static site with no build step. Serve the folder with any static server
(ES modules and the service worker don't work over `file://`):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. To test on your phone, open `http://<your-computer-ip>:8080`
on the same Wi-Fi (the PWA install prompt needs HTTPS, so use the deployed version for that).

## Deploy (GitHub Pages)

`.github/workflows/pages.yml` publishes the site on every push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**.
All paths are relative, so the site also works under `https://<user>.github.io/hasina-game/`.
It can be hosted on any static host too (Netlify, Vercel, Cloudflare Pages).

When you ship changes, bump `VERSION` in `sw.js` so installed players get the update.

## Project layout

| File | What it does |
|---|---|
| `index.html` | Screens (menu, how-to, pause, game over) and the HUD |
| `css/style.css` | UI styling, responsive, safe-area aware (notches) |
| `js/map.js` | Map shapes (Bangladesh, borders tagged India / Myanmar / coast, neighbours, islands), projection, geometry helpers |
| `js/data/map-bd.js` / `tools/build-map.mjs` | Generated map data from Natural Earth (public domain) and the script that builds it |
| `js/config.js` | **All global tunables** (`CONFIG`): waves, spawns, scoring, power-ups, kick… |
| `js/data/enemies.js` | **Roster and balance**: tiers, penalties, emoji, sprites, HP, speed, points, behaviours; power-ups |
| `js/data/heroes.js` / `js/data/sounds.js` | Self characters; sound catalogue (files with synth fallback) |
| `js/assets.js` | Sprite loading with emoji fallback |
| `js/perks.js` | Between-wave upgrades and the per-run modifiers they change |
| `js/game.js` | Game engine: waves, spawning, movement, input, scoring, rendering |
| `js/audio.js` | Synthesized sound effects (WebAudio, no files) |
| `js/i18n.js` | English and Bangla text (language toggle on the menu; Bangla is picked automatically on Bangla devices) |
| `js/main.js` | UI wiring, high score (localStorage), share, install prompt, SW registration |
| `sw.js` / `manifest.webmanifest` / `icons/` | PWA: offline cache, install metadata, icons |
| `CLAUDE.md` / `AGENTS.md` / `docs/` | Developer & AI-agent docs: conventions, architecture, changelog, TODO |

---

# Game design

## Core loop
1. A wave starts and intruders spawn **outside the India-facing border**: west, north and east.
   They don't come from the sea or the Myanmar side. Each spawn is telegraphed by a flashing
   **!** marker 0.7 s before the intruder appears (a gold 👑 for Hasina).
2. Each one walks to a point on the border and then heads for Dhaka.
3. Before the run the player picks a **hero** (Farmer, Student ♂, Student ♀, Common People).
   The player **taps or clicks** intruders; the hero pops up and kicks them, and caught
   intruders run back towards India and fade away. Tough ones take several kicks, and each kick knocks them back a little.
4. What happens when someone gets in depends on their **tier** (below). Only Hasina ends the game.
5. When a wave is cleared there's a bonus and a short break, then the next, harder wave starts.
   After every 2nd wave the player first **picks one of three upgrades** (see below).
6. While Hasina is on the map, a gold HP bar under the HUD shows how much she has left.

## Character tiers

Everything is configured in `js/data/enemies.js` (global numbers in `js/config.js`). Names, in
English and Bangla, are in `js/i18n.js` under `char`. Art and sound prompts per character are in
`docs/prompts/`. Until art exists each character is an emoji on a coloured circle.

| Tier | Who | If they get in |
|---|---|---|
| **1. Main target** | Hasina | **Game over.** A 🛡️ shield, if you have one, throws her back to where she started instead |
| **2. Senior leaders** | 5 characters | **−200 points** (score never drops below 0) |
| **3. Small leaders** | 11 characters | **−50 points** |

| ID | Name | Tier | Kicks | Points | From wave | Behaviour |
|---|---|---|---|---|---|---|
| `hasina` | Hasina | 1 | 15 (+5 each time she returns) | 500 | every 3rd wave, every 2nd from wave 12 | Slow, gold aura, calls in helpers, always drops a power-up |
| `nanok` | Nanok | 2 | 3 | 50 | 2 | Heavy |
| `taposh` | Taposh | 2 | 2 | 60 | 4 | Jumps sideways when kicked |
| `quader` | Obaidul Quader | 2 | 4 | 80 | 5 | Keeps calling in small leaders |
| `arafat` | Arafat | 2 | 2 | 70 | 6 | Flickers in and out of view |
| `shamim` | Samim Osman | 2 | 7 | 120 | 7 | Very tough, very slow |
| `nazmul` | Siddique Nazmul | 3 | 1 | 10 | 1 | Basic |
| `zakir` | Zakir | 3 | 1 | 10 | 1 | Basic |
| `momotaz` | Momotaz | 3 | 1 | 12 | 2 | Basic |
| `inan` | Inan | 3 | 1 | 20 | 2 | Fast, zig-zags |
| `shohag` | Shohag | 3 | 1 | 20 | 3 | Fast, zig-zags |
| `saddam` | Saddam | 3 | 1 | 8 | 3 | Comes in packs of 3 |
| `murad` | Murad | 3 | 1 | 22 | 4 | Fastest, zig-zags |
| `ferdous` | Ferdous | 3 | 1 | 25 | 4 | Fades in and out of view |
| `mahi` | Mahiya Mahi | 3 | 1 | 25 | 5 | Fades in and out of view |
| `somrat` | Somrat | 3 | 1 | 15 | 5 | Splits into two basic leaders when kicked (not when swept) |
| `riyaz` | Riyaz | 3 | 1 | 15 | 6 | Splits into two basic leaders when kicked (not when swept) |

To add a character, copy an entry in `CHARACTERS`, give it a new ID, and add its name and trait
to both languages in `i18n.js`. It joins the wave mix from its `unlock` wave and automatically
gets art/sound slots (`assets/enemies/<id>/…`, `assets/sfx/enemies/<id>.mp3`).

## Point system

| Source | Points |
|---|---|
| Catch | Base points × **combo multiplier** |
| Combo | Catches less than 1.5 s apart build a combo. Multiplier = 1 + ⌊(combo−1)/5⌋, up to **×5**. A missed tap or a leak resets it |
| Close call | **+25** for catching an intruder within ~12 km of the border |
| Wave clear | **+50 × wave number** |
| Sharpshooter | **+25 × wave number** if accuracy in that wave is ≥ 90% |
| Sealed border | **+30 × wave number** if nobody got in during that wave |
| Sweep catches | **50%** of base points, with no multiplier |
| Senior leader gets in | **−200** (never more than your current score) |
| Small leader gets in | **−50** |

High score and best wave are saved on the device (also when you quit a run from the pause menu). The game-over screen shows how many got in
and how many points that cost.

## Difficulty curve
- Intruders per wave: `5 + 1.8 × wave`
- Spawn interval: `1.5 s × 0.92^(wave−1)`, minimum 0.3 s. From wave 6 there's a 20% chance of a double spawn.
- Speed multiplier: `1 + 0.07 × (wave−1)`, capped at ×2.1
- Wave mix: the basic leaders are the backbone (fixed weights: Nazmul 4, Zakir 4, Momotaz 2). Every other small leader has weight `1 + 0.3 × wave`, every senior leader `0.8 + 0.28 × wave` (`CONFIG.waves`).
- Hasina appears every 3rd wave (every 2nd from wave 12) with 5 more HP each time.

## Rope 'Em! mode 🪢
A second mode, picked on the menu (code: `js/lasso.js`, numbers: `CONFIG.lasso`, design:
`docs/PLAN-lasso.md`). It uses the same characters, heroes, art and sounds.

- The crooks **lurk outside Bangladesh** on Indian land. Tier 2 and Hasina move fast and
  erratically.
- Your hero **circles the jail at Dhaka**; ⇄ (or <kbd>R</kbd>) reverses the direction.
- **Tap a crook (or a spot)**:
  - within reach (3 map units ≈ 300 km, the faint ring) the rope flies at once and homes in
    on the crook;
  - out of reach, the hero runs over until it is in reach, throws, then goes back to
    circling.
- Stealthy crooks can't be roped while faded, and Taposh may hop out of the loop.
- 1-kick crooks are pulled in at once. Tougher ones fill a **tug meter** while you tap fast;
  if it empties, the rope snaps.
- Caught crooks are **flung into the jail**. Every 6 lockups is a level-up: more crooks,
  faster crooks, more sneaking.
- Every few seconds one crook **sneaks in** and runs for Dhaka. 3 that get in = game over
  (a 🛡️ shield blocks one).
- **Hasina** appears after 12 lockups. She is the fastest and pulls hardest, and slips away
  after 30 s if not caught (then comes back). **Locking her up wins the game.**

| Source | Points |
|---|---|
| Lockup | Base points × combo multiplier (Hasina 1000 × multiplier) |
| Win | **+500** per ❤️ left |
| A crook gets in | −1 ❤️ (no points lost) |

Power-ups: ❄️ Freeze (also stops sneakers), 🧱 Border Wall (slows everyone), 🛡️ Shield. This
mode has no Charge, no Sweep and no upgrades.

## Power-ups
Any catch has a 7% chance to drop one, and Hasina always drops one. Tap a power-up to collect it.
It disappears after 6 s.

| | Effect |
|---|---|
| ❄️ Freeze | All intruders stop for 4 s |
| 🧱 Border Wall | Intruders move at 40% speed for 7 s |
| 🛡️ Shield | Throws Hasina back once (stack up to 3) |
| ⚡ Charge | +40 to the Sweep meter |

## Upgrades (between waves)
After clearing every 2nd wave the game pauses and offers **3 random upgrades**; pick one and it
lasts for the rest of the run. Defined in `js/perks.js`.

| | Upgrade | Effect | Max |
|---|---|---|---|
| 🎯 | Long Arms | Tap radius +25% | 2 |
| 💪 | Strong Push | Tough intruders pushed back twice as far per hit | 2 |
| 🔋 | Quick Charge | Sweep meter fills 30% faster | 3 |
| 🍀 | Lucky Finds | Power-up drop chance +4% | 3 |
| ⏱️ | Rhythm | Combo window +0.5 s | 2 |
| 🧊 | Cold Storage | Freeze +2 s, Border Wall +3 s | 2 |
| 🛡️ | Spare Shield | +1 shield now (only offered below 3 shields) | — |

The HUD shows a small yellow bar under the combo counter: the time left to keep the combo going.

**⚡ Sweep** (button, or <kbd>Space</kbd>): fills as you catch intruders. When it's full, it catches
everyone on screen at once. Hasina only takes 4 damage.

## Controls
- Mobile: tap
- Desktop: click. <kbd>Space</kbd> sweeps, <kbd>P</kbd>/<kbd>Esc</kbd> pauses, <kbd>Enter</kbd> starts.
- The game pauses automatically when the app goes to the background.

## Swapping in real characters
Art and sound prompts are in `docs/prompts/`. Put the generated files in `assets/` using exactly
the names listed there (see `assets/README.md`), then run:

```bash
node tools/build-assets.mjs
```

It updates `js/data/asset-manifest.js` (the game only loads files listed there, so missing files
never cause errors) and prints which files are still missing. Art is drawn full-body, facing
the way the character walks. Until a file exists the game draws the emoji and plays the
built-in synth sound. Names live in `js/i18n.js` (`char.*`, `hero.*`). The service worker caches
assets automatically after first load.

## Roadmap / ideas
- [ ] Real names and art for the tier 2 and tier 3 characters
- [ ] A proper art pass on the flag and border
- [ ] Background music and Bangla voice lines ("Dhoro!", "Palao!")
- [ ] More accurate border outline (GeoJSON simplified with mapshaper)
- [ ] Online leaderboard (e.g. Supabase or Firebase) and a daily challenge seed
- [x] Splitter intruder (`small5`)
- [ ] More intruder types: a decoy that costs points if you tap it, one that tunnels underground
- [x] Upgrades between waves (pick 1 of 3 every 2 waves)
- [ ] More upgrade types (auto-turret checkpoints, slower Hasina summons, …)
- [ ] Endless mode vs. campaign with set levels per border district
