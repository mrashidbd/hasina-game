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
| `js/map.js` | Simplified outline of Bangladesh (lon/lat) tagged by border type (India / Myanmar / coast), projection, geometry helpers |
| `js/characters.js` | **Roster and balance**: names, emoji, sprites, HP, speed, points; power-ups |
| `js/game.js` | Game engine: waves, spawning, movement, input, scoring, rendering |
| `js/audio.js` | Synthesized sound effects (WebAudio, no files) |
| `js/main.js` | UI wiring, high score (localStorage), share, install prompt, SW registration |
| `sw.js` / `manifest.webmanifest` / `icons/` | PWA: offline cache, install metadata, icons |

---

# Game design

## Core loop
1. A wave starts and intruders spawn **outside the India-facing border**: west, north and east.
   They don't come from the sea or the Myanmar side.
2. Each one walks to a point on the border and then heads for Dhaka.
3. The player **taps or clicks** intruders to catch them. Tough ones take several taps, and each
   hit knocks them back a little.
4. If an intruder's body crosses the border: a **🛡️ shield** absorbs it if you have one.
   Otherwise it's **game over**.
5. When a wave is cleared there's a bonus and a short break, then the next, harder wave starts.

## Intruders (placeholders)

| Type | Taps | Speed | Points | Appears | Notes |
|---|---|---|---|---|---|
| 😠 Cadre | 1 | normal | 10 | wave 1 | The basic one |
| 🏃 Runner | 1 | fast | 20 | wave 2 | Zig-zags |
| 😤 Leader | 3 | slow | 50 | wave 3 | Has an HP bar and gets knocked back when hit |
| 🥷 Sneaky | 1 | normal | 30 | wave 4 | Fades in and out of view |
| 👑 Boss | 12 (+4 every 5 waves) | very slow | 250 | every 5th wave | Calls in cadres, always drops a power-up |

## Point system

| Source | Points |
|---|---|
| Catch | Base points × **combo multiplier** |
| Combo | Catches less than 1.5 s apart build a combo. Multiplier = 1 + ⌊(combo−1)/5⌋, up to **×5**. A missed tap resets it |
| Close call | **+25** for catching an intruder within ~12 km of the border |
| Wave clear | **+50 × wave number** |
| Sharpshooter | **+25 × wave number** if accuracy in that wave is ≥ 90% |
| Sweep catches | **50%** of base points, with no multiplier |

High score and best wave are saved on the device.

## Difficulty curve
- Intruders per wave: `5 + 1.8 × wave`
- Spawn interval: `1.5 s × 0.92^(wave−1)`, minimum 0.3 s. From wave 6 there's a 20% chance of a double spawn.
- Speed multiplier: `1 + 0.07 × (wave−1)`, capped at ×2.1
- Tougher types become more common as waves go up. One extra boss is added every 15 waves.

## Power-ups
Any catch has a 7% chance to drop one, and bosses always drop one. Tap a power-up to collect it.
It disappears after 6 s.

| | Effect |
|---|---|
| ❄️ Freeze | All intruders stop for 4 s |
| 🧱 Border Wall | Intruders move at 40% speed for 7 s |
| 🛡️ Shield | Absorbs one breach (stack up to 3) |
| ⚡ Charge | +40 to the Sweep meter |

**⚡ Sweep** (button, or <kbd>Space</kbd>): fills as you catch intruders. When it's full, it catches
everyone on screen at once. Bosses take 4 damage instead.

## Controls
- Mobile: tap
- Desktop: click. <kbd>Space</kbd> sweeps, <kbd>P</kbd>/<kbd>Esc</kbd> pauses, <kbd>Enter</kbd> starts.
- The game pauses automatically when the app goes to the background.

## Swapping in real characters
In `js/characters.js`, set `sprite: 'assets/<name>.png'` on any character. A square PNG works best.
It's drawn clipped to the character's circle, and the emoji is used only when no sprite is set.
Change `name` to rename a character in the how-to table and on the game-over screen.
Add new files to `ASSETS` in `sw.js` so they work offline.

## Roadmap / ideas
- [ ] Real character art and a proper flag/border art pass
- [ ] Background music and Bangla voice lines ("Dhoro!", "Palao!")
- [ ] Bangla language toggle (UI text is all in `index.html` / `main.js`)
- [ ] More accurate border outline (GeoJSON simplified with mapshaper)
- [ ] Online leaderboard (e.g. Supabase or Firebase) and a daily challenge seed
- [ ] More intruder types: one that splits in two when caught, a decoy that costs points if you tap it, one that tunnels underground
- [ ] Upgrades between waves, bought with points (wider tap radius, longer freeze, auto-turret checkpoints)
- [ ] Endless mode vs. campaign with set levels per border district
