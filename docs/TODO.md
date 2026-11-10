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

## Content placeholders (user to decide)
- [ ] Art and sound files for all characters (prompts in `docs/prompts/`; drop into `assets/`, run `node tools/build-assets.mjs`).

## Rope 'Em! mode (branch `lasso`)
- [ ] Play-test v2 balance on a phone: sneak interval/speed, lurker speeds, Hasina pull
      (`mainPullMul`), `mainAfterLocked`, level pace.
- [ ] On narrow portrait phones little Indian land is on screen, so lurkers crowd the left
      and right edges; consider a lurk band that hugs the border more tightly there.
- [ ] Not live yet: merge `lasso` into `main` when the user approves.
- [ ] Rope sounds (throw whoosh, loop tighten, snap) are not in `docs/prompts/sound-design.md`
      yet; the mode reuses `tap`, `hit` and `leak`.
- [ ] Ideas: perks for this mode, an endless variant, letting the player drag the hero.

