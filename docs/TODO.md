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

## Content placeholders (user to decide)
- [ ] Real names / art for tier 2 and tier 3 characters — roster names given 2026-11-09, wiring in plan phase E (`js/data/enemies.js`, `char.*` in `js/i18n.js`).
