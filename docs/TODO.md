# TODO / known issues

Keep this current: remove items when done (and note them in CHANGELOG.md), add bugs
you notice but don't fix. The longer feature wishlist is in README.md → "Roadmap / ideas".

## Repo / deploy
- [x] `main` branch created and pushed (2026-11-09).
- [x] GitHub Pages enabled with source "GitHub Actions" (2026-11-09).
- [x] `main` allowed to deploy; site live at https://mrashidbd.github.io/hasina-game/ (2026-11-09).
- [ ] Make `main` the repo's default branch (still `claude/modest-bohr-vzpqz0`) and then
      retire the old branch. Note the old branch can no longer deploy to Pages.

## Known issues / rough edges (found in code review, 2026-11-05)
- [ ] Power-up descriptions in the how-to ("Freezes everyone for 4s") show base values,
      not values boosted by the Cold Storage perk.
- [ ] Gameplay pass 1 (warnings, perks, splitter) not yet balance-tested on a real phone.
- [ ] No automated tests. Pure logic (map geometry, `multiplier`, `isMainWave`, wave
      formulas) could be unit-tested with `node --test` without a build step.
- [ ] `spawnPoint()` can return `null` after 40 tries, silently dropping that intruder
      (wave still clears). Unlikely, but worth knowing when tuning spawn constants.

## v2 follow-ups
- [ ] Full-body sprite sizing (`CONFIG.sprites.heightMul/feetOffset`) was only tested with a
      stand-in image; tune once real art exists.
- [ ] Music keeps playing on the pause / upgrade screens (only game over stops it).
- [ ] Hero size (64 px) is large next to small intruders on phones; tune `CONFIG.kick.heroSizePx`
      after real art arrives.
- [ ] Map: tiny islands such as St Martin's are dropped by the area threshold in
      `tools/build-map.mjs`; add an explicit keep-list if wanted.

## Share loop (PLAN-v3 phase 1)
- [ ] Test sharing on real phones: Android Chrome, iOS Safari, Facebook/Messenger in-app browsers.
- [ ] After deploy, run the Facebook Sharing Debugger on the live URL (and a `?c=` URL) to refresh
      the cached preview.
- [ ] User to review the Bangla headlines, ranks and challenge text in `js/i18n.js`.
- [ ] Rank thresholds (`CONFIG.share`) are guesses; tune after play-testing.
- [ ] The UI (not the cards) still relies on the device's Bangla font; old Windows/Android may
      render it poorly. Consider using "KTO Bangla" for UI headings too.

## Art v3 / sprite animation (2026-11-18)
- [x] Masters for all 17 + clips for Hasina and the 5 seniors + tier-3 P1 sheets (generated in Flow, 2026-11-18).
- [x] Frame tool `tools/build-frames.mjs` (key, slice, align feet/head, 256 px WebP strips; frames from MP4). 63 strips built 2026-11-19.
- [x] Engine: frame animation for enemies (2026-11-19). Heroes still use stills.
- [ ] Strip weight: ~3.2 MB total (walk strips preload ~0.9 MB). Consider 192 px or lower WebP quality if load time on 3G hurts.
- [ ] Real-phone check of the animations (frame rate, look at small sizes).
- [x] `maruf` folder renamed to `murad` by the user (Murad Hasan photos); prompts updated.
- [x] All 33 tier-3 sheets downloaded to `art-src/enemies/<id>/<anim>-sheet.jpg` (2026-11-19).
- [ ] Optional: redo `emerge` for `quader` and `taposh` (they don't rise from below).
- [x] Hero masters + sheets generated in Flow (2026-11-19) → `art-src/heroes/<id>/`.
- [x] Heroes in game (2026-11-19): magenta keying in build-frames, 20 hero strips + new stills, played in `drawKick` and the Rope 'Em! hero.

## Content placeholders (user to decide)
- [ ] Art and sound files for all characters (prompts in `docs/prompts/`; drop into `assets/`, run `node tools/build-assets.mjs`).

## Rope 'Em! mode (branch `lasso`)
- [ ] Play-test v2 balance on a phone: sneak interval/speed, lurker speeds, Hasina pull
      (`mainPullMul`), `mainAfterLocked`, level pace.
- [ ] On narrow portrait phones little Indian land is on screen, so lurkers crowd the left
      and right edges; consider a lurk band that hugs the border more tightly there.
- [x] Live: `lasso` merged into `main` (2026-11-12).
- [ ] Rope sounds (throw whoosh, loop tighten, snap) are not in `docs/prompts/sound-design.md`
      yet; the mode reuses `tap`, `hit` and `leak`.
- [ ] Ideas: perks for this mode, an endless variant, letting the player drag the hero.

## Art (2026-11-12)
- [x] All 21 characters generated (user, Google Flow) and keyed.
- [ ] The sprites total ~2.5 MB of PNG (384 px). If load time on mobile data matters, try
      256 px (`node tools/chroma-key.mjs --size 256`) or add WebP support to the manifest.
- [ ] Hero cards and the how-to roster show the whole tiny body in a small circle; a
      head-and-shoulders crop would read better there.
- [ ] Optional extra poses (`kicked`, hero `kick`) could be generated later for even more life.
